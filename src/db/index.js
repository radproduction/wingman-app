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
  db.exec(schema);
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
}

/**
 * Convenience UUID generator.
 */
function uuid() {
  return crypto.randomUUID();
}

module.exports = { db, initSchema, uuid };
