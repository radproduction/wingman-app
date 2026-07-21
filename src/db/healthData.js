'use strict';

const { db, uuid } = require('./index');

/**
 * Health readings, stored source-agnostically: Apple Health (via an iOS
 * Shortcut), a wearable's cloud, or anything else that can POST JSON all land
 * in the same shape, so alerts and briefings don't care where data came from.
 */

// The metrics we understand, with the unit we normalise to.
const METRICS = {
  heart_rate: { unit: 'bpm', label: 'Heart rate' },
  resting_heart_rate: { unit: 'bpm', label: 'Resting heart rate' },
  hrv: { unit: 'ms', label: 'HRV' },
  steps: { unit: 'steps', label: 'Steps' },
  sleep_hours: { unit: 'h', label: 'Sleep' },
  calories: { unit: 'kcal', label: 'Active calories' },
  weight: { unit: 'kg', label: 'Weight' },
  blood_oxygen: { unit: '%', label: 'Blood oxygen' },
  // Activity load for the day (WHOOP strain 0–21, or a general exertion score).
  // Lets the analyst connect a hard day to the next morning's numbers.
  strain: { unit: '', label: 'Strain' },
  recovery: { unit: '%', label: 'Recovery' },
};

/** Accept the aliases different sources use for the same metric. */
const ALIASES = {
  hr: 'heart_rate', heartrate: 'heart_rate', bpm: 'heart_rate',
  resting_hr: 'resting_heart_rate', restinghr: 'resting_heart_rate', rhr: 'resting_heart_rate',
  heart_rate_variability: 'hrv', sdnn: 'hrv',
  step_count: 'steps', stepcount: 'steps',
  sleep: 'sleep_hours', sleep_duration: 'sleep_hours', asleep: 'sleep_hours',
  active_calories: 'calories', activeenergy: 'calories', active_energy: 'calories',
  spo2: 'blood_oxygen', oxygen_saturation: 'blood_oxygen',
  body_mass: 'weight',
  day_strain: 'strain', exertion: 'strain',
  recovery_score: 'recovery', readiness: 'recovery',
};

function canonicalMetric(name) {
  const k = String(name || '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  if (METRICS[k]) return k;
  if (ALIASES[k]) return ALIASES[k];
  return null;
}

/** Normalise a few units people commonly send so comparisons stay valid. */
function normalizeValue(metric, value, unit) {
  let v = Number(value);
  if (!Number.isFinite(v)) return null;
  const u = String(unit || '').trim().toLowerCase();

  if (metric === 'sleep_hours') {
    if (u === 'min' || u === 'mins' || u === 'minutes') v = v / 60;
    else if (u === 's' || u === 'sec' || u === 'seconds') v = v / 3600;
    // Sources that send minutes without a unit (e.g. 430) — treat >24 as minutes.
    else if (!u && v > 24) v = v / 60;
  }
  if (metric === 'weight' && (u === 'lb' || u === 'lbs' || u === 'pound' || u === 'pounds')) {
    v = v * 0.453592;
  }
  return Math.round(v * 100) / 100;
}

/**
 * Record one reading. Readings of the same metric at the same instant are
 * ignored, so a Shortcut that fires twice doesn't double-count.
 */
function record(userId, { metric, value, unit, recordedAt, source = 'manual' } = {}) {
  const m = canonicalMetric(metric);
  if (!m) return { saved: false, reason: 'unknown_metric', metric };

  const v = normalizeValue(m, value, unit);
  if (v == null) return { saved: false, reason: 'invalid_value', metric: m };

  const at = recordedAt ? new Date(recordedAt) : new Date();
  const atIso = Number.isNaN(at.getTime()) ? new Date().toISOString() : at.toISOString();

  const dupe = db.prepare(
    'SELECT id FROM health_data WHERE user_id = ? AND metric_type = ? AND recorded_at = ?'
  ).get(userId, m, atIso);
  if (dupe) return { saved: false, reason: 'duplicate', metric: m };

  const id = uuid();
  db.prepare(`
    INSERT INTO health_data (id, user_id, source, metric_type, value, unit, recorded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, source, m, v, METRICS[m].unit, atIso);
  return { saved: true, metric: m, value: v, unit: METRICS[m].unit };
}

/** Most recent reading of a metric. */
function latest(userId, metric) {
  const m = canonicalMetric(metric);
  if (!m) return null;
  return db.prepare(`
    SELECT * FROM health_data WHERE user_id = ? AND metric_type = ?
    ORDER BY recorded_at DESC LIMIT 1
  `).get(userId, m);
}

/** Latest value of every metric we hold for a user. */
function latestAll(userId) {
  return db.prepare(`
    SELECT h.* FROM health_data h
    JOIN (
      SELECT metric_type, MAX(recorded_at) AS m
      FROM health_data WHERE user_id = ? GROUP BY metric_type
    ) x ON x.metric_type = h.metric_type AND x.m = h.recorded_at
    WHERE h.user_id = ?
  `).all(userId, userId);
}

/** Readings of a metric within the last N days. */
function since(userId, metric, days = 14) {
  const m = canonicalMetric(metric);
  if (!m) return [];
  const from = new Date(Date.now() - days * 86400000).toISOString();
  return db.prepare(`
    SELECT * FROM health_data WHERE user_id = ? AND metric_type = ? AND recorded_at >= ?
    ORDER BY recorded_at ASC
  `).all(userId, m, from);
}

/**
 * The user's own normal for a metric — mean and spread over recent history,
 * EXCLUDING today so a bad day doesn't quietly become the new baseline.
 */
function baseline(userId, metric, { days = 21, excludeHours = 24 } = {}) {
  const m = canonicalMetric(metric);
  if (!m) return null;
  const from = new Date(Date.now() - days * 86400000).toISOString();
  const to = new Date(Date.now() - excludeHours * 3600000).toISOString();
  const rows = db.prepare(`
    SELECT value FROM health_data
    WHERE user_id = ? AND metric_type = ? AND recorded_at >= ? AND recorded_at <= ?
  `).all(userId, m, from, to);

  if (rows.length < 4) return null; // too little history to call anything unusual
  const vals = rows.map((r) => r.value);
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length;
  return { metric: m, mean, sd: Math.sqrt(variance), samples: vals.length };
}

function hasAnyData(userId) {
  const r = db.prepare('SELECT COUNT(*) AS n FROM health_data WHERE user_id = ?').get(userId);
  return ((r && r.n) || 0) > 0;
}

module.exports = {
  METRICS, canonicalMetric, normalizeValue,
  record, latest, latestAll, since, baseline, hasAnyData,
};
