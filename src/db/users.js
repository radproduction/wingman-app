'use strict';

const { db, uuid } = require('./index');

const DEFAULT_SKILLS = [
  'travel_assistant', 'bill_tracker', 'delivery_tracker', 'people_crm', 'followup_tracker',
];

/** Canonical phone form: digits only, no leading zeros, no '+'. */
function normPhone(p) {
  return String(p || '').replace(/\D/g, '').replace(/^0+/, '');
}

/**
 * Find a user by their WhatsApp phone number. Historically phones were stored
 * inconsistently (some with a leading '+', some without), which let the same
 * person end up with two rows — and two of every proactive message. We now match
 * on the normalized form so a lookup always finds the one real account.
 */
function getByPhone(phone) {
  let row = db.prepare('SELECT * FROM users WHERE phone = ?').get(phone);
  if (!row) {
    const n = normPhone(phone);
    if (n) row = db.prepare('SELECT * FROM users WHERE phone = ? OR phone = ?').get(n, `+${n}`);
  }
  return hydrate(row);
}

function getById(id) {
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return hydrate(row);
}

/**
 * Create a new user with just a phone number — stored in the canonical form.
 * If a row already exists under ANY format, reuse it instead of making a
 * duplicate (the root cause of the double accounts).
 */
function create({ phone, name = null } = {}) {
  const norm = normPhone(phone) || String(phone || '');
  const existing = getByPhone(norm);
  if (existing) return existing;
  const id = uuid();
  db.prepare(`
    INSERT INTO users (id, phone, name, preferences)
    VALUES (@id, @phone, @name, @preferences)
  `).run({
    id,
    phone: norm,
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
    'autonomy_level', 'quiet_hours_start', 'quiet_hours_end', 'runs_business',
    'enabled_skills', 'tone', 'communication_style',
    'shopify_domain', 'shopify_token',
    'news_topics', 'news_city', 'news_country',
    'home_address', 'home_lat', 'home_lng', 'office_address', 'office_lat', 'office_lng',
    'current_lat', 'current_lng', 'current_location_at', 'current_location_label',
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
    else if (k === 'news_city' && Array.isArray(v)) params[k] = JSON.stringify(v);
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
  // news_city holds a LIST of cities. Users who set a single city before this
  // was a list still have a bare string stored, so read that as a one-city list
  // rather than losing what they picked.
  try {
    const raw = row.news_city;
    if (!raw) row.news_city = null;
    else if (String(raw).trim().startsWith('[')) {
      const parsed = JSON.parse(raw);
      row.news_city = Array.isArray(parsed) && parsed.length ? parsed : null;
    } else {
      row.news_city = [String(raw)];
    }
  } catch (_) { row.news_city = row.news_city ? [String(row.news_city)] : null; }
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

/** Rank a row for "which duplicate to keep": onboarded > has-Gmail > has-webmail. */
function accountScore(x) {
  return (x.onboarding_complete ? 4 : 0) + (x.gmail_token ? 2 : 0) + (x.webmail_address ? 1 : 0);
}

/**
 * Collapse rows to ONE per normalized phone, so proactive jobs (briefings,
 * alerts, mail scans) send exactly one message per person even if duplicate
 * accounts exist. Keeps the most complete / most recent row.
 */
function dedupeByPhone(rows) {
  const best = new Map();
  for (const r of rows) {
    const k = normPhone(r.phone);
    if (!k) { best.set(`__${r.id}`, r); continue; } // no phone → never merge
    const cur = best.get(k);
    if (
      !cur ||
      accountScore(r) > accountScore(cur) ||
      (accountScore(r) === accountScore(cur) && String(r.created_at || '') > String(cur.created_at || ''))
    ) {
      best.set(k, r);
    }
  }
  return [...best.values()];
}

/** All users that have connected Gmail (have a gmail_token). */
function listConnectedEmailUsers() {
  const rows = db.prepare('SELECT * FROM users WHERE gmail_token IS NOT NULL').all();
  return dedupeByPhone(rows).map(hydrate);
}

/** All users (hydrated). */
function listAll() {
  return dedupeByPhone(db.prepare('SELECT * FROM users').all()).map(hydrate);
}

/** Only fully-onboarded users (used by proactive schedulers). */
function listOnboarded() {
  return dedupeByPhone(db.prepare('SELECT * FROM users WHERE onboarding_complete = 1').all()).map(hydrate);
}

/**
 * One-time cleanup of the duplicate accounts that already exist: for each set of
 * rows that share a normalized phone, keep the best one (and give it the clean
 * canonical phone), and neuter the rest — no deletes (so nothing referencing them
 * breaks), just marked not-onboarded with a parked phone so they never send
 * anything or get matched again. Safe to run on every boot.
 */
function mergeDuplicatePhones() {
  const rows = db.prepare('SELECT * FROM users').all();
  const groups = new Map();
  for (const r of rows) {
    const k = normPhone(r.phone);
    if (!k) continue;
    if (!groups.has(k)) groups.set(k, []);
    groups.get(k).push(r);
  }

  let neutered = 0;
  const tx = db.transaction(() => {
    for (const [k, list] of groups) {
      if (list.length < 2) continue;
      list.sort((a, b) =>
        accountScore(b) - accountScore(a) ||
        String(b.created_at || '').localeCompare(String(a.created_at || '')),
      );
      const primary = list[0];
      // Neuter the extras FIRST so the canonical phone is free for the primary.
      for (const d of list.slice(1)) {
        // Keep the app working: point any of the duplicate's sessions at the primary.
        try { db.prepare('UPDATE sessions SET user_id = ? WHERE user_id = ?').run(primary.id, d.id); } catch (_) { /* no sessions */ }
        db.prepare("UPDATE users SET onboarding_complete = 0, phone = ? WHERE id = ?").run(`merged:${d.id}`, d.id);
        neutered++;
      }
      if (primary.phone !== k) {
        db.prepare('UPDATE users SET phone = ? WHERE id = ?').run(k, primary.id);
      }
    }
  });
  tx();
  if (neutered) console.log(`[users] merged ${neutered} duplicate account(s) by phone`);
  return neutered;
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
    autonomy_level: user.autonomy_level || null,
    quiet_hours_start: user.quiet_hours_start || null,
    quiet_hours_end: user.quiet_hours_end || null,
    runs_business: user.runs_business == null ? null : !!user.runs_business,
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
  completeOnboarding, toPublic, normPhone, mergeDuplicatePhones,
};
