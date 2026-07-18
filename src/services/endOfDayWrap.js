'use strict';

const usersRepo = require('../db/users');
const calendarEventsRepo = require('../db/calendarEvents');
const emailItemsRepo = require('../db/emailItems');
const tasksRepo = require('../db/tasks');
const billsRepo = require('../db/bills');
const followupsRepo = require('../db/followups');
const briefingsRepo = require('../db/briefings');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

/**
 * Aggregate the end-of-day picture.
 */
function aggregate(user, now = new Date()) {
  const tz = user.timezone || 'Asia/Karachi';
  const todayStart = t.startOfDayISO(tz, 0, now);
  const tomorrowStart = t.startOfDayISO(tz, 1, now);
  const dayAfter = t.startOfDayISO(tz, 2, now);

  const totalTasks = tasksRepo.countAll(user.id);
  const completedToday = tasksRepo.countCompleted(user.id, todayStart);
  const completedTasks = completedToday; // "completed today" per spec
  const incomplete = tasksRepo.listForUser(user.id, { includeCompleted: false });

  const repliedEmails = emailItemsRepo.countReplied(user.id);
  const pendingEmails = emailItemsRepo.countPending(user.id);

  // Meetings today (attended = happened before now today)
  const todaysEvents = calendarEventsRepo.listStartingBetween(user.id, todayStart, tomorrowStart);

  // Tomorrow
  const tomorrowEvents = calendarEventsRepo.listStartingBetween(user.id, tomorrowStart, dayAfter);

  // Bills due tomorrow
  const tomorrowDate = tomorrowStart.slice(0, 10);
  const billsTomorrow = billsRepo.listForUser(user.id, { status: 'pending' })
    .filter((b) => b.due_date === tomorrowDate);

  // Open follow-ups (still pending)
  const openFollowups = followupsRepo.listOpen(user.id);

  return {
    tz, totalTasks, completedTasks, incomplete,
    repliedEmails, pendingEmails,
    meetingsAttended: todaysEvents.length,
    tomorrowEvents, billsTomorrow, openFollowups, tomorrowDate,
  };
}

function format(user, agg) {
  const name = user.name || 'there';
  const tz = agg.tz;
  const lines = [];
  lines.push(`That's a wrap, ${name}! \ud83c\udf19`);
  lines.push('');
  lines.push(`\u2705 Completed: ${agg.completedTasks}/${agg.totalTasks} tasks`);
  lines.push(`\ud83d\udce7 Emails handled: replied to ${agg.repliedEmails}, ${agg.pendingEmails} still pending`);
  lines.push(`\ud83d\udcc5 Meetings attended: ${agg.meetingsAttended}`);
  lines.push('');

  // Still pending
  const pending = [];
  for (const task of agg.incomplete.slice(0, 5)) pending.push(task.title);
  for (const f of agg.openFollowups.slice(0, 3)) {
    if (f.type === 'promise_made') pending.push(`You said you'd ${f.description}`);
  }
  if (pending.length) {
    lines.push('Still pending:');
    for (const p of pending) lines.push(`\u2022 ${p}`);
    lines.push('');
  }

  // Tomorrow
  lines.push('Tomorrow:');
  lines.push(`\u2022 ${agg.tomorrowEvents.length} meeting${agg.tomorrowEvents.length === 1 ? '' : 's'}`);
  if (agg.tomorrowEvents[0]) {
    lines.push(`\u2022 ${t.timeLabel(agg.tomorrowEvents[0].start_time, tz)} \u2014 ${agg.tomorrowEvents[0].title}`);
  }
  for (const b of agg.billsTomorrow) {
    lines.push(`\u2022 \ud83d\udcb0 ${b.name} due tomorrow (${b.currency} ${Number(b.amount || 0).toLocaleString('en-US')})`);
  }
  lines.push('');
  lines.push('Good night! \ud83d\udca4');

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

async function sendForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { text: '', sent: false, skipped: 'no_user' };

  const agg = aggregate(user, now);
  const text = format(user, agg);

  briefingsRepo.create(userId, {
    type: 'evening',
    content: text,
    payload: {
      completed: agg.completedTasks, total: agg.totalTasks,
      replied: agg.repliedEmails, pending: agg.pendingEmails,
      meetings: agg.meetingsAttended, tomorrow: agg.tomorrowEvents.length,
    },
  });

  let sent = false;
  if (send) {
    try {
      if (wa().ready()) { await wa().sendMessage(user.phone, text); sent = true; }
      else console.log('[endOfDayWrap] (WA not ready) wrap for', user.phone);
    } catch (err) {
      console.warn('[endOfDayWrap] send failed:', err.message);
    }
  }
  return { text, sent };
}

async function runDueUsers({ hour = 20, now = new Date(), windowMin = 15 } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'wrap')) continue;
    const tz = u.timezone || 'Asia/Karachi';
    // Honour each user's own debrief_time (HH:MM); fall back to the legacy hour.
    const target = u.debrief_time || `${String(hour).padStart(2, '0')}:00`;
    if (!t.isDueAt(tz, target, now, windowMin)) continue;

    // Send at most once per local day.
    const dayKey = t.dateKeyInTz(tz, now);
    if ((u.preferences || {}).lastDebriefDate === dayKey) continue;

    results.push({ phone: u.phone, at: target, ...(await sendForUser(u.id, { now })) });

    const fresh = usersRepo.getById(u.id) || u;
    const prefs = fresh.preferences || {};
    prefs.lastDebriefDate = dayKey;
    usersRepo.update(u.id, { preferences: prefs });
  }
  if (results.length) console.log('[endOfDayWrap] sent to', results.length, 'user(s)');
  return results;
}

module.exports = { aggregate, format, sendForUser, runDueUsers };
