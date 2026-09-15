'use strict';

const usersRepo = require('../db/users');
const sessionsRepo = require('../db/workSessions');
const work = require('./work');
const proactiveGate = require('./proactiveGate');

function wa() { return require('../whatsapp/client'); }

/**
 * "You're still clocked in" — the reminder this whole feature exists for.
 *
 * Asked once per session, never repeated, and dropped entirely if the user
 * says they're staying late. The point is to save someone a payroll correction,
 * not to supervise them.
 */

function buildMessage(status, decision) {
  const worked = work.fmtDuration(decision.worked);

  if (decision.staleDay) {
    return [
      `🕘 Heads up — you're still clocked in from yesterday (since ${status.since}).`,
      "Looks like the clock-out didn't go through. Worth fixing before it lands on your timesheet.",
    ].join('\n\n');
  }

  return [
    `🕕 You're still clocked in — ${worked} since ${status.since}. Forgot to clock out?`,
    "If you're staying on, just say so and I'll leave it.",
  ].join('\n\n');
}

/** Check one user; sends at most one reminder per session. */
async function alertForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: null };
  if (!proactiveGate.allows(user, 'work')) return { sent: null, skipped: 'gated' };

  const decision = work.shouldNudge(userId, { now });
  if (!decision.nudge) return { sent: null, skipped: decision.reason };

  const status = work.status(userId, { now });
  const msg = buildMessage(status, decision);

  // Mark first: a send failure should not turn into the same reminder every
  // 15 minutes for the rest of the evening.
  sessionsRepo.markNudged(decision.session.id, now.toISOString());

  if (send && wa().ready()) {
    try { await wa().sendMessage(user.phone, msg); }
    catch (err) { console.warn('[workAlerts] send failed:', err.message); }
  } else if (send) {
    console.log('[workAlerts] (WA not ready) would remind:', user.phone);
  }
  return { sent: msg };
}

/** Sweep every user with an open session. */
async function runAllUsers({ now = new Date(), send = true } = {}) {
  const userIds = sessionsRepo.usersWithOpenSessions();
  const results = [];
  for (const userId of userIds) {
    try {
      const r = await alertForUser(userId, { now, send });
      if (r.sent) results.push({ userId, message: r.sent });
    } catch (err) {
      console.warn('[workAlerts] failed for', userId, err.message);
    }
  }
  return results;
}

/**
 * "You usually start by now" — the clock-IN half. Learns each person's usual
 * start (see work.shouldRemindClockIn) and nudges once, gently, only inside the
 * window after it — and offers to clock them in, since Wingman can.
 */
function buildClockInMessage(decision) {
  return [
    `🕐 You usually clock in by *${decision.typicalLabel}* — you haven't yet today.`,
    "Want me to clock you in? Or is today a late start / day off — just say so and I'll leave it.",
  ].join('\n\n');
}

/** Check one user; sends at most one clock-in reminder per day. */
async function clockInReminderForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: null };
  if (!proactiveGate.allows(user, 'work')) return { sent: null, skipped: 'gated' };

  const decision = work.shouldRemindClockIn(userId, { now });
  if (!decision.remind) return { sent: null, skipped: decision.reason };

  const msg = buildClockInMessage(decision);

  // Mark first: a send failure must not become the same nudge every 15 minutes.
  work.markClockInReminded(userId, decision.todayKey);

  if (send && wa().ready()) {
    try { await wa().sendMessage(user.phone, msg); }
    catch (err) { console.warn('[workAlerts] clock-in send failed:', err.message); }
  } else if (send) {
    console.log('[workAlerts] (WA not ready) would remind clock-in:', user.phone);
  }
  return { sent: msg };
}

/** Sweep users who have clock history but are NOT currently clocked in. */
async function runClockInReminders({ now = new Date(), send = true } = {}) {
  const open = new Set(sessionsRepo.usersWithOpenSessions());
  const userIds = sessionsRepo.usersWithClockData().filter((id) => !open.has(id));
  const results = [];
  for (const userId of userIds) {
    try {
      const r = await clockInReminderForUser(userId, { now, send });
      if (r.sent) results.push({ userId, message: r.sent });
    } catch (err) {
      console.warn('[workAlerts] clock-in failed for', userId, err.message);
    }
  }
  return results;
}

module.exports = {
  alertForUser, runAllUsers, buildMessage,
  clockInReminderForUser, runClockInReminders, buildClockInMessage,
};
