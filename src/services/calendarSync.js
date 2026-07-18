'use strict';

const usersRepo = require('../db/users');
const calendarService = require('./calendar');

/**
 * Refresh each calendar-connected user's cached events over a working window so
 * the proactive services (reminders, meeting-complete) always run against fresh
 * Google data — the local cache is otherwise only filled when the dashboard or
 * the WhatsApp bot happens to fetch. Best-effort: failures are logged, not thrown.
 */
async function syncAllUsers({ now = new Date() } = {}) {
  const users = usersRepo.listOnboarded();
  const from = new Date(now.getTime() - 2 * 3600000).toISOString();   // 2h back
  const to = new Date(now.getTime() + 26 * 3600000).toISOString();    // 26h ahead
  const results = [];
  for (const u of users) {
    // getEvents fans out across every linked account internally.
    if (!require('../auth/googleAuth').isConnected(u)) continue;
    try {
      const { events } = await calendarService.getEvents(u.id, { from, to });
      results.push({ phone: u.phone, synced: events.length });
    } catch (err) {
      console.warn('[calendarSync] failed for', u.phone, err.message);
    }
  }
  if (results.length) console.log('[calendarSync]', JSON.stringify(results));
  return results;
}

module.exports = { syncAllUsers };
