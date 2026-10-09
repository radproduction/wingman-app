'use strict';

/**
 * The profile card — layer 2 of "Wingman knows you", in a usable shape.
 *
 * Wingman collects a lot about a person in separate places: facts learned from
 * chat (user_memory), the Gmail/Calendar onboarding profile, its notes on every
 * connected app (app_knowledge), and observed habits (behaviorPatterns). This
 * service distils them into ONE short, structured card — who they are, their
 * work, the people that matter, active projects, how they like things done,
 * their routine — and that card leads the system prompt of every chat.
 *
 * Rebuilt in the background when the inputs have changed (at most daily per
 * user, a few users per tick). Only states what the inputs support.
 */

const config = require('../config');
const claude = require('../llm/claude');
const usersRepo = require('../db/users');

const MIN_HOURS_BETWEEN = 24;
const PER_TICK = 3;

const SYSTEM = `You write the profile card an AI chief of staff keeps about the person it works for. You are given everything the assistant has learned so far. Distil it into a short card using exactly these headings (leave a heading out if there is nothing real for it):

WHO: name, where they are, their role in one line.
WORK & BUSINESS: what they do / run, company names, what they sell or deliver, stage of the business.
KEY PEOPLE: the people who matter and who they are to the user (name — relationship/role).
ACTIVE PROJECTS & GOALS: what they are working on or toward right now.
HOW THEY LIKE THINGS: communication language/tone, preferences, what to always/never do.
ROUTINE: working hours, rhythms, when they are active.
WATCH OUT: sensitivities, things they said not to do, open loops worth remembering.

Rules: only what the input supports — never guess or pad. Use real names and specifics. Bullet points, terse. Max ~1600 characters. Output only the card.`;

function factsOf(user) {
  try { return require('../db/userMemory').listForUser(user.id, 60); } catch (_) { return []; }
}

function inputsFor(user) {
  const parts = [];
  parts.push(`Name: ${user.name || '(unknown)'} · Timezone: ${user.timezone || '(unknown)'}${user.runs_business ? ' · Runs a business' : ''}`);
  const onboarding = user.preferences && user.preferences.onboarding && user.preferences.onboarding.profile;
  if (onboarding) parts.push(`FROM THEIR EMAIL/CALENDAR/TASKS:\n${String(onboarding).slice(0, 1500)}`);
  const facts = factsOf(user);
  if (facts.length) parts.push(`FACTS LEARNED (explicit = they told us):\n${facts.map((f) => `- [${f.source === 'explicit' ? 'explicit' : 'learned'}/${f.category}] ${f.fact}`).join('\n')}`);
  try {
    const notes = require('../db/appKnowledge').listForUser(user.id).filter((r) => r.note);
    if (notes.length) parts.push(`NOTES ON THEIR CONNECTED APPS:\n${notes.map((r) => `## ${r.app}\n${String(r.note).slice(0, 900)}`).join('\n')}`);
  } catch (_) { /* optional */ }
  try {
    const b = require('./behaviorPatterns').promptBlock(user.id, (user.name || '').split(' ')[0] || 'them');
    if (b) parts.push(`OBSERVED BEHAVIOUR:\n${String(b).slice(0, 1200)}`);
  } catch (_) { /* optional */ }
  try {
    const rules = require('../db/userRules').listForUser(user.id);
    if (rules.length) parts.push(`THEIR STANDING RULES:\n${rules.map((r) => `- ${r.kind}: ${r.text}`).join('\n')}`);
  } catch (_) { /* optional */ }
  return parts;
}

/** A cheap fingerprint of the inputs, so we only rebuild when something changed. */
function fingerprint(user) {
  const facts = factsOf(user);
  let notes = '';
  try { notes = require('../db/appKnowledge').listForUser(user.id).map((r) => `${r.app}:${r.studied_at}`).join(','); } catch (_) { /* optional */ }
  const ob = (user.preferences && user.preferences.onboarding && user.preferences.onboarding.profile) || '';
  return `${facts.length}|${facts.map((f) => f.updated_at).sort().pop() || ''}|${notes}|${ob.length}`;
}

async function refresh(userId, { force = false } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { skipped: 'no_user' };
  const card = (user.preferences && user.preferences.profileCard) || null;
  const fp = fingerprint(user);
  if (!force && card) {
    const ageH = (Date.now() - (Date.parse(card.at) || 0)) / 3600000;
    if (ageH < MIN_HOURS_BETWEEN || card.fp === fp) return { skipped: 'fresh' };
  }
  const inputs = inputsFor(user);
  if (inputs.length < 2) return { skipped: 'not_enough_data' };

  let text;
  try {
    text = await claude.complete(`Everything known about this person:\n\n${inputs.join('\n\n')}\n\nWrite the card now.`, {
      system: SYSTEM, model: config.anthropic.model, maxTokens: 900,
    });
  } catch (e) {
    console.warn('[profile] build failed:', e.message);
    return { skipped: 'llm_error' };
  }
  text = String(text || '').trim().slice(0, 2400);
  if (text.length < 40) return { skipped: 'empty' };
  usersRepo.updatePreferences(userId, { profileCard: { text, at: new Date().toISOString(), fp } });
  console.log(`[profile] card updated for ${userId}`);
  return { updated: true };
}

/** Scheduler tick: refresh a few users whose inputs changed. */
async function runDue() {
  let users = [];
  try { users = usersRepo.listOnboarded(); } catch (_) { return { updated: 0 }; }
  let updated = 0;
  for (const u of users) {
    if (updated >= PER_TICK) break;
    try {
      const r = await refresh(u.id);
      if (r.updated) updated += 1;
    } catch (e) {
      console.warn(`[profile] ${u.id} failed:`, e.message);
    }
  }
  return { updated };
}

function card(user) {
  return (user && user.preferences && user.preferences.profileCard && user.preferences.profileCard.text) || '';
}

module.exports = { refresh, runDue, card };
