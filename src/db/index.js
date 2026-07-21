'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Database = require('better-sqlite3');
const config = require('../config');

// Ensure the ./data directory exists before opening the DB file
const dbDir = path.dirname(config.database.path);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(config.database.path);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Apply the schema (idempotent — uses CREATE TABLE IF NOT EXISTS).
 */
function initSchema() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  try {
    db.exec(schema);
  } catch (e) {
    // Existing databases can be older than the current schema. If the schema
    // file now contains an index over columns that do not exist yet, SQLite
    // aborts here before additive migrations run. Continue and let the
    // migration/index step below bring the DB forward safely.
    if (String(e && e.message || '').includes('no such column:')) {
      console.warn('[db] schema apply deferred to additive migrations:', e.message);
    } else {
      throw e;
    }
  }
  applyMigrations();
  // Move any pre-multi-account Google connection into google_accounts. Required
  // after the tables exist, and safe to run on every boot (it is a no-op once done).
  try { require('./googleAccounts').migrateLegacyTokens(); }
  catch (e) { console.warn('[db] google account migration skipped:', e.message); }
  console.log('[db] Schema initialized at', config.database.path);
}

/**
 * Additive migrations for columns added after a DB was first created.
 * `CREATE TABLE IF NOT EXISTS` never alters existing tables, so we add any
 * missing columns here. Safe to run on every startup.
 */
function applyMigrations() {
  const additions = {
    calendar_events: [
      ['account_id', 'TEXT'],
      ['account_email', 'TEXT'],
    ],
    travel: [
      ['return_time', 'TEXT'],
      ['hotel_name', 'TEXT'],
      ['hotel_checkin', 'TEXT'],
      ['hotel_checkout', 'TEXT'],
      ["metadata", "TEXT DEFAULT '{}'"],
    ],
    contacts: [
      ['interaction_count', 'INTEGER DEFAULT 0'],
      ['strength', 'TEXT'],
    ],
    users: [
      ['onboarding_complete', 'INTEGER DEFAULT 0'],
      ["briefing_time", "TEXT DEFAULT '07:00'"],
      ["debrief_time", "TEXT DEFAULT '20:00'"],
      ["proactiveness_level", "TEXT DEFAULT 'moderate'"],
      ["enabled_skills", "TEXT DEFAULT '[\"travel_assistant\",\"bill_tracker\",\"delivery_tracker\",\"people_crm\",\"followup_tracker\"]'"],
      ["tone", "TEXT DEFAULT 'friendly'"],
      ["communication_style", "TEXT DEFAULT 'concise'"],
      ['shopify_domain', 'TEXT'],
      ['shopify_token', 'TEXT'],
['voice_replies', 'TEXT'],
      ['voice_name', 'TEXT'],
      ['assistant_name', 'TEXT'],
      ['health_token', 'TEXT'],
      ['work_token', 'TEXT'],
      ['google_health_token', 'TEXT'],
      ['google_health_synced_at', 'TEXT'],
      ['work_action_url', 'TEXT'],
      ['work_action_secret_enc', 'TEXT'],
      ['work_employee_ref', 'TEXT'],
      ['webmail_address','TEXT'],
      ['webmail_password_enc','TEXT'],
      ['webmail_imap_host','TEXT'],
      ['webmail_imap_port','INTEGER'],
      ['webmail_smtp_host','TEXT'],
      ['webmail_smtp_port','INTEGER'],
      ['webmail_from_name','TEXT'],
      ['home_address', 'TEXT'],
      ['home_lat', 'REAL'],
      ['home_lng', 'REAL'],
      ['office_address', 'TEXT'],
      ['office_lat', 'REAL'],
      ['office_lng', 'REAL'],
      ['news_topics', 'TEXT'],
      ['news_city', 'TEXT'],
      ['news_country', 'TEXT'],
    ],
    tasks: [
      ['completed_at', 'TEXT'],
      ['google_task_id', 'TEXT'],
      ['google_tasklist_id', 'TEXT'],
      ['google_account_id', 'TEXT'],
      ['google_updated_at', 'TEXT'],
      ["sync_state", "TEXT DEFAULT 'local_only'"],
      // SQLite rejects ADD COLUMN with CURRENT_TIMESTAMP on older existing
      // tables, so we add this one without a default and backfill below.
      ['updated_at', 'TEXT'],
    ],
  };
  for (const [table, cols] of Object.entries(additions)) {
    let existing;
    try {
      existing = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((r) => r.name));
    } catch (_) { continue; }
    for (const [name, def] of cols) {
      if (!existing.has(name)) {
        try { db.exec(`ALTER TABLE ${table} ADD COLUMN ${name} ${def}`); }
        catch (e) { /* ignore if already present */ }
      }
    }
  }

  try {
    const taskCols = new Set(db.prepare('PRAGMA table_info(tasks)').all().map((r) => r.name));
    if (taskCols.has('updated_at')) {
      db.exec("UPDATE tasks SET updated_at = COALESCE(updated_at, created_at, datetime('now'))");
    }
  } catch (_) { /* ignore */ }

  try {
    db.exec('CREATE INDEX IF NOT EXISTS idx_tasks_google_ref ON tasks(user_id, google_account_id, google_tasklist_id, google_task_id)');
  } catch (_) { /* ignore */ }
}

/**
 * Convenience UUID generator.
 */
function uuid() {
  return crypto.randomUUID();
}

module.exports = { db, initSchema, uuid };
