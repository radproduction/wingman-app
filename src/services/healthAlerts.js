'use strict';

const usersRepo = require('../db/users');
const health = require('./health');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

/**
 * Tells the user when a health reading has drifted from THEIR OWN normal.
 *
 * Deliberately restrained: at most one alert per metric per day, phrased as an
 * observation rather than a diagnosis. A health assistant that cries wolf gets
 * muted, and then the reading that mattered goes unseen too.
 */

function buildMessage(user, finding) {
  const tz = user.timezone || 'Asia/Karachi';
  const when = finding.recordedAt ? t.timeLabel(finding.recordedAt, tz) : 'just now';
  const dir = finding.direction === 'higher' ? 'higher than' : 'lower than';

  const nudges = {
    resting_heart_rate: 'That often follows poor sleep, stress or coming down with something — worth an easy day.',
    hrv: 'Usually a sign of fatigue or stress. Lighter training and an early night tend to help.',
    sleep_hours: 'A short night — try to protect tonight if you can.',
    blood_oxygen: 'Worth re-taking when you are rested and still.',
  };

  // No disclaimer here — the caller appends it once, whether the message came
  // from the AI analyst or from this fallback.
  return [
    `❤️ Your ${finding.label} is ${dir} usual — ${finding.value}${finding.unit} at ${when}, against your typical ${finding.baseline}${finding.unit}.`,
    nudges[finding.metric] || '',
  ].filter(Boolean).join('\n\n');
}

const DISCLAIMER = 'Just something I noticed in your data — not medical advice.';

/** Check one user and send at most one alert per metric per local day. */
async function alertForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: [] };

  const findings = health.findAnomalies(userId);
  if (!findings.length) return { sent: [] };

  const tz = user.timezone || 'Asia/Karachi';
  const dayKey = t.dateKeyInTz(tz, now);
  const prefs = user.preferences || {};
  const alerted = prefs.healthAlerted || {};   // { metric: 'YYYY-MM-DD' }

  // Only what we haven't already flagged today (still at most one mention per
  // metric per local day).
  const fresh = findings.filter((f) => alerted[f.metric] !== dayKey);
  if (!fresh.length) return { sent: [] };

  // One coherent read of everything that drifted — the AI analyst explains the
  // likely cause from the rest of the data. The fixed templates are only a
  // fallback so an alert still goes out if the model call fails.
  let body = null;
  try {
    body = await require('./healthInsight').explainAnomaly(userId, fresh, { name: user.name });
  } catch (err) {
    console.warn('[healthAlerts] insight failed, using fallback:', err.message);
  }
  if (!body) body = fresh.map((f) => buildMessage(user, f)).join('\n\n');

  const msg = `${body}\n\n${DISCLAIMER}`;

  if (send && wa().ready()) {
    // Window-aware: delivers out of the 24h window too when a proactive
    // template is configured, otherwise sends free-form in-window.
    try { await wa().sendProactiveMessage(user, msg, { now, logLabel: 'health' }); }
    catch (err) { console.warn('[healthAlerts] send failed:', err.message); }
  } else if (send) {
    console.log('[healthAlerts] (WA not ready) would alert:', fresh.map((f) => f.metric).join(', '));
  }

  for (const f of fresh) alerted[f.metric] = dayKey;
  const stored = usersRepo.getById(userId) || user;
  const p = stored.preferences || {};
  p.healthAlerted = alerted;
  usersRepo.update(userId, { preferences: p });

  return { sent: [msg] };
}

async function runAllUsers({ now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'health')) continue;
    try {
      const r = await alertForUser(u.id, { now });
      if (r.sent.length) results.push({ phone: u.phone, alerts: r.sent.length });
    } catch (err) {
      console.warn('[healthAlerts] failed for', u.phone, err.message);
    }
  }
  return results;
}

module.exports = { alertForUser, runAllUsers, buildMessage };
