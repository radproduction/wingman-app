'use strict';

const { db, uuid } = require('./index');

const DEFAULT_SKILLS = [
  'travel_assistant', 'bill_tracker', 'delivery_tracker', 'people_crm', 'followup_tracker',
];

/** Find a user by their WhatsApp phone number (digits only). */
function getByPhone(phone) {
  const row = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  return hydrate(row);
}

function getById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return hydrate(row);
}

/** Create a new user with just a phone number. */
function create({ phone, name = null } = {}) {
  const id = uuid();
  db.prepare(`
    INSERT INTO users (id, phone, name, preferences)
    VALUES (@id, @phone, @name, @preferences)
  `).run({
    id,
    phone,
    name,
    preferences: JSON.stringify({}),
  });
  return getById(id);
}

/**
 * Update arbitrary columns on a user.
 * `preferences` may be passed as an object and will be JSON-stringified.
 * `enabled_skills` may be passed as an array and will be JSON-stringified.
 */
function update(id, fields = {}) {
  const allowed = [
    'phone', 'name', 'timezone', 'work_hours_start', 'work_hours_end',
    'language', 'gmail_token', 'calendar_token', 'health_connected', 'preferences',
    'onboarding_complete', 'briefing_time', 'debrief_time', 'proactiveness_level',
    'enabled_skills', 'tone', 'communication_style',
    'shopify_domain', 'shopify_token',
    'news_topics', 'news_city', 'news_country',
    'home_address', 'home_lat', 'home_lng', 'office_address', 'office_lat', 'office_lng',
    'voice_replies', 'voice_name', 'assistant_name', 'health_token', 'work_token', 'google_health_token', 'google_health_synced_at',
    'work_action_url', 'work_action_secret_enc', 'work_employee_ref',
    'webmail_address', 'webmail_password_enc', 'webmail_imap_host', 'webmail_imap_port',
    'webmail_smtp_host', 'webmail_smtp_port', 'webmail_from_name',
  ];
  const sets = [];
  const params = { id };
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k)) continue;
    sets.push(`${k} = @${k}`);
    if (k === 'preferences' && typeof v === 'object') params[k] = JSON.stringify(v);
    else if (k === 'enabled_skills' && Array.isArray(v)) params[k] = JSON.stringify(v);
    else if (k === 'news_topics' && Array.isArray(v)) params[k] = JSON.stringify(v);
    else if (typeof v === 'boolean') params[k] = v ? 1 : 0;
    else params[k] = v;
  }
  if (sets.length === 0) return getById(id);
  db.prepare(`UPDATE users SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return getById(id);
}

/** Parse the JSON blobs (preferences, enabled_skills) into usable structures. */
function hydrate(row) {
  if (!row) return row;
  try { row.preferences = JSON.parse(row.preferences || '{}'); }
  catch (_) { row.preferences = {}; }
  try {
    row.enabled_skills = row.enabled_skills
      ? JSON.parse(row.enabled_skills)
      : DEFAULT_SKILLS.slice();
    if (!Array.isArray(row.enabled_skills)) row.enabled_skills = DEFAULT_SKILLS.slice();
  } catch (_) { row.enabled_skills = DEFAULT_SKILLS.slice(); }
  try {
    row.news_topics = row.news_topics ? JSON.parse(row.news_topics) : null;
    if (!Array.isArray(row.news_topics)) row.news_topics = null;
  } catch (_) { row.news_topics = null; }
  row.onboarding_complete = !!row.onboarding_complete;
  return row;
}

/** Convenience: is this user fully onboarded? */
function isOnboarded(user) {
  return !!(user && user.onboarding_complete);
}

/** Does the user have a given skill enabled? */
function hasSkill(user, skill) {
  if (!user) return false;
  const skills = Array.isArray(user.enabled_skills) ? user.enabled_skills : DEFAULT_SKILLS;
  return skills.includes(skill);
}

/** All users that have connected Gmail (have a gmail_token). */
function listConnectedEmailUsers() {
  const rows = db.prepare('SELECT * FROM users WHERE gmail_token IS NOT NULL').all();
  return rows.map(hydrate);
}

/** All users (hydrated). */
function listAll() {
  return db.prepare('SELECT * FROM users').all().map(hydrate);
}

/** Only fully-onboarded users (used by proactive schedulers). */
function listOnboarded() {
  return db.prepare('SELECT * FROM users WHERE onboarding_complete = 1').all().map(hydrate);
}

/** Merge a patch into the user's preferences JSON and persist. */
function updatePreferences(id, patch = {}) {
  const user = getById(id);
  if (!user) return null;
  const prefs = { ...(user.preferences || {}), ...patch };
  return update(id, { preferences: prefs });
}

/** Mark onboarding as complete. */
function completeOnboarding(id) {
  return update(id, { onboarding_complete: 1 });
}

/**
 * Public-safe projection of a user for API responses (no tokens).
 */
function toPublic(user) {
  if (!user) return null;
  return {
    id: user.id,
    phone: user.phone,
    name: user.name,
    timezone: user.timezone,
    work_hours_start: user.work_hours_start,
    work_hours_end: user.work_hours_end,
    language: user.language,
    onboarding_complete: !!user.onboarding_complete,
    briefing_time: user.briefing_time,
    debrief_time: user.debrief_time,
    proactiveness_level: user.proactiveness_level,
    enabled_skills: user.enabled_skills,
    tone: user.tone,
    communication_style: user.communication_style,
    gmail_connected: !!user.gmail_token,
    calendar_connected: !!user.calendar_token,
    health_connected: !!user.health_connected,
    // Never expose the Shopify token — only whether it's linked, and the store.
    shopify_connected: !!(user.shopify_domain && user.shopify_token),
    shopify_domain: user.shopify_domain || null,
    news_topics: user.news_topics || null,
    news_city: user.news_city || null,
    news_country: user.news_country || null,
    home_address: user.home_address || null,
    office_address: user.office_address || null,
    // Never expose the stored password — only whether webmail is linked.
    voice_replies: user.voice_replies || 'on_voice',
    voice_name: user.voice_name || 'nova',
    assistant_name: user.assistant_name || 'Wingman',
    webmail_connected: !!(user.webmail_address && user.webmail_password_enc),
    webmail_address: user.webmail_address || null,
  };
}

module.exports = {
  DEFAULT_SKILLS,
  getByPhone, getById, create, update, hydrate, isOnboarded, hasSkill,
  listConnectedEmailUsers, listAll, listOnboarded, updatePreferences,
  completeOnboarding, toPublic,
};
