'use strict';

const claude = require('../llm/claude');
const healthRepo = require('../db/healthData');
const health = require('./health');

/**
 * The AI health analyst.
 *
 * Showing raw numbers is pointless — the user can see those in their Whoop or
 * phone. The value Wingman adds is READING those numbers the way a thoughtful
 * coach would: what stands out, what it likely means for THIS person given
 * THEIR own normal, and one concrete thing to do about it today.
 *
 * Hard lines, because this is health:
 *   - Compare to the user's own baseline, never population averages.
 *   - Wellness lane only: rest, hydration, sleep, load, stress. Never diagnose,
 *     never name a condition, never touch medication.
 *   - Every number it cites must come from the data passed in — no inventing a
 *     reading, no guessing a cause it cannot see.
 *   - If something looks genuinely concerning, say plainly it's worth a doctor,
 *     rather than reassuring the user out of it.
 */

const SYSTEM = `You are a warm, sharp health coach reading someone's wearable data (Whoop, Google Health, etc.) over WhatsApp. You turn numbers into a short, human read — not a data dump.

Rules, no exceptions:
- Judge every metric against THIS person's own baseline that you are given, not general averages. "Your resting HR is 62 vs your usual 54" — never "a normal resting HR is…".
- Only mention numbers present in the data provided. Never invent or estimate a reading. If a metric is missing, ignore it.
- Stay in the wellness lane: sleep, recovery, training load, hydration, stress, taking it easy. NEVER diagnose, NEVER name a medical condition, NEVER mention medication.
- When you suggest a cause, tie it to what the data actually shows (e.g. high strain yesterday → higher resting HR today). If you don't have the cause, offer the common ones briefly without asserting one.
- If a reading looks genuinely worrying, or several point the same worrying way, say plainly it's worth checking with a doctor — do not talk them out of it.
- Be brief and warm. WhatsApp, not a report. 2–4 short lines. A little emoji is fine, not a wall of it.
- End nothing with a disclaimer paragraph; the caller adds one line already.`;

/**
 * Build the compact, factual picture the model reasons over: each metric's
 * latest value, the user's own baseline, and a short recent trend.
 */
function gatherPicture(userId) {
  const latest = healthRepo.latestAll(userId);
  if (!latest.length) return null;

  const lines = [];
  const seen = [];
  for (const row of latest) {
    const metric = row.metric_type;
    const base = healthRepo.baseline(userId, metric);
    const recent = healthRepo.since(userId, metric, 7)
      .slice(-5)
      .map((r) => Math.round(r.value * 10) / 10);

    const parts = [`${metric}: latest ${row.value}${row.unit || ''}`];
    if (base && base.samples >= 4) parts.push(`their usual ≈ ${Math.round(base.mean * 10) / 10}${row.unit || ''}`);
    if (recent.length > 1) parts.push(`last few: ${recent.join(', ')}`);
    lines.push('- ' + parts.join(' | '));
    seen.push(metric);
  }

  const anomalies = health.findAnomalies(userId);
  return { text: lines.join('\n'), metrics: seen, anomalies };
}

/** True once there is enough to say something meaningful. */
function hasEnough(userId) {
  return healthRepo.hasAnyData(userId);
}

/**
 * A morning "how are you doing" read for the briefing.
 * Returns a short string, or null when there's nothing to say or the LLM fails
 * (a health line must never break the whole briefing).
 */
async function morningCheckin(userId, { name } = {}) {
  const pic = gatherPicture(userId);
  if (!pic) return null;

  const who = name ? `${name}'s` : 'the user\'s';
  const prompt = `Here is ${who} latest wearable data:\n\n${pic.text}\n\n` +
    (pic.anomalies.length
      ? `Notably off from their normal: ${pic.anomalies.map((a) => `${a.label} ${a.direction} (${a.value}${a.unit} vs ${a.baseline}${a.unit})`).join('; ')}.\n\n`
      : 'Nothing is far from their normal.\n\n') +
    `Give them a short morning read on how they're doing and one practical thing for today. If everything looks good, say so briefly and encouragingly — don't manufacture a problem.`;

  try {
    const text = await claude.complete(prompt, { system: SYSTEM, maxTokens: 400 });
    return (text || '').trim() || null;
  } catch (err) {
    console.warn('[healthInsight] morning check-in failed:', err.message);
    return null;
  }
}

/**
 * An explanation for a proactive alert when a reading has drifted from normal.
 * `findings` are from health.findAnomalies. Returns a short string or null.
 */
async function explainAnomaly(userId, findings, { name } = {}) {
  if (!findings || !findings.length) return null;
  const pic = gatherPicture(userId);
  if (!pic) return null;

  const who = name ? name : 'the user';
  const prompt = `${who}'s wearable just synced. Full picture:\n\n${pic.text}\n\n` +
    `What stands out as off from their own normal: ` +
    findings.map((f) => `${f.label} is ${f.direction} than usual (${f.value}${f.unit} vs their typical ${f.baseline}${f.unit})`).join('; ') + `.\n\n` +
    `Send a short, caring heads-up: what you noticed, the most likely everyday reason given the rest of their data (e.g. high strain, short sleep, low recovery), and one thing to do today. If it's mild, keep it light. If it genuinely looks worth a doctor, say so.`;

  try {
    const text = await claude.complete(prompt, { system: SYSTEM, maxTokens: 400 });
    return (text || '').trim() || null;
  } catch (err) {
    console.warn('[healthInsight] anomaly explain failed:', err.message);
    return null;
  }
}

module.exports = { morningCheckin, explainAnomaly, gatherPicture, hasEnough };
