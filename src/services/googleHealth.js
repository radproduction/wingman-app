'use strict';

const googleAuth = require('../auth/googleAuth');
const usersRepo = require('../db/users');
const healthRepo = require('../db/healthData');

/**
 * Pull health data from the Google Health API into Wingman's own store.
 *
 * This is the one-click path: Android, Pixel Watch, Fitbit, Wear OS and any app
 * that syncs to Google all land here through a normal OAuth consent — no phone
 * automation, no per-device setup. (Apple Health has no equivalent: Apple keeps
 * HealthKit on-device with no cloud API, so iPhone-only users still push data
 * to their private ingest URL.)
 *
 * Everything written here goes through the same healthData store as every other
 * source, so alerts and briefings never need to know where a reading came from.
 */

const BASE = 'https://health.googleapis.com/v4';

// Google's data type (kebab-case in the path) → our canonical metric, plus how
// to pick a number out of that type's rollup object. Preferred suffixes are
// tried in order before falling back to the first numeric field, so a renamed
// or newly added field degrades to "still works" rather than "silently empty".
const TYPES = [
  { path: 'steps', metric: 'steps', prefer: ['_sum', '_total'] },
  { path: 'daily-resting-heart-rate', metric: 'resting_heart_rate', prefer: ['_avg', '_min'] },
  { path: 'sleep', metric: 'sleep_hours', prefer: ['_sum', '_total'], duration: true },
  { path: 'heart-rate', metric: 'heart_rate', prefer: ['_avg'], maxDays: 14 },
  { path: 'heart-rate-variability', metric: 'hrv', prefer: ['_avg'] },
  { path: 'oxygen-saturation', metric: 'blood_oxygen', prefer: ['_avg'] },
  { path: 'weight', metric: 'weight', prefer: ['_avg', '_last'] },
];

// Google caps most types at 90 days per request, heart-rate at 14.
const DEFAULT_DAYS = 7;

function civil(date) {
  return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
}

function civilToISO(c) {
  if (!c || !c.year) return null;
  const mm = String(c.month || 1).padStart(2, '0');
  const dd = String(c.day || 1).padStart(2, '0');
  return `${c.year}-${mm}-${dd}T12:00:00.000Z`;   // midday, so timezone shifts keep the day
}

/**
 * Pull a number out of a rollup point. The value object's key differs per data
 * type (steps → {count_sum}, heartRate → {bpm_avg}), so rather than hardcode a
 * table that breaks the moment Google adds a field, we look for the first
 * value-shaped object and take the most meaningful number in it.
 */
function extractValue(point, prefer = []) {
  for (const [key, val] of Object.entries(point || {})) {
    if (key === 'civilStartTime' || key === 'civilEndTime') continue;
    if (!val || typeof val !== 'object') continue;

    for (const suffix of prefer) {
      for (const [k, v] of Object.entries(val)) {
        if (k.endsWith(suffix) && Number.isFinite(Number(v))) return Number(v);
      }
    }
    for (const v of Object.values(val)) {
      if (Number.isFinite(Number(v))) return Number(v);
    }
  }
  return null;
}

/**
 * Sleep comes back as a duration, but the unit isn't guaranteed. Decide from
 * magnitude rather than assuming: nobody sleeps 480 hours, and 8 seconds is not
 * a night's sleep. Guessing wrong here would poison the baseline silently.
 */
function sleepUnitFor(value) {
  if (value > 1440) return 's';      // > 24h expressed in minutes ⇒ seconds
  if (value > 24) return 'min';      // > 24 ⇒ minutes
  return 'h';
}

async function callDailyRollUp(client, typePath, days) {
  const end = new Date();
  const start = new Date(end.getTime() - days * 86400000);

  const res = await client.request({
    url: `${BASE}/users/me/dataTypes/${typePath}/dataPoints:dailyRollUp`,
    method: 'POST',
    data: {
      range: { start: civil(start), end: civil(end) },
      windowSizeDays: 1,
      pageSize: 100,
      dataSourceFamily: 'users/me/dataSourceFamilies/all-sources',
    },
  });
  return (res && res.data && res.data.rollupDataPoints) || [];
}

/**
 * Sync one user. Never throws — a health sync failing must not take down the
 * scheduler tick that also runs briefings and alerts.
 *
 * @returns {Promise<{saved:number, skipped:number, errors:string[]}>}
 */
async function syncUser(userId, { days = DEFAULT_DAYS } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { saved: 0, skipped: 0, errors: ['no_user'] };
  if (!googleAuth.isHealthConnected(user)) return { saved: 0, skipped: 0, errors: ['NOT_CONNECTED'] };

  const client = googleAuth.getHealthClient(user);
  if (!client) return { saved: 0, skipped: 0, errors: ['NOT_CONNECTED'] };

  let saved = 0;
  let skipped = 0;
  const errors = [];

  for (const type of TYPES) {
    const window = Math.min(days, type.maxDays || 90);
    let points;
    try {
      points = await callDailyRollUp(client, type.path, window);
    } catch (err) {
      // One unavailable data type (user has no scale, no watch) must not stop
      // the rest — record it and carry on.
      const msg = (err && err.message) || 'request_failed';
      errors.push(`${type.path}: ${msg.slice(0, 120)}`);
      continue;
    }

    for (const point of points) {
      const raw = extractValue(point, type.prefer);
      if (raw == null) { skipped += 1; continue; }

      const recordedAt = civilToISO(point.civilStartTime);
      const unit = type.duration ? sleepUnitFor(raw) : undefined;

      const r = healthRepo.record(user.id, {
        metric: type.metric,
        value: raw,
        unit,
        recordedAt,
        source: 'google_health',
      });
      if (r.saved) saved += 1; else skipped += 1;
    }
  }

  usersRepo.update(user.id, { google_health_synced_at: new Date().toISOString() });
  return { saved, skipped, errors };
}

/** Sync every connected user. Used by the scheduler. */
async function syncAllUsers({ days = DEFAULT_DAYS } = {}) {
  const { db } = require('../db');
  const rows = db.prepare(
    'SELECT id FROM users WHERE google_health_token IS NOT NULL AND google_health_token != ""'
  ).all();

  const results = [];
  for (const row of rows) {
    try {
      const r = await syncUser(row.id, { days });
      if (r.saved) results.push({ userId: row.id, saved: r.saved });
    } catch (err) {
      console.warn('[googleHealth] sync failed for', row.id, err.message);
    }
  }
  if (results.length) console.log('[googleHealth] synced', results.length, 'user(s)');
  return results;
}

module.exports = { syncUser, syncAllUsers, extractValue, sleepUnitFor, TYPES };
