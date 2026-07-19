'use strict';

const crypto = require('crypto');
const sessionsRepo = require('../db/workSessions');
const usersRepo = require('../db/users');
const t = require('../utils/time');

/**
 * Work hours tracking — knowing whether someone is still on the clock, so
 * Wingman can catch a forgotten clock-out before payroll does.
 *
 * Source-agnostic like health: the user's HRMS posts clock-in/clock-out to a
 * private URL, or they just tell Wingman. Either way it is the same session.
 */

// How long past their expected finish before we say anything. Short enough to
// be useful, long enough that someone wrapping up a task isn't interrupted.
const GRACE_HOURS = 0.5;

// A default working day when we have nothing better. Overridden by the user's
// own configured hours, and then by what they actually do.
const DEFAULT_DAY_HOURS = 8;

// When someone says they're staying late without saying how long.
const DEFAULT_SNOOZE_HOURS = 3;

/** Get (or create) the user's private webhook token. */
function tokenFor(userId) {
  const user = usersRepo.getById(userId);
  if (!user) return null;
  if (user.work_token) return user.work_token;
  const token = crypto.randomBytes(24).toString('base64url');
  usersRepo.update(userId, { work_token: token });
  return token;
}

/** Resolve a webhook token back to its user. */
function userForToken(token) {
  if (!token || String(token).length < 16) return null;
  const { db } = require('../db');
  const row = db.prepare('SELECT * FROM users WHERE work_token = ?').get(String(token));
  return row ? usersRepo.hydrate(row) : null;
}

function revokeToken(userId) {
  usersRepo.update(userId, { work_token: null });
}

// The names different systems use for the same two events.
const IN_WORDS = new Set(['clock_in', 'clockin', 'in', 'start', 'check_in', 'checkin', 'punch_in']);
const OUT_WORDS = new Set(['clock_out', 'clockout', 'out', 'end', 'stop', 'check_out', 'checkout', 'punch_out']);

function normalizeEvent(name) {
  const k = String(name || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (IN_WORDS.has(k)) return 'clock_in';
  if (OUT_WORDS.has(k)) return 'clock_out';
  return null;
}

/**
 * Handle one clock event from any source.
 * Accepts {event|type|action} and an optional {at|time|timestamp}.
 */
function handleEvent(userId, payload = {}, { source = 'hrms' } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { ok: false, error: 'no_user' };

  const event = normalizeEvent(payload.event || payload.type || payload.action || payload.status);
  if (!event) return { ok: false, error: 'unknown_event' };

  const at = payload.at || payload.time || payload.timestamp || payload.recorded_at || null;
  const timezone = user.timezone || 'Asia/Karachi';

  if (event === 'clock_in') {
    const r = sessionsRepo.clockIn(userId, { at, timezone, source });
    return { ok: r.ok, event, duplicate: !!r.duplicate, session: r.session };
  }
  const r = sessionsRepo.clockOut(userId, { at, source });
  return { ok: r.ok, event, noSession: !!r.noSession, hours: r.hours, session: r.session };
}

/** How long this user's working day is meant to be. */
function expectedDayHours(user) {
  const start = t.parseHhMm(user && user.work_hours_start);
  const end = t.parseHhMm(user && user.work_hours_end);
  if (start == null || end == null) return DEFAULT_DAY_HOURS;
  let mins = end - start;
  if (mins <= 0) mins += 24 * 60;        // an overnight shift
  const hours = mins / 60;
  return hours >= 1 && hours <= 16 ? hours : DEFAULT_DAY_HOURS;
}

function fmtDuration(hours) {
  if (hours == null || !Number.isFinite(hours)) return null;
  const total = Math.max(0, Math.round(hours * 60));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Where this user stands right now. */
function status(userId, { now = new Date() } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { connected: false };
  if (!sessionsRepo.hasAnyData(userId)) return { connected: false };

  const tz = user.timezone || 'Asia/Karachi';
  const open = sessionsRepo.currentOpen(userId);
  const today = sessionsRepo.forDay(userId, t.dateKeyInTz(tz, now));

  // Everything finished today, plus the open one if there is one.
  let workedToday = 0;
  for (const s of today) {
    const end = s.clock_out_at || now.toISOString();
    const h = sessionsRepo.hoursBetween(s.clock_in_at, end);
    if (h != null && h > 0) workedToday += h;
  }

  const expected = expectedDayHours(user);
  const typical = sessionsRepo.typicalEndMinutes(userId, {
    timezone: tz,
    weekday: sessionsRepo.localWeekday(now, tz),
  });

  return {
    connected: true,
    clocked_in: !!open,
    since: open ? t.timeLabel(open.clock_in_at, tz) : null,
    since_iso: open ? open.clock_in_at : null,
    on_clock_for: open ? fmtDuration(sessionsRepo.hoursBetween(open.clock_in_at, now.toISOString())) : null,
    worked_today: fmtDuration(workedToday),
    worked_today_hours: Math.round(workedToday * 100) / 100,
    expected_hours: expected,
    usually_finishes: typical != null ? minutesToLabel(typical) : null,
    sessions_today: today.length,
  };
}

function minutesToLabel(mins) {
  const h = Math.floor(mins / 60) % 24;
  const m = Math.round(mins % 60);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

/**
 * Should we ask this user about clocking out right now?
 *
 * The ordering matters: we check what they've told us and what they actually
 * do BEFORE we check the clock, so someone who always works late is never
 * nagged for doing their normal day.
 */
function shouldNudge(userId, { now = new Date() } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { nudge: false, reason: 'no_user' };

  const open = sessionsRepo.currentOpen(userId);
  if (!open) return { nudge: false, reason: 'not_clocked_in' };
  if (open.nudged_at) return { nudge: false, reason: 'already_asked' };
  if (open.snooze_until && new Date(open.snooze_until) > now) {
    return { nudge: false, reason: 'staying_late' };
  }

  const tz = user.timezone || 'Asia/Karachi';
  const worked = sessionsRepo.hoursBetween(open.clock_in_at, now.toISOString());
  if (worked == null) return { nudge: false, reason: 'bad_session' };

  const expected = expectedDayHours(user);
  if (worked < expected + GRACE_HOURS) return { nudge: false, reason: 'still_within_hours' };

  // Clocked in on an earlier local day and still open — they forgot, no
  // further checks needed. (Also avoids comparing clock times across midnight.)
  const startedToday = open.day_key === t.dateKeyInTz(tz, now);
  if (!startedToday) {
    return { nudge: true, session: open, worked, overBy: worked - expected, staleDay: true };
  }

  // Their own pattern for this weekday beats the configured hours — if Thursday
  // is normally a late one, 6pm is not late for them.
  const typical = sessionsRepo.typicalEndMinutes(userId, {
    timezone: tz,
    weekday: sessionsRepo.localWeekday(now, tz),
  });
  if (typical != null && t.minutesInTz(tz, now) < typical + 20) {
    return { nudge: false, reason: 'normal_for_this_day' };
  }

  return { nudge: true, session: open, worked, overBy: worked - expected };
}

/** Hold reminders on the open session — they said they're staying. */
function stayLate(userId, { untilISO = null, hours = DEFAULT_SNOOZE_HOURS, now = new Date() } = {}) {
  const open = sessionsRepo.currentOpen(userId);
  if (!open) return { ok: false, reason: 'not_clocked_in' };
  const until = untilISO || new Date(now.getTime() + hours * 3600000).toISOString();
  sessionsRepo.snooze(open.id, until);
  return { ok: true, until };
}

// ── Acting ON the attendance system (Wingman → HRMS) ─────────────────
//   The inbound webhook only tells us what happened. This is the other
//   direction: the user says "clock me out" and we actually do it.

const ACTION_TIMEOUT_MS = 8000;

/** Is outbound clocking set up for this user? */
function hasAction(user) {
  return !!(user && user.work_action_url && user.work_action_secret_enc);
}

/**
 * Store where to send clock actions, and the secret the user's system will
 * check. Validates the URL first — this is a URL our server will call.
 */
async function setAction(userId, { url, secret, employeeRef = null } = {}) {
  const secrets = require('../utils/secrets');
  const outboundUrl = require('../utils/outboundUrl');

  if (!secrets.available()) {
    return { ok: false, error: 'Secure storage is not configured on the server, so we cannot save that secret yet.' };
  }
  if (!secret || String(secret).length < 8) {
    return { ok: false, error: 'Use a secret of at least 8 characters — your system will check it to be sure the request is really from Wingman.' };
  }
  const safe = await outboundUrl.check(url);
  if (!safe.ok) return { ok: false, error: safe.reason };

  usersRepo.update(userId, {
    work_action_url: safe.url.toString(),
    work_action_secret_enc: secrets.encrypt(String(secret)),
    work_employee_ref: employeeRef ? String(employeeRef) : null,
  });
  return { ok: true, url: safe.url.toString() };
}

function clearAction(userId) {
  usersRepo.update(userId, {
    work_action_url: null,
    work_action_secret_enc: null,
    work_employee_ref: null,
  });
}

/**
 * Actually clock the user in or out on their own system.
 *
 * On success we also record the session locally, so what Wingman reports and
 * what their timesheet says do not drift apart.
 */
async function performClock(userId, event, { now = new Date() } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { ok: false, error: 'no_user' };

  const normalized = normalizeEvent(event);
  if (!normalized) return { ok: false, error: 'INVALID_EVENT' };
  if (!hasAction(user)) return { ok: false, error: 'ACTION_NOT_CONFIGURED' };

  const secrets = require('../utils/secrets');
  const outboundUrl = require('../utils/outboundUrl');

  // Re-check on every call: DNS could have changed since it was saved.
  const safe = await outboundUrl.check(user.work_action_url);
  if (!safe.ok) return { ok: false, error: 'UNSAFE_URL', detail: safe.reason };

  let secret;
  try { secret = secrets.decrypt(user.work_action_secret_enc); }
  catch (_) { return { ok: false, error: 'SECRET_UNREADABLE' }; }

  const body = {
    event: normalized,
    at: now.toISOString(),
    ...(user.work_employee_ref ? { employee: user.work_employee_ref } : {}),
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ACTION_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(safe.url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Wingman-Secret': secret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
      // A redirect would send the secret to a host we never validated.
      redirect: 'manual',
    });
  } catch (err) {
    clearTimeout(timer);
    const timedOut = err && err.name === 'AbortError';
    return { ok: false, error: timedOut ? 'TIMEOUT' : 'UNREACHABLE' };
  }
  clearTimeout(timer);

  if (res.status >= 300 && res.status < 400) {
    return { ok: false, error: 'REDIRECTED', detail: 'The endpoint redirected somewhere else, so we stopped rather than send the secret on.' };
  }
  if (res.status === 401 || res.status === 403) {
    return { ok: false, error: 'REJECTED', detail: 'The attendance system refused the secret.' };
  }

  let payload = null;
  try { payload = await res.json(); } catch (_) { /* a bare 200 is fine */ }
  if (!res.ok || (payload && payload.ok === false)) {
    return {
      ok: false,
      error: 'ACTION_FAILED',
      detail: (payload && (payload.error || payload.message)) || `The system returned ${res.status}.`,
    };
  }

  // Keep our own picture in step with theirs.
  const at = (payload && (payload.at || payload.time)) || now.toISOString();
  const local = handleEvent(userId, { event: normalized, at }, { source: 'hrms' });

  return {
    ok: true,
    event: normalized,
    at,
    already: normalized === 'clock_in' ? !!local.duplicate : !!local.noSession,
    worked: local.hours != null ? fmtDuration(local.hours) : null,
    remote: payload || null,
  };
}

/** One-line summary for the briefing / end-of-day wrap. Null when irrelevant. */
function summaryLine(userId, { now = new Date() } = {}) {
  const s = status(userId, { now });
  if (!s.connected) return null;
  if (s.clocked_in) {
    return `🕘 On the clock since ${s.since}${s.on_clock_for ? ` — ${s.on_clock_for} so far` : ''}.`;
  }
  if (s.worked_today_hours > 0) return `🕘 ${s.worked_today} logged today.`;
  return null;
}

module.exports = {
  tokenFor,
  userForToken,
  revokeToken,
  handleEvent,
  normalizeEvent,
  expectedDayHours,
  status,
  shouldNudge,
  stayLate,
  summaryLine,
  fmtDuration,
  hasAction,
  setAction,
  clearAction,
  performClock,
  GRACE_HOURS,
  DEFAULT_SNOOZE_HOURS,
};
