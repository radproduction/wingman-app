'use strict';

const { db } = require('../db');
const usersRepo = require('../db/users');
const t = require('../utils/time');

/**
 * The behaviour layer — what Wingman OBSERVES about how a person actually
 * operates, derived from their real activity in the database, NOT from what they
 * typed about themselves (that is behaviorLearner's job). This is the difference
 * between "Aamir has bills with K-Electric" (he told us) and "Aamir usually pays
 * 2 days after the due date" (we watched it happen).
 *
 * Everything here is cheap local SQLite aggregation — no LLM, no network. The
 * result feeds two places: the chat system prompt (so replies are well-timed and
 * realistic) and the proactive brain (so nudges land in active hours and bill
 * reminders fire at the lead time that actually works for this person).
 *
 * Honest about thin data: each pattern is only reported once there's ENOUGH of
 * it to be real. A brand-new user gets an empty result, not a guess.
 */

// Recompute at most this often per user — patterns move slowly, and the system
// prompt is built on every message, so we don't want a burst of queries per turn.
const TTL_MS = 30 * 60 * 1000;
const cache = new Map(); // userId -> { at, result }

/** Parse a SQLite UTC datetime ('YYYY-MM-DD HH:MM:SS') into a Date. */
function utcDate(s) {
  if (!s) return null;
  const str = String(s).trim().replace(' ', 'T');
  const d = new Date(str.endsWith('Z') || /[+-]\d\d:\d\d$/.test(str) ? str : str + 'Z');
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "9am", "12pm", "3pm" for an hour 0-23. */
function hourLabel(h) {
  const hr = ((h % 24) + 24) % 24;
  if (hr === 0) return '12am';
  if (hr === 12) return '12pm';
  return hr < 12 ? `${hr}am` : `${hr - 12}pm`;
}

/** Merge a set of hours into readable contiguous ranges, e.g. "9am–12pm". */
function rangesFrom(hours) {
  const sorted = [...hours].sort((a, b) => a - b);
  const ranges = [];
  let start = null;
  let prev = null;
  for (const h of sorted) {
    if (start === null) { start = h; prev = h; continue; }
    if (h === prev + 1) { prev = h; continue; }
    ranges.push([start, prev]);
    start = h; prev = h;
  }
  if (start !== null) ranges.push([start, prev]);
  // Label as [start .. end+1) so a single active hour "9" reads "9am–10am".
  return ranges.map(([a, b]) => `${hourLabel(a)}–${hourLabel(b + 1)}`);
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** When, in local time, does this user actually engage? (from inbound messages) */
function activeHours(userId, tz) {
  const rows = db.prepare(
    "SELECT created_at FROM conversations WHERE user_id = ? AND role = 'user' ORDER BY created_at DESC LIMIT 800"
  ).all(userId);
  if (rows.length < 20) return null; // not enough to be real

  const counts = new Array(24).fill(0);
  for (const r of rows) {
    const d = utcDate(r.created_at);
    if (d) counts[t.hourInTz(tz, d)] += 1;
  }
  const total = counts.reduce((a, b) => a + b, 0);
  if (!total) return null;
  const peak = Math.max(...counts);

  // "Active" = hours carrying a meaningful share of their activity.
  const activeThreshold = Math.max(2, peak * 0.4);
  const active = [];
  for (let h = 0; h < 24; h++) if (counts[h] >= activeThreshold) active.push(h);

  // Quiet stretches DURING waking hours only (night silence is obvious, not a signal).
  const quiet = [];
  for (let h = 7; h <= 22; h++) if (counts[h] <= peak * 0.08) quiet.push(h);

  return {
    activeRanges: rangesFrom(active).slice(0, 3),
    quietRanges: rangesFrom(quiet).filter((_, i, arr) => arr.length <= 3 || i < 2),
    sample: rows.length,
  };
}

/** How fast do they reply to Wingman? (gap from an assistant msg to their next). */
function responsiveness(userId) {
  const rows = db.prepare(
    "SELECT role, created_at FROM conversations WHERE user_id = ? AND role IN ('user','assistant') ORDER BY created_at ASC LIMIT 1500"
  ).all(userId);
  const gaps = [];
  for (let i = 0; i < rows.length - 1; i++) {
    if (rows[i].role !== 'assistant') continue;
    // find the next user message
    for (let j = i + 1; j < rows.length; j++) {
      if (rows[j].role === 'assistant') break; // no reply before the next Wingman msg
      const a = utcDate(rows[i].created_at);
      const b = utcDate(rows[j].created_at);
      if (a && b) {
        const mins = (b - a) / 60000;
        if (mins >= 0 && mins <= 360) gaps.push(mins); // within 6h counts as "a reply"
      }
      break;
    }
  }
  if (gaps.length < 10) return null;
  return { medianMinutes: Math.round(median(gaps)), sample: gaps.length };
}

/** Do they follow through on tasks, and on time? */
function taskFollowThrough(userId) {
  let rows;
  try {
    rows = db.prepare('SELECT completed, completed_at, due_date, created_at FROM tasks WHERE user_id = ?').all(userId);
  } catch (_) { return null; }
  if (rows.length < 5) return null;

  const done = rows.filter((r) => Number(r.completed) === 1);
  const rate = Math.round((done.length / rows.length) * 100);

  const delays = [];
  for (const r of done) {
    if (!r.due_date || !r.completed_at) continue;
    const due = utcDate(r.due_date) || utcDate(`${String(r.due_date).slice(0, 10)} 23:59:59`);
    const at = utcDate(r.completed_at);
    if (due && at) delays.push((at - due) / 86400000); // days; +ve = late
  }
  const medDelay = delays.length >= 5 ? median(delays) : null;
  return { completionRate: rate, total: rows.length, medianDelayDays: medDelay };
}

/** Does this user pay bills early / on time / late? (needs paid_at, accumulates.) */
function billTiming(userId) {
  let rows;
  try {
    rows = db.prepare(
      "SELECT due_date, paid_at FROM bills WHERE user_id = ? AND status = 'paid' AND paid_at IS NOT NULL AND due_date IS NOT NULL"
    ).all(userId);
  } catch (_) { return null; }
  const diffs = [];
  for (const r of rows) {
    const due = utcDate(`${String(r.due_date).slice(0, 10)} 00:00:00`);
    const paid = utcDate(r.paid_at);
    if (due && paid) diffs.push((paid - due) / 86400000); // +ve = paid after due
  }
  if (diffs.length < 3) return null; // honest: not enough history yet
  return { medianDays: Math.round(median(diffs)), sample: diffs.length };
}

/** Turn the raw patterns into short, plain lines for a prompt. */
function toLines(p) {
  const lines = [];
  if (p.active) {
    if (p.active.activeRanges.length) lines.push(`Most active around ${p.active.activeRanges.join(', ')} (local time).`);
    if (p.active.quietRanges.length) lines.push(`Usually quiet ${p.active.quietRanges.join(', ')} — avoid non-urgent pings then.`);
  }
  if (p.responsiveness) {
    const m = p.responsiveness.medianMinutes;
    const how = m <= 5 ? 'replies almost immediately' : m <= 30 ? `usually replies within ~${m} min` : m <= 120 ? `often takes ~${Math.round(m / 60)}h to reply` : 'often replies hours later';
    lines.push(`When you message them, they ${how}.`);
  }
  if (p.tasks) {
    const r = p.tasks.completionRate;
    let s = `Completes about ${r}% of tasks`;
    if (p.tasks.medianDelayDays != null) {
      const d = p.tasks.medianDelayDays;
      s += d <= -1 ? `, usually ${Math.abs(Math.round(d))} day(s) early` : d < 1 ? ', usually on time' : `, usually ~${Math.round(d)} day(s) late`;
    }
    lines.push(s + '.');
  }
  if (p.bills) {
    const d = p.bills.medianDays;
    const s = d <= -1 ? `pays bills ~${Math.abs(d)} day(s) before they're due` : d <= 0 ? 'pays bills on/around the due date' : `pays bills ~${d} day(s) after the due date — remind earlier`;
    lines.push(`On money, they ${s}.`);
  }
  return lines;
}

/**
 * The observed behaviour for a user. Returns { lines: string[], data: {...} }.
 * Cheap and cached; safe to call on every message.
 */
function computeForUser(userId, { now = new Date(), fresh = false } = {}) {
  const hit = cache.get(userId);
  if (!fresh && hit && now.getTime() - hit.at < TTL_MS) return hit.result;

  const user = usersRepo.getById(userId);
  const tz = (user && user.timezone) || 'Asia/Karachi';

  const data = {};
  try { data.active = activeHours(userId, tz); } catch (_) { data.active = null; }
  try { data.responsiveness = responsiveness(userId); } catch (_) { data.responsiveness = null; }
  try { data.tasks = taskFollowThrough(userId); } catch (_) { data.tasks = null; }
  try { data.bills = billTiming(userId); } catch (_) { data.bills = null; }

  const result = { lines: toLines(data), data };
  cache.set(userId, { at: now.getTime(), result });
  return result;
}

/** Convenience: just the prompt block (or '' when nothing observed yet). */
function promptBlock(userId, firstName = 'them') {
  let lines = [];
  try { lines = computeForUser(userId).lines; } catch (_) { return ''; }
  if (!lines.length) return '';
  return `
--- OBSERVED BEHAVIOUR (${firstName}, watched from real activity — not what they told you) ---
${lines.map((l) => `- ${l}`).join('\n')}
Use this to TIME and PITCH things well: don't push non-urgent messages into their quiet hours, remind earlier about things they handle late, and set realistic expectations. It is an observed tendency, not a rule — what they ask for right now always wins, and never recite it back at them.`;
}

module.exports = { computeForUser, promptBlock, _internals: { rangesFrom, hourLabel, median, utcDate } };
