'use strict';

const usersRepo = require('../db/users');
const billsRepo = require('../db/bills');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

function fmtAmount(b) {
  return `${b.currency || 'PKR'} ${Number(b.amount || 0).toLocaleString('en-US')}`;
}

/**
 * Send due-soon (within 3 days) and overdue bill alerts for one user.
 */
async function alertForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { alerts: [] };
  const tz = user.timezone || 'Asia/Karachi';
  const todayStart = t.startOfDayISO(tz, 0, now);
  const todayDate = todayStart.slice(0, 10);
  const offset = todayStart.slice(-6);

  const pending = billsRepo.listForUser(user.id, { status: 'pending' });
  const alerts = [];

  for (const b of pending) {
    if (!b.due_date) continue;
    const dueISO = `${b.due_date}T00:00:00${offset}`;
    const days = t.daysBetween(todayStart, dueISO);

    if (days < 0) {
      const ago = Math.abs(days);
      alerts.push(`\u26a0\ufe0f Your ${b.name} of ${fmtAmount(b)} was due ${ago} day${ago === 1 ? '' : 's'} ago. Mark as paid?`);
    } else if (days <= 3) {
      const when = days === 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
      alerts.push(`\ud83d\udcb0 Reminder: Your ${b.name} of ${fmtAmount(b)} is due ${when}.`);
    }
  }

  if (send && alerts.length) {
    try {
      if (wa().ready()) {
        for (const a of alerts) await wa().sendMessage(user.phone, a);
      } else {
        console.log('[billAlerts] (WA not ready) would alert:', alerts.length);
      }
    } catch (err) { console.warn('[billAlerts] send failed:', err.message); }
  }

  return { alerts };
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
