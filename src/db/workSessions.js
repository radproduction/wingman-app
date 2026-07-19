'use strict';

const { db, uuid } = require('./index');
const t = require('../utils/time');

/**
 * Clock-in / clock-out sessions.
 *
 * Source-agnostic on purpose: an HRMS posting to the user's private webhook and
 * the user simply telling Wingman "clocked in" produce the same row, so the
 * reminder logic never has to care which one it was.
 *
 * A session is OPEN while clock_out_at is NULL — that is the whole basis for
 * "you're still clocked in".
 */

// A session longer than this was almost certainly a forgotten clock-out, not a
// real shift. We ignore those when learning someone's normal finishing time,
// otherwise every forgotten day drags the "usual" later and the reminder
// quietly stops firing for exactly the person who needs it most.
const IMPLAUSIBLE_SHIFT_HOURS = 12;

// Beyond this an open session is stale — closing it keeps tomorrow's clock-in
// from being read as one endless shift.
const STALE_AFTER_HOURS = 18;

function hoursBetween(aISO, bISO) {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return (b - a) / 3600000;
}

/** The user's currently open session, if any. */
function currentOpen(userId) {
  return db.prepare(
    `SELECT * FROM work_sessions
      WHERE user_id = ? AND clock_out_at IS NULL
      ORDER BY clock_in_at DESC LIMIT 1`
  ).get(userId) || null;
}

/**
 * Clock in. If a session is already open we leave it alone rather than opening
 * a second one — a duplicate webhook should not look like a double shift.
 */
function clockIn(userId, { at, timezone = 'Asia/Karachi', source = 'hrms' } = {}) {
  const when = at ? new Date(at) : new Date();
  if (!Number.isFinite(when.getTime())) return { ok: false, reason: 'bad_time' };

  const open = currentOpen(userId);
  if (open) {
    const age = hoursBetween(open.clock_in_at, when.toISOString());
    if (age != null && age < STALE_AFTER_HOURS) {
      return { ok: true, duplicate: true, session: open };
    }
    // Yesterday's shift was never closed. Close it at its last plausible point
    // so today starts clean.
    closeById(open.id, when.toISOString());
  }

  const row = {
    id: uuid(),
    user_id: userId,
    clock_in_at: when.toISOString(),
    day_key: t.dateKeyInTz(timezone, when),
    source,
  };
  db.prepare(
    `INSERT INTO work_sessions (id, user_id, clock_in_at, day_key, source)
     VALUES (@id, @user_id, @clock_in_at, @day_key, @source)`
  ).run(row);
  return { ok: true, session: db.prepare('SELECT * FROM work_sessions WHERE id = ?').get(row.id) };
}

function closeById(id, whenISO) {
  db.prepare('UPDATE work_sessions SET clock_out_at = ? WHERE id = ?').run(whenISO, id);
}

/** Clock out of the open session. No open session is not an error — just a no-op. */
function clockOut(userId, { at, source } = {}) {
  const when = at ? new Date(at) : new Date();
  if (!Number.isFinite(when.getTime())) return { ok: false, reason: 'bad_time' };

  const open = currentOpen(userId);
  if (!open) return { ok: true, noSession: true };
  if (source) db.prepare('UPDATE work_sessions SET source = ? WHERE id = ?').run(source, open.id);
  closeById(open.id, when.toISOString());
  return {
    ok: true,
    session: db.prepare('SELECT * FROM work_sessions WHERE id = ?').get(open.id),
    hours: hoursBetween(open.clock_in_at, when.toISOString()),
  };
}

function markNudged(id, whenISO = new Date().toISOString()) {
  db.prepare('UPDATE work_sessions SET nudged_at = ? WHERE id = ?').run(whenISO, id);
}

/** Hold off on reminders for this session until `untilISO`. */
function snooze(id, untilISO) {
  db.prepare('UPDATE work_sessions SET snooze_until = ? WHERE id = ?').run(untilISO, id);
}

/** Completed sessions, most recent first. */
function recent(userId, { days = 60, limit = 90 } = {}) {
  const since = new Date(Date.now() - days * 86400000).toISOString();
  return db.prepare(
    `SELECT * FROM work_sessions
      WHERE user_id = ? AND clock_out_at IS NOT NULL AND clock_in_at >= ?
      ORDER BY clock_in_at DESC LIMIT ?`
  ).all(userId, since, limit);
}

/** Every session that started on the user's local `dayKey`. */
function forDay(userId, dayKey) {
  return db.prepare(
    'SELECT * FROM work_sessions WHERE user_id = ? AND day_key = ? ORDER BY clock_in_at ASC'
  ).all(userId, dayKey);
}

function median(nums) {
  if (!nums.length) return null;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/**
 * When this user actually tends to finish on a given weekday, in minutes past
 * local midnight — median so one very late night doesn't move it much.
 *
 * Returns null until there are enough real days to call it a pattern; the
 * caller then falls back to their configured hours. Guessing from two days
 * would be worse than not guessing.
 */
function typicalEndMinutes(userId, { timezone = 'Asia/Karachi', weekday = null, minSamples = 3 } = {}) {
  const sessions = recent(userId, { days: 60 });
  const mins = [];
  for (const s of sessions) {
    const len = hoursBetween(s.clock_in_at, s.clock_out_at);
    if (len == null || len > IMPLAUSIBLE_SHIFT_HOURS || len < 1) continue;
    const out = new Date(s.clock_out_at);
    // Weekday in the user's timezone, not the server's.
    if (weekday != null && localWeekday(out, timezone) !== weekday) continue;
    mins.push(t.minutesInTz(timezone, out));
  }
  if (mins.length < minSamples) return null;
  return median(mins);
}

/** Local day of week (0=Sun) for an instant, in the given timezone. */
function localWeekday(date, timeZone) {
  const label = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(date);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(label);
}

/** Every user with a session still open — the candidates for a reminder. */
function usersWithOpenSessions() {
  return db.prepare(
    'SELECT DISTINCT user_id FROM work_sessions WHERE clock_out_at IS NULL'
  ).all().map((r) => r.user_id);
}

/** True once this user has any clock data at all. */
function hasAnyData(userId) {
  const row = db.prepare('SELECT 1 FROM work_sessions WHERE user_id = ? LIMIT 1').get(userId);
  return !!row;
}

module.exports = {
  clockIn,
  clockOut,
  currentOpen,
  markNudged,
  snooze,
  recent,
  forDay,
  typicalEndMinutes,
  localWeekday,
  usersWithOpenSessions,
  hasAnyData,
  hoursBetween,
  IMPLAUSIBLE_SHIFT_HOURS,
  STALE_AFTER_HOURS,
};
