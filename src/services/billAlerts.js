'use strict';

const usersRepo = require('../db/users');
const billsRepo = require('../db/bills');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

function fmtAmount(b) {
  return `${b.currency || 'PKR'} ${Number(b.amount || 0).toLocaleString('en-US')}`;
}

// Don't re-nag about the same bill more than once every few days, and never
// send more than one message \u2014 a digest, capped so it's never a wall of pings.
const REMIND_EVERY_DAYS = 3;
const MAX_IN_DIGEST = 8;
// Stop chasing a single bill after a few nudges \u2014 if it's still unpaid after
// this many reminders, going on is nagging, not helping. (The user pays it in
// real life; Wingman may not have a payment receipt to confirm it.)
const MAX_REMINDERS = 3;
// And drop bills that are so far past due they're clearly settled outside
// Wingman or no longer relevant \u2014 don't resurrect months-old invoices.
const STALE_AFTER_DAYS = 14;

/**
 * Build ONE digest of the bills that genuinely need the user (real amount,
 * overdue or due within 3 days), skipping zero-amount notices and bills we
 * already alerted about recently. Sends a single message, not one per bill.
 */
async function alertForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { alerts: [], count: 0 };
  const tz = user.timezone || 'Asia/Karachi';
  const todayStart = t.startOfDayISO(tz, 0, now);
  const todayDate = todayStart.slice(0, 10);
  const offset = todayStart.slice(-6);

  const pending = billsRepo.listForUser(user.id, { status: 'pending' });
  const due = [];

  for (const b of pending) {
    if (!b.due_date) continue;
    // Skip $0 / PKR 0 notices (free-tier receipts, not real bills to pay).
    if (!(Number(b.amount) > 0)) continue;
    // Stop after a few nudges — a still-unpaid bill isn't chased forever.
    if ((b.reminder_count || 0) >= MAX_REMINDERS) continue;
    // Throttle: don't re-alert a bill we already pinged within the last few days.
    if (b.last_alerted_at) {
      const since = t.daysBetween(`${String(b.last_alerted_at).slice(0, 10)}T00:00:00${offset}`, todayStart);
      if (since < REMIND_EVERY_DAYS) continue;
    }
    const days = t.daysBetween(todayStart, `${b.due_date}T00:00:00${offset}`);
    // Don't resurrect long-overdue invoices — assume settled outside Wingman.
    if (days < -STALE_AFTER_DAYS) continue;
    if (days < 0) {
      due.push({ b, days, line: `\u26a0\ufe0f ${b.name} \u2014 ${fmtAmount(b)} (overdue ${Math.abs(days)}d)` });
    } else if (days <= 3) {
      const when = days === 0 ? 'due today' : `due in ${days}d`;
      due.push({ b, days, line: `\ud83d\udcb0 ${b.name} \u2014 ${fmtAmount(b)} (${when})` });
    }
  }

  if (!due.length) return { alerts: [], count: 0 };

  due.sort((x, y) => x.days - y.days); // most overdue first
  const shown = due.slice(0, MAX_IN_DIGEST);
  const extra = due.length - shown.length;

  let msg = `\ud83d\udcb0 *Bills that need you* (${due.length})\n\n${shown.map((x) => x.line).join('\n')}`;
  if (extra > 0) msg += `\n\n\u2026and ${extra} more.`;
  msg += `\n\nReply e.g. \u201cpaid ${shown[0].b.name}\u201d to clear one, or \u201cbills\u201d to see them all.`;

  if (send) {
    try {
      if (wa().ready()) {
        await wa().sendMessage(user.phone, msg);
        // Mark the whole batch alerted, so the next reminder is in a few days.
        billsRepo.markAlerted(due.map((x) => x.b.id), todayDate);
      } else {
        console.log('[billAlerts] (WA not ready) would send 1 digest for', due.length, 'bills');
      }
    } catch (err) { console.warn('[billAlerts] send failed:', err.message); }
  }

  return { alerts: [msg], count: due.length };
}

async function runDueUsers({ hour = 9, now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'bills')) continue;
    const tz = u.timezone || 'Asia/Karachi';
    if (t.hourInTz(tz, now) === hour) {
      results.push({ phone: u.phone, ...(await alertForUser(u.id, { now })) });
    }
  }
  return results;
}

// ── Conversational helpers ───────────────────────────────────────────

/** Detect "any bills due?" / "what bills" style queries. */
function isBillQuery(text) {
  const s = (text || '').toLowerCase();
  return /\b(bills?)\b/.test(s) && /\b(due|pending|owe|upcoming|any|what|show|list)\b/.test(s);
}

/** Detect "paid my amex" / "mark amex as paid". */
function detectMarkPaid(text) {
  const s = (text || '').toLowerCase().trim();
  let m = s.match(/^(?:i )?paid (?:my |the )?(.+)$/);
  if (m) return cleanName(m[1]);
  m = s.match(/^mark (?:my |the )?(.+?) as paid$/);
  if (m) return cleanName(m[1]);
  return null;
}

function cleanName(n) {
  return (n || '').replace(/\b(bill|invoice|payment)\b/g, '').replace(/["'.]/g, '').trim();
}

/** Build a bills digest for a conversational query. */
function buildBillsReply(user, now = new Date()) {
  const tz = user.timezone || 'Asia/Karachi';
  const todayStart = t.startOfDayISO(tz, 0, now);
  const offset = todayStart.slice(-6);
  const pending = billsRepo.listForUser(user.id, { status: 'pending' });
  if (!pending.length) return 'No pending bills on record. \u2705';

  const lines = ['\ud83d\udcb0 *Bills:*'];
  for (const b of pending) {
    let when = '';
    if (b.due_date) {
      const days = t.daysBetween(todayStart, `${b.due_date}T00:00:00${offset}`);
      when = days < 0 ? ` (overdue ${Math.abs(days)}d)` : days === 0 ? ' (due today)' : ` (due in ${days}d)`;
    }
    lines.push(`\u2022 ${b.name} \u2014 ${fmtAmount(b)}${when}`);
  }
  return lines.join('\n');
}

/** Handle "paid my X": marks the bill paid, returns a reply or null if not found. */
function handleMarkPaid(user, phrase) {
  const bill = billsRepo.findByName(user.id, phrase);
  if (!bill) return `I couldn't find a pending bill matching "${phrase}".`;
  billsRepo.markPaid(bill.id);
  return `Marked *${bill.name}* (${fmtAmount(bill)}) as paid. \u2705`;
}

module.exports = {
  alertForUser, runDueUsers,
  isBillQuery, detectMarkPaid, buildBillsReply, handleMarkPaid,
};
