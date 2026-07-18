'use strict';

const { db, uuid } = require('./index');

/** All Google accounts linked to a user, primary first. */
function listForUser(userId) {
  return db.prepare(`
    SELECT * FROM google_accounts
    WHERE user_id = ?
    ORDER BY is_primary DESC, created_at ASC
  `).all(userId);
}

function getById(id) {
  return db.prepare('SELECT * FROM google_accounts WHERE id = ?').get(id);
}

/** The account used for sends/creates (falls back to the oldest linked one). */
function getPrimary(userId) {
  return db.prepare(`
    SELECT * FROM google_accounts
    WHERE user_id = ?
    ORDER BY is_primary DESC, created_at ASC
    LIMIT 1
  `).get(userId);
}

function countForUser(userId) {
  const r = db.prepare('SELECT COUNT(*) AS n FROM google_accounts WHERE user_id = ?').get(userId);
  return (r && r.n) || 0;
}

function findByEmail(userId, email) {
  if (!email) return null;
  return db.prepare('SELECT * FROM google_accounts WHERE user_id = ? AND email = ?')
    .get(userId, String(email).toLowerCase());
}

/**
 * Link (or refresh) a Google account. Keyed by email, so re-consenting with the
 * same account updates it in place while a different account adds a new row.
 * The first account a user links automatically becomes primary.
 */
function upsertByEmail(userId, { email, token, scopes } = {}) {
  const mail = email ? String(email).toLowerCase() : null;
  const existing = mail ? findByEmail(userId, mail) : null;

  if (existing) {
    db.prepare('UPDATE google_accounts SET token = ?, scopes = ? WHERE id = ?')
      .run(JSON.stringify(token), scopes || existing.scopes || null, existing.id);
    return getById(existing.id);
  }

  const id = uuid();
  const isPrimary = countForUser(userId) === 0 ? 1 : 0;
  db.prepare(`
    INSERT INTO google_accounts (id, user_id, email, token, scopes, is_primary)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, mail, JSON.stringify(token), scopes || null, isPrimary);
  return getById(id);
}

/** Backfill the email on a legacy row once we can resolve it. */
function setEmail(id, email) {
  if (!email) return getById(id);
  db.prepare('UPDATE google_accounts SET email = ? WHERE id = ?').run(String(email).toLowerCase(), id);
  return getById(id);
}

/** Persist refreshed OAuth tokens for one account. */
function updateToken(id, token) {
  db.prepare('UPDATE google_accounts SET token = ? WHERE id = ?').run(JSON.stringify(token), id);
  return getById(id);
}

function setPrimary(userId, id) {
  const tx = db.transaction(() => {
    db.prepare('UPDATE google_accounts SET is_primary = 0 WHERE user_id = ?').run(userId);
    db.prepare('UPDATE google_accounts SET is_primary = 1 WHERE id = ? AND user_id = ?').run(id, userId);
  });
  tx();
  return listForUser(userId);
}

/**
 * Unlink one account. If it was the primary, the next remaining account is
 * promoted so the user is never left with accounts but no primary.
 */
function remove(userId, id) {
  const row = db.prepare('SELECT * FROM google_accounts WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) return { removed: false };
  db.prepare('DELETE FROM google_accounts WHERE id = ?').run(id);
  if (row.is_primary) {
    const next = getPrimary(userId);
    if (next) db.prepare('UPDATE google_accounts SET is_primary = 1 WHERE id = ?').run(next.id);
  }
  return { removed: true, wasPrimary: !!row.is_primary };
}

/** Parse the stored token JSON for a row. */
function tokensOf(account) {
  if (!account || !account.token) return null;
  try { return JSON.parse(account.token); } catch (_) { return null; }
}

/**
 * One-time migration: users who connected before multi-account existed have a
 * token only on users.gmail_token / calendar_token. Move it into a primary row
 * so both models describe the same connection.
 */
function migrateLegacyTokens() {
  const rows = db.prepare(`
    SELECT u.id, u.gmail_token, u.calendar_token
    FROM users u
    WHERE (u.gmail_token IS NOT NULL OR u.calendar_token IS NOT NULL)
      AND NOT EXISTS (SELECT 1 FROM google_accounts g WHERE g.user_id = u.id)
  `).all();

  let migrated = 0;
  for (const r of rows) {
    const raw = r.calendar_token || r.gmail_token;
    let tokens;
    try { tokens = JSON.parse(raw); } catch (_) { continue; }
    const id = uuid();
    db.prepare(`
      INSERT INTO google_accounts (id, user_id, email, token, scopes, is_primary)
      VALUES (?, ?, NULL, ?, ?, 1)
    `).run(id, r.id, JSON.stringify(tokens), tokens.scope || null);
    migrated++;
  }
  if (migrated) console.log(`[db] migrated ${migrated} legacy Google connection(s) into google_accounts`);
  return migrated;
}

module.exports = {
  listForUser, getById, getPrimary, countForUser, findByEmail,
  upsertByEmail, setEmail, updateToken, setPrimary, remove,
  tokensOf, migrateLegacyTokens,
};
