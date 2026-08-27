'use strict';

const { db, uuid } = require('./index');

const DEFAULT_SKILLS = [
  'travel_assistant', 'bill_tracker', 'delivery_tracker', 'people_crm', 'followup_tracker',
];

/**
 * Canonical phone key for MATCHING (not for sending). Matches on the last 10
 * digits so the SAME person's number unifies across every format seen in the
 * wild: 03007070177, 3007070177, 923007070177, +923007070177 → all "3007070177".
 * (Earlier we only stripped '+'/leading-zeros, which missed the country-code
 * form — that's how 0300… and 92300… ended up as two accounts.)
 */
function normPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (!d) return '';
  return d.length > 10 ? d.slice(-10) : d.replace(/^0+/, '');
}

/** Prefer a full, dialable international number when choosing which row to keep. */
function phoneQuality(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length >= 11 && d.length <= 13 && !d.startsWith('0')) return 2; // e.g. 923001234567
  if (d.length === 10) return 1;                                        // bare 10-digit
  return 0;                                                             // 0300…, "92", junk
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
    if (n) {
      // Match on the normalized (last-10) key across all stored formats. The user
      // base is small, so a scan is fine; prefer the most dialable row on ties.
      const matches = db.prepare('SELECT * FROM users').all().filter((r) => normPhone(r.phone) === n);
      matches.sort((a, b) => phoneQuality(b.phone) - phoneQuality(a.phone));
      row = matches[0] || null;
    }
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

/** Comparator, best row FIRST: completeness, then dialable phone, then recency. */
function accountCmp(a, b) {
  return (accountScore(b) - accountScore(a))
    || (phoneQuality(b.phone) - phoneQuality(a.phone))
    || String(b.created_at || '').localeCompare(String(a.created_at || ''));
}

/**
 * Collapse rows to ONE per normalized phone, so proactive jobs (briefings,
 * alerts, mail scans) send exactly one message per person even if duplicate
 * accounts exist. Keeps the most complete / most dialable / most recent row.
 */
function dedupeByPhone(rows) {
  const best = new Map();
  for (const r of rows) {
    const k = normPhone(r.phone);
    if (!k) { best.set(`__${r.id}`, r); continue; } // no phone → never merge
    const cur = best.get(k);
    if (!cur || accountCmp(r, cur) < 0) best.set(k, r);
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

// Every table that hangs off a user, so a duplicate can be fully removed without
// leaving orphans or tripping a foreign-key constraint. `sessions` is handled
// separately (repointed to the primary, not deleted) so the app login survives.
const USER_CHILD_TABLES = [
  'conversations', 'tasks', 'email_items', 'bills', 'deliveries', 'calendar_events',
  'travel', 'health_data', 'contacts', 'briefings', 'reminders', 'followups',
  'work_sessions', 'wearable_accounts', 'automations', 'meetings', 'user_memory',
  'google_accounts',
];

/** Hard-delete a user and everything referencing them (children first). */
function deleteUserCascade(id) {
  for (const tbl of USER_CHILD_TABLES) {
    try { db.prepare(`DELETE FROM ${tbl} WHERE user_id = ?`).run(id); } catch (_) { /* table may not exist */ }
  }
  db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

/**
 * One-time cleanup of the duplicate accounts that already exist: for each set of
 * rows that share a normalized phone, keep the best one (giving it the clean
 * canonical phone) and DELETE the extras — but first repoint their app sessions
 * to the primary so the user stays logged in to the right account. Safe to run on
 * every boot (a no-op once there's only one row per phone).
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

  let removed = 0;
  const tx = db.transaction(() => {
    for (const [k, list] of groups) {
      if (list.length < 2) continue;
      list.sort(accountCmp); // best (most complete / most dialable / recent) first
      const primary = list[0];
      // Keep the primary's OWN phone as-is (it's the most dialable of the group);
      // never overwrite it with the normalized key, which is only a match code.
      for (const d of list.slice(1)) {
        try { db.prepare('UPDATE sessions SET user_id = ? WHERE user_id = ?').run(primary.id, d.id); } catch (_) { /* no sessions */ }
        deleteUserCascade(d.id);
        removed++;
      }
    }
  });
  tx();
  if (removed) console.log(`[users] removed ${removed} duplicate account(s) by phone`);
  return removed;
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
  completeOnboarding, toPublic, normPhone, mergeDuplicatePhones, deleteUserCascade,
};
