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
const leaveByAlerts = require('./leaveByAlerts');
const healthAlerts = require('./healthAlerts');
const workAlerts = require('./workAlerts');

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
    await require('./googleTasks').syncAllUsers({ now });
    await taskIntents.runDailyReminders({ hour: 9, now });
    await billAlerts.runDueUsers({ hour: 9, now });
    await deliveryAlerts.runDueUsers({ hour: 9, now });
    await followupTracker.runDueUsers({ hour: 9, now });
    await travelAssistant.runDueUsers({ now });
  } catch (err) {
    console.warn('[scheduler] hourly tick error:', err.message);
  }
}

/**
 * Briefing tick — every 15 minutes. The morning briefing and end-of-day wrap
 * fire at each user's OWN configured briefing_time / debrief_time (in their
 * timezone), so a 15-minute cadence is needed to honour half-hour settings like
 * "07:30". Each service de-dupes to once per local day.
 */
async function runBriefingTick(now = new Date()) {
  try {
    await morningBriefing.runDueUsers({ now, windowMin: 15 });
    await endOfDayWrap.runDueUsers({ now, windowMin: 15 });
  } catch (err) {
    console.warn('[scheduler] briefing tick error:', err.message);
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
    await leaveByAlerts.runAllUsers({ now });    // "leave by X" for events with a location
    // Pull fresh readings BEFORE the health alerts run, so an alert reacts to
    // what synced this tick rather than to yesterday's picture.
    await require('./googleHealth').syncAllUsers({ days: 2 });
    await require('./wearables').syncAllUsers({ days: 2 });
    await require('./webmailAlerts').runAllUsers({});  // new customer mail
    await healthAlerts.runAllUsers({ now });     // readings drifting from the user's own normal
    await workAlerts.runAllUsers({ now });       // still clocked in past their usual finish
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

  const brief = cron.schedule('*/15 * * * *', () => runBriefingTick(new Date()));
  jobs.push(brief);

  console.log('[scheduler] registered hourly tick (alerts 09:00, travel) + every 15 min: calendar-sync/meeting-prep/meeting-complete and briefing/debrief at each user\'s own set time, per-user TZ');
  return jobs;
}

function stopAll() {
  for (const j of jobs) { try { j.stop(); } catch (_) {} }
  jobs.length = 0;
}

module.exports = { init, runHourlyTick, runMeetingPrepTick, runBriefingTick, stopAll };
