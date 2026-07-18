'use strict';

const config = require('../config');
const usersRepo = require('../db/users');
const calendarEventsRepo = require('../db/calendarEvents');
const maps = require('./maps');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

// Warn once the departure moment is within this many minutes.
const WARN_WINDOW_MIN = 20;
// Only consider events starting within this horizon.
const LOOKAHEAD_MIN = 150;

/**
 * For meetings that have a real location, work out when the user has to LEAVE
 * (using live traffic) and warn them just before that moment.
 */
async function alertForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: [] };
  if (!config.maps.enabled) return { sent: [], skipped: 'maps_not_configured' };

  const origin = maps.savedPlace(user, 'home') || maps.savedPlace(user, 'office');
  if (!origin) return { sent: [], skipped: 'no_saved_place' };

  const tz = user.timezone || 'Asia/Karachi';
  const events = calendarEventsRepo
    .listStartingBetween(userId, now.toISOString(), new Date(now.getTime() + LOOKAHEAD_MIN * 60000).toISOString())
    .filter((e) => e.location && String(e.location).trim() && (e.status || '').toLowerCase() !== 'cancelled');

  const prefs = user.preferences || {};
  const alerted = new Set(prefs.leaveByAlerted || []);
  const sent = [];

  for (const ev of events) {
    if (alerted.has(ev.id)) continue;
    let r;
    try {
      r = await maps.leaveBy(origin.query, ev.location, new Date(ev.start_time));
    } catch (err) {
      console.warn('[leaveByAlerts] route failed:', err.message);
      continue;
    }
    if (!r) continue;

    const minutesUntilDeparture = (new Date(r.leaveAt).getTime() - now.getTime()) / 60000;
    // Too early to be useful — we'll catch it on a later tick.
    if (!r.alreadyLate && minutesUntilDeparture > WARN_WINDOW_MIN) continue;

    const startLabel = t.timeLabel(ev.start_time, tz);
    const msg = r.alreadyLate
      ? `🚗 Heads up — *${ev.title}* starts at ${startLabel} and it's ${r.minutes} min away in current traffic. You'd arrive late; want me to let them know?`
      : `🚗 Leave by *${t.timeLabel(r.leaveAt, tz)}* for *${ev.title}* (${startLabel})\n${r.minutes} min${r.route ? ` via ${r.route}` : ''}${r.trafficDelayMinutes ? ` — ${r.trafficDelayMinutes} min slower than usual` : ''}.`;

    sent.push(msg);
    if (send && wa().ready()) {
      try { await wa().sendMessage(user.phone, msg); }
      catch (err) { console.warn('[leaveByAlerts] send failed:', err.message); }
    } else if (send) {
      console.log('[leaveByAlerts] (WA not ready) would alert for', ev.title);
    }
    alerted.add(ev.id);
  }

  if (sent.length) {
    const fresh = usersRepo.getById(userId) || user;
    const p = fresh.preferences || {};
    p.leaveByAlerted = Array.from(alerted).slice(-80);
    usersRepo.update(userId, { preferences: p });
  }
  return { sent };
}

async function runAllUsers({ now = new Date() } = {}) {
  if (!config.maps.enabled) return [];
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'meetingprep')) continue; // same gating as meeting reminders
    try {
      const r = await alertForUser(u.id, { now });
      if (r.sent && r.sent.length) results.push({ phone: u.phone, alerts: r.sent.length });
    } catch (err) {
      console.warn('[leaveByAlerts] failed for', u.phone, err.message);
    }
  }
  return results;
}

module.exports = { alertForUser, runAllUsers };
