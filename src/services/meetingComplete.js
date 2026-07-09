'use strict';

const usersRepo = require('../db/users');
const calendarEventsRepo = require('../db/calendarEvents');

function wa() { return require('../whatsapp/client'); }

/**
 * Notify a user about meetings that ended in the last ~`windowMin` minutes, so
 * Wingman can proactively say "that wrapped up — any follow-ups?". De-duped via
 * a prefs set so each event is announced at most once. Cancelled events are
 * recorded as seen but not announced.
 */
async function completeForUser(userId, { now = new Date(), windowMin = 20, send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: [] };

  const fromISO = new Date(now.getTime() - windowMin * 60000).toISOString();
  const toISO = now.toISOString();
  const events = calendarEventsRepo.listEndingBetween(userId, fromISO, toISO);

  const prefs = user.preferences || {};
  const notified = new Set(prefs.completedEvents || []);
  const sent = [];

  for (const ev of events) {
    if (notified.has(ev.id)) continue;
    notified.add(ev.id);
    if ((ev.status || '').toLowerCase() === 'cancelled') continue; // don't ping for cancelled
    const title = ev.title || 'your meeting';
    const msg = `✅ "${title}" just wrapped up. Want me to note any follow-ups, or set a reminder to act on it?`;
    sent.push(msg);
    if (send && wa().ready()) {
      try { await wa().sendMessage(user.phone, msg); }
      catch (err) { console.warn('[meetingComplete] send failed:', err.message); }
    } else if (send) {
      console.log('[meetingComplete] (WA not ready) would notify:', title);
    }
  }

  if (sent.length || events.length) {
    prefs.completedEvents = Array.from(notified).slice(-100);
    usersRepo.update(userId, { preferences: prefs });
  }
  return { sent };
}

async function runAllUsers({ now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'meetingcomplete')) continue;
    results.push({ phone: u.phone, ...(await completeForUser(u.id, { now })) });
  }
  return results;
}

module.exports = { completeForUser, runAllUsers };
