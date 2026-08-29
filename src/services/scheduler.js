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
const taskDueAlerts = require('./taskDueAlerts');

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
    // Collapse any duplicate/junk accounts created since boot, so proactive jobs
    // never send twice to the same person (was boot-only before).
    try { require('../db/users').mergeDuplicatePhones(); } catch (_) { /* best-effort */ }
    // Trim the WhatsApp send-dedup guard (rows only matter for ~2 min).
    try { require('../db').db.prepare("DELETE FROM wa_send_dedup WHERE created_at < datetime('now','-1 hour')").run(); } catch (_) { /* best-effort */ }
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
    // The cross-domain proactive nudge — gated to a couple of local hours and
    // to days that actually have something time-sensitive.
    await require('./proactiveBrain').runDueUsers({ now });
    // Standing instructions the user set up ("every morning send me traffic").
    // Retune behaviour-anchored ones (e.g. "before I usually leave") FIRST so
    // today's fire uses the freshly-learned time, then sweep and fire.
    await require('./automations').retuneAnchored({ now });
    await require('./automations').runDueUsers({ now, windowMin: 15 });
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
    await taskDueAlerts.runAllUsers({ now });    // tasks due in ~15 minutes
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

  // Notetaker bot — every 2 min: (1) AUTO-JOIN — for opted-in users, refresh
  // their calendar and send the bot to any meeting about to start (so it joins on
  // its own, no manual command); (2) poll Recall so notes land soon after the
  // call ends. No-op unless a bot engine (RECALL_API_KEY) is configured.
  const botTick = cron.schedule('*/2 * * * *', async () => {
    try { await require('./meetingBotDispatch').runAutoJoinTick({ now: new Date() }); }
    catch (e) { console.warn('[scheduler] auto-join error:', e.message); }
    try { await require('./recallPoll').runOnce(); }
    catch (e) { console.warn('[scheduler] recall poll error:', e.message); }
  });
  jobs.push(botTick);

  console.log('[scheduler] registered hourly tick (alerts 09:00, travel) + every 15 min: calendar-sync/meeting-prep/meeting-complete/task-due and briefing/debrief at each user\'s own set time, per-user TZ');
  return jobs;
}

function stopAll() {
  for (const j of jobs) { try { j.stop(); } catch (_) {} }
  jobs.length = 0;
}

module.exports = { init, runHourlyTick, runMeetingPrepTick, runBriefingTick, stopAll };
