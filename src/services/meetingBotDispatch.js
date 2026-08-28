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

/** A worker must be configured for any of this to do anything. */
function enabled() {
  return !!process.env.BOT_WORKER_TOKEN;
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
function dispatchForEvent(userId, evRow) {
  if (!evRow || !evRow.meeting_url) return null;

  const existing = botsRepo.findActiveForEvent(userId, evRow.gcal_event_id);
  if (existing) return existing;

  const meeting = meetingsRepo.create(userId, {
    title: evRow.title || 'Meeting',
    type: 'Client',
    virtual: true,
    attendees: attendeesFromEvent(evRow),
    status: 'scheduled',
    meetingAt: evRow.start_time || null,
  });

  return botsRepo.create(userId, {
    meetingId: meeting.id,
    gcalEventId: evRow.gcal_event_id,
    meetingUrl: evRow.meeting_url,
    provider: evRow.meeting_provider || null,
    botName: BOT_NAME,
    scheduledAt: evRow.start_time || null,
  });
}

/**
 * Manual "Join with Wingman" for a raw meeting URL (no calendar event). Always
 * creates a fresh session + meeting.
 */
function dispatchForUrl(userId, { meetingUrl, provider = null, title = 'Meeting', startTime = null, attendees = [] } = {}) {
  if (!meetingUrl) throw new Error('meetingUrl required');
  const meeting = meetingsRepo.create(userId, {
    title, type: 'Client', virtual: true, attendees, status: 'scheduled', meetingAt: startTime,
  });
  return botsRepo.create(userId, {
    meetingId: meeting.id,
    meetingUrl,
    provider,
    botName: BOT_NAME,
    scheduledAt: startTime,
  });
}

/**
 * For one user, dispatch bots to joinable events starting within the lookahead
 * window. Only runs when the user opted in (preferences.autoJoinMeetings).
 */
function runForUser(userId, { now = new Date(), lookaheadMin = 16 } = {}) {
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
      const session = dispatchForEvent(userId, ev);
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
    const created = runForUser(u.id, { now, lookaheadMin });
    if (created.length) out.push({ phone: u.phone, dispatched: created.length });
  }
  if (out.length) console.log('[botDispatch] dispatched notetaker bots:', JSON.stringify(out));
  return out;
}

module.exports = { enabled, dispatchForEvent, dispatchForUrl, runForUser, runAllUsers, BOT_NAME };
