'use strict';

const cron = require('node-cron');

const morningBriefing = require('./morningBriefing');
const endOfDayWrap = require('./endOfDayWrap');
const taskIntents = require('../engine/taskIntents');
const billAlerts = require('./billAlerts');
const deliveryAlerts = require('./deliveryAlerts');
const followupTracker = require('./followupTracker');
const travelAssistant = require('./travelAssistant');
const meetingPrep = require('./meetingPrep');
const meetingComplete = require('./meetingComplete');
const calendarSync = require('./calendarSync');

const jobs = [];

/**
 * Because users can be in different timezones, we run a single cron job at the
 * top of every hour and each service decides which users' local time matches
 * its target hour. This keeps scheduling correct across timezones without
 * spinning up per-user crons.
 *
 * Target local hours:
 *   07:00 → morning briefing
 *   09:00 → daily task reminder, bill alerts, delivery return-window check, follow-up overdue check
 *   20:00 → end-of-day wrap
 * Every hour (time-based, not local-hour-gated):
 *   → travel alerts (24h / 3h before flights, arrival-day briefing)
 */
async function runHourlyTick(now = new Date()) {
  try {
    await morningBriefing.runDueUsers({ hour: 7, now });
    await taskIntents.runDailyReminders({ hour: 9, now });
    await billAlerts.runDueUsers({ hour: 9, now });
    await deliveryAlerts.runDueUsers({ hour: 9, now });
    await followupTracker.runDueUsers({ hour: 9, now });
    await endOfDayWrap.runDueUsers({ hour: 20, now });
    await travelAssistant.runDueUsers({ now });
  } catch (err) {
    console.warn('[scheduler] hourly tick error:', err.message);
  }
}

/**
 * Meeting tick — runs every 15 minutes. First syncs each connected user's
 * Google Calendar (so the cache is fresh), then sends prep reminders for events
 * about to start and "just wrapped up" notes for events that recently ended.
 */
async function runMeetingPrepTick(now = new Date()) {
  try {
    await calendarSync.syncAllUsers({ now });   // refresh cache from Google first
    await meetingPrep.runAllUsers({ now });      // reminders before meetings
    await meetingComplete.runAllUsers({ now });  // "that wrapped up" after meetings
  } catch (err) {
    console.warn('[scheduler] meeting tick error:', err.message);
  }
}

/**
 * Initialize all cron jobs. Called once on server start.
 */
function init() {
  const hourly = cron.schedule('0 * * * *', () => runHourlyTick(new Date()));
  jobs.push(hourly);

  const prep = cron.schedule('*/15 * * * *', () => runMeetingPrepTick(new Date()));
  jobs.push(prep);

  console.log('[scheduler] registered hourly proactive tick (briefing 07:00, alerts 09:00, wrap 20:00, travel alerts hourly) + calendar-sync/meeting-prep/meeting-complete every 15 min, per-user TZ');
  return jobs;
}

function stopAll() {
  for (const j of jobs) { try { j.stop(); } catch (_) {} }
  jobs.length = 0;
}

module.exports = { init, runHourlyTick, runMeetingPrepTick, stopAll };
