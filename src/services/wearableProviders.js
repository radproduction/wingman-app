'use strict';

/**
 * Wearable cloud providers, as data.
 *
 * Each entry is everything Wingman needs to connect and read one brand: OAuth
 * endpoints, scopes, and a `fetchReadings` that returns readings already in
 * Wingman's own shape. Adding a new brand is therefore one entry here, not new
 * plumbing anywhere else.
 *
 * These clouds are why "one click" is possible at all: the device syncs to the
 * manufacturer's server, and that server has an API. Apple Health has no such
 * cloud, which is the entire reason iPhone-only users still push data to a
 * private URL instead.
 */

const DAY = 86400000;

function iso(d) { return new Date(d).toISOString(); }
function dayStr(d) { return new Date(d).toISOString().slice(0, 10); }

/** Milliseconds → hours, rounded to the store's precision. */
function msToHours(ms) {
  const n = Number(ms);
  return Number.isFinite(n) ? n / 3600000 : null;
}

async function getJson(url, accessToken) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw new Error('UNAUTHORIZED');
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ── WHOOP ────────────────────────────────────────────────────────────
//   Recovery carries resting HR, HRV and SpO2; sleep carries the stage
//   breakdown. WHOOP rotates refresh tokens on every refresh, so the new one
//   must be stored or the connection dies after a single cycle.
async function fetchWhoop(accessToken, { since }) {
  const base = 'https://api.prod.whoop.com/developer';
  const start = encodeURIComponent(iso(since));
  const readings = [];

  const recovery = await getJson(`${base}/v2/recovery?start=${start}&limit=25`, accessToken);
  for (const rec of (recovery && recovery.records) || []) {
    const score = rec.score || {};
    const at = rec.created_at || rec.updated_at;
    if (!at) continue;
    if (Number.isFinite(Number(score.resting_heart_rate))) {
      readings.push({ metric: 'resting_heart_rate', value: Number(score.resting_heart_rate), unit: 'bpm', recordedAt: at });
    }
    if (Number.isFinite(Number(score.hrv_rmssd_milli))) {
      readings.push({ metric: 'hrv', value: Number(score.hrv_rmssd_milli), unit: 'ms', recordedAt: at });
    }
    if (Number.isFinite(Number(score.spo2_percentage))) {
      readings.push({ metric: 'blood_oxygen', value: Number(score.spo2_percentage), unit: '%', recordedAt: at });
    }
  }

  const sleep = await getJson(`${base}/v2/activity/sleep?start=${start}&limit=25`, accessToken);
  for (const rec of (sleep && sleep.records) || []) {
    const stages = (rec.score && rec.score.stage_summary) || {};
    // Actual sleep, not time in bed — lying awake is not rest.
    const asleepMs =
      Number(stages.total_light_sleep_time_milli || 0) +
      Number(stages.total_slow_wave_sleep_time_milli || 0) +
      Number(stages.total_rem_sleep_time_milli || 0);
    const hours = msToHours(asleepMs);
    const at = rec.end || rec.created_at;
    if (hours && at) readings.push({ metric: 'sleep_hours', value: hours, unit: 'h', recordedAt: at });
  }

  return readings;
}

// ── OURA ─────────────────────────────────────────────────────────────
async function fetchOura(accessToken, { since }) {
  const base = 'https://api.ouraring.com/v2/usercollection';
  const from = dayStr(since);
  const to = dayStr(Date.now() + DAY);
  const range = `start_date=${from}&end_date=${to}`;
  const readings = [];

  const sleep = await getJson(`${base}/sleep?${range}`, accessToken);
  for (const s of (sleep && sleep.data) || []) {
    const at = s.bedtime_end || (s.day ? `${s.day}T12:00:00.000Z` : null);
    if (!at) continue;
    if (Number.isFinite(Number(s.total_sleep_duration))) {
      readings.push({ metric: 'sleep_hours', value: Number(s.total_sleep_duration), unit: 's', recordedAt: at });
    }
    if (Number.isFinite(Number(s.average_heart_rate))) {
      readings.push({ metric: 'resting_heart_rate', value: Number(s.average_heart_rate), unit: 'bpm', recordedAt: at });
    }
    if (Number.isFinite(Number(s.average_hrv))) {
      readings.push({ metric: 'hrv', value: Number(s.average_hrv), unit: 'ms', recordedAt: at });
    }
  }

  const activity = await getJson(`${base}/daily_activity?${range}`, accessToken);
  for (const a of (activity && activity.data) || []) {
    if (!a.day || !Number.isFinite(Number(a.steps))) continue;
    readings.push({ metric: 'steps', value: Number(a.steps), unit: 'steps', recordedAt: `${a.day}T12:00:00.000Z` });
  }

  // SpO2 is ring-model dependent, so a 404/422 here is normal — not an error.
  try {
    const spo2 = await getJson(`${base}/daily_spo2?${range}`, accessToken);
    for (const s of (spo2 && spo2.data) || []) {
      const avg = s.spo2_percentage && s.spo2_percentage.average;
      if (!s.day || !Number.isFinite(Number(avg))) continue;
      readings.push({ metric: 'blood_oxygen', value: Number(avg), unit: '%', recordedAt: `${s.day}T12:00:00.000Z` });
    }
  } catch (_) { /* older rings don't report SpO2 */ }

  return readings;
}

const PROVIDERS = {
  whoop: {
    id: 'whoop',
    label: 'WHOOP',
    blurb: 'Sleep, recovery, resting heart rate & HRV',
    authUrl: 'https://api.prod.whoop.com/oauth/oauth2/auth',
    tokenUrl: 'https://api.prod.whoop.com/oauth/oauth2/token',
    // `offline` is what makes WHOOP issue a refresh token at all.
    scopes: ['read:recovery', 'read:sleep', 'read:cycles', 'offline'],
    scopeSeparator: ' ',
    clientIdEnv: 'WHOOP_CLIENT_ID',
    clientSecretEnv: 'WHOOP_CLIENT_SECRET',
    rotatesRefreshToken: true,
    fetchReadings: fetchWhoop,
  },
  oura: {
    id: 'oura',
    label: 'Oura Ring',
    blurb: 'Sleep, readiness, resting heart rate & HRV',
    authUrl: 'https://cloud.ouraring.com/oauth/authorize',
    tokenUrl: 'https://api.ouraring.com/oauth/token',
    scopes: ['daily', 'heartrate', 'personal', 'spo2'],
    scopeSeparator: ' ',
    clientIdEnv: 'OURA_CLIENT_ID',
    clientSecretEnv: 'OURA_CLIENT_SECRET',
    fetchReadings: fetchOura,
  },
  // Garmin is intentionally absent: its Connect Developer Program is closed to
  // new sign-ups, so no credentials can be obtained today. The moment it
  // reopens this becomes one more entry, nothing else changes.
};

function get(id) {
  return PROVIDERS[String(id || '').toLowerCase()] || null;
}

/** Providers this deployment actually has credentials for. */
function configured() {
  return Object.values(PROVIDERS).filter(
    (p) => process.env[p.clientIdEnv] && process.env[p.clientSecretEnv]
  );
}

function isConfigured(p) {
  return !!(p && process.env[p.clientIdEnv] && process.env[p.clientSecretEnv]);
}

function credentials(p) {
  return { clientId: process.env[p.clientIdEnv] || '', clientSecret: process.env[p.clientSecretEnv] || '' };
}

module.exports = { PROVIDERS, get, configured, isConfigured, credentials, msToHours };
