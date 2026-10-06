'use strict';

/**
 * Onboarding analyzer — "getting to know you".
 *
 * When a user connects their accounts, Wingman does a first-run deep read across
 * everything it can see — Gmail, Calendar, Tasks, health/wearables, and business
 * signals — and distils it into DURABLE facts about the person. Those facts land
 * in user_memory (which is already injected into every system prompt), so the
 * assistant is calibrated from day one instead of starting cold.
 *
 * There is a 7-day calibration window: a quick pass runs immediately (so Wingman
 * is useful right away), deeper passes refine it over the week, and at the end
 * Wingman sends a short "here's what I learned about you" summary. During the
 * window it also asks a few specific, data-grounded confirming questions.
 *
 * State lives in users.preferences.onboarding (no schema migration needed):
 *   { status, startedAt, calibrationUntil, lastPassDate, welcomeSentAt,
 *     summarySentAt, profile, pendingQuestions[], askedQuestions[] }
 *
 * Everything here is best-effort: a source that isn't connected is skipped, and
 * no failure is ever allowed to break sign-in or the schedulers.
 */

const claude = require('../llm/claude');
const config = require('../config');
const usersRepo = require('../db/users');
const memory = require('../db/userMemory');
const tasksRepo = require('../db/tasks');
const gmail = require('./gmail');
const calendar = require('./calendar');
const health = require('./health');
const googleTasks = require('./googleTasks');
const nowHrms = require('./nowHrmsData');
const followupTracker = require('./followupTracker');
const googleAuth = require('../auth/googleAuth');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

const WINDOW_DAYS = 7;
const VALID_CATEGORIES = new Set(['preference', 'habit', 'relationship', 'project', 'context']);
// Only message the user during waking hours (their local time).
const ACTIVE_FROM = 9;
const ACTIVE_TO = 21;

// ── state helpers (preferences.onboarding) ─────────────────────────────
function getState(user) {
  return (user && user.preferences && user.preferences.onboarding) || null;
}
function setState(userId, patch) {
  const u = usersRepo.getById(userId);
  if (!u) return;
  const cur = (u.preferences && u.preferences.onboarding) || {};
  usersRepo.updatePreferences(userId, { onboarding: { ...cur, ...patch } });
}
function firstName(user) {
  const n = String(user.name || '').trim().split(/\s+/)[0];
  return n ? ` ${n}` : '';
}

// ── JSON parsing (tolerant of fences/prose) ────────────────────────────
function parseJson(raw) {
  if (!raw) return {};
  let s = String(raw).replace(/```json|```/g, '').trim();
  const a = s.indexOf('{'); const b = s.lastIndexOf('}');
  if (a === -1 || b === -1) return {};
  try { return JSON.parse(s.slice(a, b + 1)); } catch (_) { return {}; }
}

// ── data digests (fetch, no LLM) ───────────────────────────────────────

// Returns { text, sentEmails: [{id, subject, sender, body}] } — sentEmails feed
// the follow-up extractor. `depth` caps how much we pull.
async function gmailDigest(user, depth) {
  if (!googleAuth.isEmailConnected(user)) return { text: '', sentEmails: [] };
  const recvN = depth === 'deep' ? 35 : 20;
  const sentN = depth === 'deep' ? 18 : 10;
  const lines = [];
  const sentEmails = [];

  async function pull(query, max, tag, keepBody) {
    let ids = [];
    try { ids = await gmail.listMessageIds(user, { maxResults: max, query }); }
    catch (_) { return; }
    for (const id of ids.slice(0, max)) {
      try {
        const m = await gmail.getMessage(user, id);
        if (!m) continue;
        lines.push(`[${tag}] from:${(m.sender || '').slice(0, 80)} | subj:${(m.subject || '').slice(0, 90)} | ${(m.snippet || '').slice(0, 120)}`);
        if (keepBody) sentEmails.push({ id: m.gmailId || id, subject: m.subject, sender: m.sender, body: m.body || m.snippet || '' });
      } catch (_) { /* skip one bad message */ }
    }
  }

  await pull('in:inbox newer_than:60d', recvN, 'received', false);
  await pull('in:sent newer_than:60d', sentN, 'sent', true);
  return { text: lines.join('\n'), sentEmails };
}

async function calendarDigest(user) {
  try {
    const from = new Date(Date.now() - 60 * 86400 * 1000).toISOString();
    const to = new Date(Date.now() + 21 * 86400 * 1000).toISOString();
    const { events } = await calendar.getEvents(user.id, { from, to });
    if (!events || !events.length) return '';
    return events.slice(0, 60).map((e) => {
      const when = (e.startTime || '').slice(0, 16).replace('T', ' ');
      const who = (e.attendees || []).slice(0, 4).join(', ');
      return `${when} | ${(e.title || 'untitled').slice(0, 70)}${who ? ' | with: ' + who : ''}${e.location ? ' | @' + String(e.location).slice(0, 40) : ''}`;
    }).join('\n');
  } catch (_) { return ''; }
}

async function tasksDigest(user) {
  try {
    if (googleTasks.isConnected(user)) { try { await googleTasks.syncUser(user.id); } catch (_) {} }
    const tasks = tasksRepo.listForUser(user.id, { includeCompleted: true, limit: 60 });
    if (!tasks || !tasks.length) return '';
    const open = tasks.filter((x) => !x.completed).slice(0, 25).map((x) => `- [ ] ${x.title}`);
    const done = tasks.filter((x) => x.completed).length;
    return `${open.join('\n')}\n(open: ${tasks.length - done}, completed recently: ${done})`;
  } catch (_) { return ''; }
}

function businessDigest(user) {
  const bits = [];
  if (user.shopify_domain && user.shopify_token) bits.push(`Runs a Shopify store (${user.shopify_domain}).`);
  try { if (nowHrms.connected(user)) bits.push('Uses NOW HRMS for work (an employee at a company).'); } catch (_) {}
  const domains = new Set();
  if (user.work_employee_ref && user.work_employee_ref.includes('@')) domains.add(user.work_employee_ref.split('@')[1]);
  if (user.webmail_address && user.webmail_address.includes('@')) domains.add(user.webmail_address.split('@')[1]);
  try {
    const accts = require('../db/googleAccounts').listForUser(user.id) || [];
    for (const a of accts) if (a.email && a.email.includes('@')) domains.add(a.email.split('@')[1]);
  } catch (_) {}
  const work = [...domains].filter((d) => d && !/gmail\.com|googlemail\.com|outlook\.com|hotmail\.com|yahoo\.com/i.test(d));
  if (work.length) bits.push(`Work email domain(s): ${work.join(', ')}.`);
  if (user.runs_business) bits.push('Marked as running a business.');
  return bits.join(' ');
}

function healthDigest(user) {
  try {
    const st = health.connectionStatus(user);
    if (!st || !st.connected) return '';
    const line = health.summaryLine(user.id);
    return `Health connected (${(st.sources || []).join(', ') || 'wearable'})${line ? ': ' + line : ''}.`;
  } catch (_) { return ''; }
}

// ── follow-ups: seed the followups table from the user's sent mail ─────
async function seedFollowups(user, sentEmails) {
  if (!sentEmails || !sentEmails.length) return 0;
  const todayDate = new Date().toISOString().slice(0, 10);
  let created = 0;
  for (const e of sentEmails.slice(0, 15)) {
    try {
      created += await followupTracker.processEmail(user.id, { id: e.id, subject: e.subject, sender: e.sender }, {
        body: e.body, userIsSender: true, todayDate,
      });
    } catch (_) { /* best-effort */ }
  }
  return created;
}

// ── the synthesis LLM call ─────────────────────────────────────────────
const SYNTH_SYSTEM = `You build a concise profile of a person for their AI personal assistant, using real data pulled from their connected accounts (email, calendar, tasks, health, business). Extract only DURABLE facts — things still true next week — and be accurate, never guessing.

Reply with ONLY compact JSON, no prose, no code fences:
{
  "facts": [ { "fact": "<short third-person statement>", "category": "preference|habit|relationship|project|context" } ],
  "questions": [ "<a short, specific yes/no question the assistant can ask to confirm something it inferred>" ],
  "profile": "<3-5 sentence summary of who this person is: their work, the key people around them, how they operate, and what matters to them>"
}

Rules:
- category: preference (how they like things), habit (recurring behaviour), relationship (a recurring person and who they are), project (ongoing work), context (stable situation like city/role/business).
- Prefer specifics from the data: real names of frequent contacts, real working hours implied by their calendar, the business they run, their commute, their projects.
- Questions must reference something concrete (a name, a time, a pattern) and be answerable yes/no, e.g. "Looks like you email Aamir most — is he your boss? Want me to always flag his emails?" Max 4 questions.
- Max 15 facts. No duplicates. No guesses. If a source is empty, ignore it.`;

async function synthesize(user, digests) {
  const parts = [];
  if (digests.gmail) parts.push(`RECENT EMAIL (subjects/senders/snippets):\n${digests.gmail}`);
  if (digests.calendar) parts.push(`CALENDAR (past 60d + next 3w):\n${digests.calendar}`);
  if (digests.tasks) parts.push(`TASKS:\n${digests.tasks}`);
  if (digests.business) parts.push(`BUSINESS SIGNALS:\n${digests.business}`);
  if (digests.health) parts.push(`HEALTH:\n${digests.health}`);
  if (!parts.length) return { facts: [], questions: [], profile: '' };

  const known = memory.listForUser(user.id, 40).map((r) => `- ${r.fact}`).join('\n');
  const prompt = `Here is what is already known about this user (do not repeat these):\n${known || '(nothing yet)'}\n\nHere is the data pulled from their accounts:\n\n${parts.join('\n\n')}\n\nExtract the profile now.`;

  let raw;
  try {
    raw = await claude.complete(prompt, { system: SYNTH_SYSTEM, model: config.anthropic.modelDeep, maxTokens: 2000 });
  } catch (err) {
    console.warn('[onboarding] synthesis failed:', err.message);
    return { facts: [], questions: [], profile: '' };
  }
  const out = parseJson(raw);
  return {
    facts: Array.isArray(out.facts) ? out.facts : [],
    questions: Array.isArray(out.questions) ? out.questions.filter((q) => typeof q === 'string') : [],
    profile: typeof out.profile === 'string' ? out.profile.trim() : '',
  };
}

// ── one analysis pass ──────────────────────────────────────────────────
async function analyzeUser(user, { depth = 'quick', seedFollow = false } = {}) {
  const [gm, cal, tsk] = await Promise.all([
    gmailDigest(user, depth),
    calendarDigest(user),
    tasksDigest(user),
  ]);
  const digests = {
    gmail: gm.text, calendar: cal, tasks: tsk,
    business: businessDigest(user), health: healthDigest(user),
  };

  if (seedFollow) { try { await seedFollowups(user, gm.sentEmails); } catch (_) {} }

  const { facts, questions, profile } = await synthesize(user, digests);
  let added = 0;
  for (const f of facts.slice(0, 15)) {
    if (!f || !f.fact) continue;
    const category = VALID_CATEGORIES.has(f.category) ? f.category : 'context';
    try { if (memory.add(user.id, { fact: f.fact, category, source: 'learned' }).added) added += 1; } catch (_) {}
  }
  return { added, questions, profile };
}

// ── messages ───────────────────────────────────────────────────────────
async function send(user, text, logLabel) {
  try { if (wa().ready()) await wa().sendProactiveMessage(user, text, { logLabel }); }
  catch (err) { console.warn(`[onboarding] send (${logLabel}) failed:`, err.message); }
}

function welcomeText(user) {
  return `Hey${firstName(user)} — I'm getting set up for you. 🙌\n\n`
    + `I'm going to study your inbox, calendar and tasks so I actually understand your world — who matters, what's on, and what's pending — instead of asking you obvious things. Here's how it goes:\n\n`
    + `• Next few minutes — a first look.\n`
    + `• Each day this week — I go a bit deeper, and may ask you one quick question to confirm what I'm seeing.\n`
    + `• In 7 days — I'll send you a short "here's what I've learned about you", and after that I keep it fresh every week.\n\n`
    + `You can start using me right away; I just get sharper as I learn.`;
}

// Ask the next unasked confirming question, if any. Returns true if one was sent.
async function askNextQuestion(user) {
  const st = getState(user) || {};
  const pending = (st.pendingQuestions || []).filter((q) => !(st.askedQuestions || []).includes(q));
  if (!pending.length) return false;
  const q = pending[0];
  await send(user, q, 'onboarding-q');
  setState(user.id, { askedQuestions: [...(st.askedQuestions || []), q] });
  return true;
}

// ── public: kick off on connect ────────────────────────────────────────
async function start(userId) {
  const user = usersRepo.getById(userId);
  if (!user) return;
  const st = getState(user);
  // Don't restart if already running or finished.
  if (st && (st.status === 'analyzing' || st.status === 'done')) return;

  const now = new Date();
  const calibrationUntil = new Date(now.getTime() + WINDOW_DAYS * 86400 * 1000).toISOString();
  setState(userId, { status: 'analyzing', startedAt: now.toISOString(), calibrationUntil });

  await send(user, welcomeText(user), 'onboarding-welcome');
  setState(userId, { welcomeSentAt: now.toISOString() });

  try {
    const { questions, profile } = await analyzeUser(user, { depth: 'quick', seedFollow: true });
    setState(userId, {
      status: 'calibrating',
      pendingQuestions: (questions || []).slice(0, 4),
      profile: profile || '',
      lastPassDate: t.dateKeyInTz(user.timezone || 'Asia/Karachi', now),
    });
    // Ask one high-value question up front (re-read user for fresh state).
    const fresh = usersRepo.getById(userId);
    if (fresh) await askNextQuestion(fresh);
  } catch (err) {
    console.warn('[onboarding] first pass failed:', err.message);
    setState(userId, { status: 'calibrating' }); // don't get stuck
  }
}

function finalSummaryText(user, profile) {
  const p = profile && profile.trim()
    ? profile.trim()
    : "I've gone through your inbox, calendar and tasks and have a good feel for your day-to-day now.";
  return `Okay${firstName(user)}, I think I've got a good sense of you now. 🙌\n\n${p}\n\n`
    + `I'll use this to actually be useful. If I got anything wrong, just tell me and I'll fix it.`;
}

// ── public: scheduler tick (drives the 7-day window) ───────────────────
async function runDueUsers({ now = new Date() } = {}) {
  let users = [];
  try { users = usersRepo.listAll(); } catch (_) { return { processed: 0 }; }
  let processed = 0;
  let refreshed = 0; // weekly refreshes this tick (kept small — each is an LLM pass)

  for (const u of users) {
    const st = getState(u);
    // After the first week, keep the picture fresh: one quiet deep pass a week
    // (no message), so the profile and learned facts don't go stale.
    if (st && st.status === 'done') {
      try {
        const last = Date.parse(st.refreshedAt || st.summarySentAt || 0) || 0;
        if (now.getTime() - last > 7 * 86400 * 1000 && refreshed < 2) {
          refreshed += 1;
          const { profile } = await analyzeUser(u, { depth: 'deep', seedFollow: false });
          setState(u.id, { refreshedAt: now.toISOString(), profile: profile || st.profile || '' });
        }
      } catch (err) {
        console.warn(`[onboarding] weekly refresh failed for ${u.id}:`, err.message);
      }
      continue;
    }
    if (!st || st.status !== 'calibrating') continue;

    const tz = u.timezone || 'Asia/Karachi';
    const hour = t.hourInTz(tz, now);
    if (hour < ACTIVE_FROM || hour >= ACTIVE_TO) continue; // no 3am messages

    const dayKey = t.dateKeyInTz(tz, now);
    const finished = st.calibrationUntil && new Date(st.calibrationUntil).getTime() <= now.getTime();

    try {
      if (finished) {
        // Final deep pass + summary, then done.
        const { profile } = await analyzeUser(u, { depth: 'deep', seedFollow: false });
        const summary = profile || st.profile || '';
        await send(u, finalSummaryText(u, summary), 'onboarding-summary');
        setState(u.id, { status: 'done', summarySentAt: now.toISOString(), profile: summary || st.profile || '' });
        processed += 1;
      } else if (st.lastPassDate !== dayKey) {
        // One refining pass per day, then ask the next question.
        const { questions, profile } = await analyzeUser(u, { depth: 'deep', seedFollow: false });
        const merged = [...(st.pendingQuestions || [])];
        for (const q of (questions || [])) if (!merged.includes(q)) merged.push(q);
        setState(u.id, { lastPassDate: dayKey, pendingQuestions: merged.slice(0, 6), profile: profile || st.profile || '' });
        const fresh = usersRepo.getById(u.id);
        if (fresh) await askNextQuestion(fresh);
        processed += 1;
      }
    } catch (err) {
      console.warn(`[onboarding] tick failed for ${u.id}:`, err.message);
    }
  }
  return { processed };
}

module.exports = { start, runDueUsers, analyzeUser };
