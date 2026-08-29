'use strict';

/**
 * Decides which meetings the Wingman notetaker bot should join, and creates the
 * bot session + a meetings row up front (so the app shows "Wingman is joining…").
 * The actual join/record is done by the browser worker on a separate host; this
 * service only schedules. Nothing fires unless a worker is configured
 * (BOT_WORKER_TOKEN set), so it's inert until Phase 2 is deployed.
 */

const usersRepo = require('../db/users');
const meetingsRepo = require('../db/meetings');
const botsRepo = require('../db/meetingBots');
const calendarEvents = require('../db/calendarEvents');

const BOT_NAME = process.env.BOT_NAME || 'Wingman Notetaker';
// The bot's own Google account. When set, we auto-invite it to each meeting so
// it joins as a guest (Google blocks uninvited bots; invited ones join directly).
const BOT_EMAIL = process.env.BOT_GOOGLE_EMAIL || '';

/** Enabled if either engine is configured: Recall.ai, or the self-host worker. */
function enabled() {
  return require('./recall').enabled() || !!process.env.BOT_WORKER_TOKEN;
}

/**
 * The bot's display name in the call — personalised to the user: their first
 * name + " Wingman" (e.g. "Aamir Wingman", "Fayyaz Wingman"). Falls back to
 * BOT_NAME when the user has no name on file.
 */
function botNameForUser(userId) {
  try {
    const user = usersRepo.getById(userId);
    const first = String((user && user.name) || '').trim().split(/\s+/)[0];
    if (first) return `${first} Wingman`;
  } catch (_) { /* fall back */ }
  return BOT_NAME;
}

/**
 * Hand a freshly-created session to Recall.ai: create the bot for the meeting URL
 * and store its id + move the session to 'joining'. recallPoll then drives it to
 * done. Best-effort — a failure marks the session failed but never throws.
 */
async function startRecall(session, meetingUrl) {
  const recall = require('./recall');
  if (!recall.enabled() || !session) return session;
  try {
    const bot = await recall.createBot({ meetingUrl, botName: session.bot_name || BOT_NAME, metadata: { sessionId: session.id } });
    if (bot && bot.id) {
      console.log(`[botDispatch] recall bot ${bot.id} dispatched for session ${session.id}`);
      return botsRepo.update(session.id, { recallBotId: bot.id, status: 'joining' });
    }
    throw new Error('recall returned no bot id');
  } catch (e) {
    console.warn('[botDispatch] recall createBot failed:', e.message);
    botsRepo.update(session.id, { status: 'failed', error: `recall: ${e.message}`.slice(0, 400) });
    return botsRepo.getById(session.id);
  }
}

/**
 * Auto-invite the bot to a calendar event's guest list, so it joins directly
 * instead of gate-crashing (which Google blocks). Best-effort — never throws.
 */
async function inviteBotToEvent(userId, evRow) {
  if (!BOT_EMAIL || !evRow || !evRow.gcal_event_id) return;
  try {
    const calendar = require('./calendar');
    const added = await calendar.addAttendee(userId, evRow.gcal_event_id, BOT_EMAIL, { notify: false });
    if (added) console.log(`[botDispatch] auto-invited ${BOT_EMAIL} to event ${evRow.gcal_event_id}`);
  } catch (e) {
    console.warn('[botDispatch] auto-invite failed:', e.message);
  }
}

/** Map a cached calendar_events row → attendees array for the meeting record. */
function attendeesFromEvent(evRow) {
  let emails = [];
  try { emails = JSON.parse(evRow.attendees || '[]'); } catch (_) { emails = []; }
  return (Array.isArray(emails) ? emails : [])
    .filter((e) => typeof e === 'string' && e.includes('@'))
    .map((email) => ({ email }));
}

/**
 * Create (or reuse) a bot session for a specific cached calendar event. Also
 * creates the meetings row the summary will land in. Idempotent per event.
 * @returns {object|null} the bot session, or null if the event has no join link
 */
async function dispatchForEvent(userId, evRow) {
  if (!evRow || !evRow.meeting_url) return null;

  const existing = botsRepo.findActiveForEvent(userId, evRow.gcal_event_id);
  if (existing) return existing;

  // Self-host only: put our bot account on the guest list so it joins as an
  // invited participant. Recall runs its own bot, so this doesn't apply there.
  if (!require('./recall').enabled()) await inviteBotToEvent(userId, evRow);

  const meeting = meetingsRepo.create(userId, {
    title: evRow.title || 'Meeting',
    type: 'Client',
    virtual: true,
    attendees: attendeesFromEvent(evRow),
    status: 'scheduled',
    meetingAt: evRow.start_time || null,
  });

  const session = botsRepo.create(userId, {
    meetingId: meeting.id,
    gcalEventId: evRow.gcal_event_id,
    meetingUrl: evRow.meeting_url,
    provider: evRow.meeting_provider || null,
    botName: botNameForUser(userId),
    scheduledAt: evRow.start_time || null,
  });
  return startRecall(session, evRow.meeting_url);
}

/**
 * Manual "Join with Wingman" for a raw meeting URL (no calendar event). Always
 * creates a fresh session + meeting.
 */
async function dispatchForUrl(userId, { meetingUrl, provider = null, title = 'Meeting', startTime = null, attendees = [] } = {}) {
  if (!meetingUrl) throw new Error('meetingUrl required');
  // Defensive: collapse an accidental double scheme ("https://https://…").
  meetingUrl = String(meetingUrl).trim().replace(/^https?:\/\/(https?:\/\/)/i, '$1');
  const meeting = meetingsRepo.create(userId, {
    title, type: 'Client', virtual: true, attendees, status: 'scheduled', meetingAt: startTime,
  });
  const session = botsRepo.create(userId, {
    meetingId: meeting.id,
    meetingUrl,
    provider,
    botName: botNameForUser(userId),
    scheduledAt: startTime,
  });
  return startRecall(session, meetingUrl);
}

/**
 * For one user, dispatch bots to joinable events starting within the lookahead
 * window. Only runs when the user opted in (preferences.autoJoinMeetings).
 */
async function runForUser(userId, { now = new Date(), lookaheadMin = 16 } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return [];
  const prefs = user.preferences || {};
  if (!prefs.autoJoinMeetings) return [];

  const fromISO = new Date(now.getTime() - 60 * 1000).toISOString();       // 1 min grace
  const toISO = new Date(now.getTime() + lookaheadMin * 60 * 1000).toISOString();
  const events = calendarEvents.listJoinableBetween(userId, fromISO, toISO);

  const created = [];
  for (const ev of events) {
    try {
      const before = botsRepo.findActiveForEvent(userId, ev.gcal_event_id);
      const session = await dispatchForEvent(userId, ev);
      if (session && !before) created.push(session);
    } catch (e) {
      console.warn('[botDispatch] event dispatch failed:', e.message);
    }
  }
  return created;
}

async function runAllUsers({ now = new Date(), lookaheadMin = 16 } = {}) {
  if (!enabled()) return [];
  const users = usersRepo.listOnboarded();
  const out = [];
  for (const u of users) {
    const created = await runForUser(u.id, { now, lookaheadMin });
    if (created.length) out.push({ phone: u.phone, dispatched: created.length });
  }
  if (out.length) console.log('[botDispatch] dispatched notetaker bots:', JSON.stringify(out));
  return out;
}

/**
 * Frequent auto-join tick (runs every ~2 min from the scheduler). For each user
 * who opted in, refreshes their near-term Google Calendar and dispatches the bot
 * to any meeting about to start — so the notetaker joins ON ITS OWN, with no
 * manual command. `lookaheadMin` is short so the bot joins close to the start
 * (not long before). dispatchForEvent is idempotent per event, so overlapping
 * ticks never send two bots.
 */
async function runAutoJoinTick({ now = new Date(), lookaheadMin = 5 } = {}) {
  if (!enabled()) return [];
  const users = usersRepo.listOnboarded();
  const out = [];
  for (const u of users) {
    const prefs = u.preferences || {};
    if (!prefs.autoJoinMeetings) continue;
    // Refresh this user's near-term calendar so even short-notice meetings are
    // seen quickly (the 15-min sync alone could miss them).
    try {
      const calendar = require('./calendar');
      await calendar.getEvents(u.id, {
        from: now.toISOString(),
        to: new Date(now.getTime() + 90 * 60 * 1000).toISOString(),
      });
    } catch (e) {
      console.warn('[botDispatch] auto-join calendar refresh failed:', e.message);
    }
    try {
      const created = await runForUser(u.id, { now, lookaheadMin });
      if (created.length) out.push({ phone: u.phone, dispatched: created.length });
    } catch (e) {
      console.warn('[botDispatch] auto-join dispatch failed:', e.message);
    }
  }
  if (out.length) console.log('[botDispatch] auto-join tick dispatched:', JSON.stringify(out));
  return out;
}

module.exports = { enabled, dispatchForEvent, dispatchForUrl, runForUser, runAllUsers, runAutoJoinTick, BOT_NAME };
