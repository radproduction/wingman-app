'use strict';

const usersRepo = require('../db/users');
const calendarEventsRepo = require('../db/calendarEvents');
const emailItemsRepo = require('../db/emailItems');
const tasksRepo = require('../db/tasks');
const billsRepo = require('../db/bills');
const deliveriesRepo = require('../db/deliveries');
const briefingsRepo = require('../db/briefings');
const { db } = require('../db');
const weather = require('./weather');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

/** Latest health metric for a user, or null. */
function latestHealth(userId) {
  return db.prepare(
    'SELECT * FROM health_data WHERE user_id = ? ORDER BY recorded_at DESC, created_at DESC LIMIT 1'
  ).get(userId);
}

/**
 * Aggregate everything needed for a morning briefing.
 * @returns {Promise<Object>} structured payload
 */
async function aggregate(user, now = new Date()) {
  const tz = user.timezone || 'Asia/Karachi';
  const todayStart = t.startOfDayISO(tz, 0, now);
  const tomorrowStart = t.startOfDayISO(tz, 1, now);
  const in3Days = t.startOfDayISO(tz, 4, now); // through end of +3 days

  const w = await weather.getWeather(user);

  const events = calendarEventsRepo.listStartingBetween(user.id, todayStart, tomorrowStart);

  // Emails in the last 24h
  const since24 = new Date(now.getTime() - 24 * 3600 * 1000).toISOString();
  const emailCounts = emailItemsRepo.countsSince(user.id, since24);

  const tasksDue = tasksRepo.listDueBetween(user.id, todayStart, tomorrowStart);

  const bills = billsRepo.listForUser(user.id, { status: 'pending' })
    .filter((b) => b.due_date && b.due_date >= todayStart.slice(0, 10) && b.due_date <= in3Days.slice(0, 10));

  const deliveries = deliveriesRepo.listForUser(user.id)
    .filter((d) => d.status !== 'delivered');

  const health = latestHealth(user.id);

  return {
    tz, weather: w, events, emailCounts, tasksDue, bills, deliveries, health,
    todayStart, tomorrowStart,
  };
}

/** Format the aggregated payload into the WhatsApp briefing text. */
function format(user, agg) {
  const name = user.name || 'there';
  const tz = agg.tz;
  const lines = [];
  lines.push(`Good morning, ${name}! \u2600\ufe0f`);
  lines.push('');
  lines.push(`\ud83c\udf24 ${agg.weather.city}: ${agg.weather.temp}\u00b0C, ${agg.weather.condition}`);
  lines.push('');

  // Schedule
  lines.push(`\ud83d\udcc5 *Today's Schedule:*`);
  if (agg.events.length) {
    for (const e of agg.events) {
      const time = t.timeLabel(e.start_time, tz);
      const loc = e.location ? ` (${e.location})` : '';
      lines.push(`\u2022 ${time} \u2014 ${e.title || 'Untitled'}${loc}`);
    }
  } else {
    lines.push('\u2022 No meetings \u2014 open runway for deep work. \ud83d\udcaa');
  }
  lines.push('');

  // Email
  lines.push(`\ud83d\udce7 Email: ${agg.emailCounts.urgent} urgent, ${agg.emailCounts.needsReply} need reply`);
  lines.push('');

  // Tasks
  lines.push(`\u2705 *Tasks Due Today:*`);
  if (agg.tasksDue.length) {
    for (const task of agg.tasksDue) lines.push(`\u2022 ${task.title}`);
  } else {
    lines.push('\u2022 Nothing due today. \ud83c\udf89');
  }
  lines.push('');

  // Bills
  if (agg.bills.length) {
    for (const b of agg.bills) {
      const days = t.daysBetween(agg.todayStart, `${b.due_date}T00:00:00${agg.todayStart.slice(-6)}`);
      const when = days <= 0 ? 'today' : `in ${days} day${days === 1 ? '' : 's'}`;
      lines.push(`\ud83d\udcb0 Bills: ${b.name} due ${when} (${b.currency} ${fmtAmount(b.amount)})`);
    }
    lines.push('');
  }

  // Deliveries
  if (agg.deliveries.length) {
    for (const d of agg.deliveries.slice(0, 3)) {
      const eta = d.estimated_delivery ? ` (ETA ${d.estimated_delivery})` : '';
      lines.push(`\ud83d\udce6 Deliveries: ${d.item_name || 'Order'} \u2014 ${prettyStatus(d.status)}${eta}`);
    }
    lines.push('');
  }

  // Health (optional)
  if (agg.health) {
    lines.push(`\u2764\ufe0f Health: ${agg.health.metric_type} ${agg.health.value}${agg.health.unit ? ' ' + agg.health.unit : ''}`);
    lines.push('');
  }

  lines.push('Have a productive day! \ud83d\ude80');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

function fmtAmount(n) {
  if (n == null) return '';
  return Number(n).toLocaleString('en-US');
}

function prettyStatus(s) {
  return (s || 'in_transit').replace(/_/g, ' ');
}

/**
 * Build, store, and (best-effort) send a morning briefing for one user.
 * @returns {Promise<{text:string, sent:boolean}>}
 */
async function sendForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { text: '', sent: false, skipped: 'no_user' };

  const agg = await aggregate(user, now);
  const text = format(user, agg);

  briefingsRepo.create(userId, {
    type: 'morning',
    content: text,
    payload: {
      events: agg.events.length,
      emailCounts: agg.emailCounts,
      tasksDue: agg.tasksDue.length,
      bills: agg.bills.length,
      deliveries: agg.deliveries.length,
    },
  });

  let sent = false;
  if (send) {
    try {
      if (wa().ready()) { await wa().sendMessage(user.phone, text); sent = true; }
      else console.log('[morningBriefing] (WA not ready) briefing for', user.phone);
    } catch (err) {
      console.warn('[morningBriefing] send failed:', err.message);
    }
  }
  return { text, sent };
}

/**
 * Run for all users whose local time is currently the target hour.
 */
async function runDueUsers({ hour = 7, now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'morning')) continue;
    const tz = u.timezone || 'Asia/Karachi';
    if (t.hourInTz(tz, now) === hour) {
      results.push({ phone: u.phone, ...(await sendForUser(u.id, { now })) });
    }
  }
  if (results.length) console.log('[morningBriefing] sent to', results.length, 'user(s)');
  return results;
}

module.exports = { aggregate, format, sendForUser, runDueUsers };
