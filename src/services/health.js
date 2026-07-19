'use strict';

const crypto = require('crypto');
const healthRepo = require('../db/healthData');
const usersRepo = require('../db/users');

/**
 * Health tracking, source-agnostic.
 *
 * Apple Health and Google Health Connect are on-device APIs with no server
 * side, so a web app cannot read them directly. Instead each user gets a
 * private ingest URL that anything can POST to — an iPhone Shortcuts
 * automation, an Android automation, or a wearable's cloud — and everything
 * lands in one place.
 */

/** Get (or create) the user's private ingest token. */
function tokenFor(userId) {
  const user = usersRepo.getById(userId);
  if (!user) return null;
  if (user.health_token) return user.health_token;
  const token = crypto.randomBytes(24).toString('base64url');
  usersRepo.update(userId, { health_token: token });
  return token;
}

/** Resolve an ingest token back to its user. */
function userForToken(token) {
  if (!token || String(token).length < 16) return null;
  const { db } = require('../db');
  const row = db.prepare('SELECT * FROM users WHERE health_token = ?').get(String(token));
  return row ? usersRepo.hydrate(row) : null;
}

function revokeToken(userId) {
  usersRepo.update(userId, { health_token: null });
}

/**
 * Ingest a batch of readings. Accepts either a single {metric, value} or a
 * list, so a Shortcut can send everything it collected in one call.
 */
function ingest(userId, payload, { source = 'shortcut' } = {}) {
  const items = Array.isArray(payload) ? payload
    : Array.isArray(payload && payload.readings) ? payload.readings
      : [payload];

  const saved = [];
  const skipped = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const r = healthRepo.record(userId, {
      metric: item.metric || item.type || item.name,
      value: item.value != null ? item.value : item.amount,
      unit: item.unit,
      recordedAt: item.recorded_at || item.recordedAt || item.date || item.timestamp,
      source: item.source || source,
    });
    (r.saved ? saved : skipped).push(r);
  }
  return { saved: saved.length, skipped: skipped.length, details: saved };
}

// How far from their own normal a reading must be before we say anything.
// Deliberately conservative — a nagging health alert gets muted, and then the
// one that matters is missed too.
const RULES = {
  resting_heart_rate: { sd: 2, minDelta: 5, direction: 'high', label: 'resting heart rate' },
  hrv: { sd: 2, minDelta: 8, direction: 'low', label: 'HRV' },
  sleep_hours: { sd: 1.5, minDelta: 1.5, direction: 'low', label: 'sleep' },
  blood_oxygen: { sd: 2, minDelta: 2, direction: 'low', label: 'blood oxygen' },
};

/**
 * Compare the latest readings against the user's own baseline.
 * Returns plain-language findings — never a diagnosis.
 */
function findAnomalies(userId) {
  const out = [];
  for (const [metric, rule] of Object.entries(RULES)) {
    const latest = healthRepo.latest(userId, metric);
    if (!latest) continue;
    const base = healthRepo.baseline(userId, metric);
    if (!base || base.sd === 0) continue;

    const delta = latest.value - base.mean;
    const z = delta / base.sd;
    const isHigh = rule.direction === 'high' && z >= rule.sd && delta >= rule.minDelta;
    const isLow = rule.direction === 'low' && -z >= rule.sd && -delta >= rule.minDelta;
    if (!isHigh && !isLow) continue;

    out.push({
      metric,
      label: rule.label,
      value: latest.value,
      unit: latest.unit,
      baseline: Math.round(base.mean * 10) / 10,
      direction: isHigh ? 'higher' : 'lower',
      recordedAt: latest.recorded_at,
    });
  }
  return out;
}

/** A short, factual summary for the briefing (null when there's no data). */
function summaryLine(userId) {
  const all = healthRepo.latestAll(userId);
  if (!all.length) return null;
  const by = Object.fromEntries(all.map((r) => [r.metric_type, r]));
  const bits = [];
  if (by.sleep_hours) bits.push(`${by.sleep_hours.value}h sleep`);
  if (by.resting_heart_rate) bits.push(`resting HR ${by.resting_heart_rate.value}`);
  if (by.steps) bits.push(`${Math.round(by.steps.value).toLocaleString('en-US')} steps`);
  if (!bits.length && by.heart_rate) bits.push(`HR ${by.heart_rate.value}`);
  return bits.length ? bits.join(' · ') : null;
}

function isConnected(user) {
  return !!(user && healthRepo.hasAnyData(user.id));
}

module.exports = {
  tokenFor, userForToken, revokeToken, ingest,
  findAnomalies, summaryLine, isConnected, RULES,
};
