'use strict';

const { db, uuid } = require('./index');
const secrets = require('../utils/secrets');

/**
 * Stored connections to wearable clouds (Whoop, Oura, …).
 *
 * Tokens are encrypted at rest: unlike a calendar token, a wearable token
 * exposes months of continuous health history, so it is handled like a
 * password rather than an ordinary API credential.
 */

function rowToAccount(row) {
  if (!row) return null;
  let accessToken = null;
  let refreshToken = null;
  try { accessToken = row.access_token_enc ? secrets.decrypt(row.access_token_enc) : null; }
  catch (_) { accessToken = null; }      // key rotated — treat as needing reconnect
  try { refreshToken = row.refresh_token_enc ? secrets.decrypt(row.refresh_token_enc) : null; }
  catch (_) { refreshToken = null; }
  return { ...row, accessToken, refreshToken };
}

function get(userId, provider) {
  const row = db.prepare(
    'SELECT * FROM wearable_accounts WHERE user_id = ? AND provider = ?'
  ).get(userId, provider);
  return rowToAccount(row);
}

function listForUser(userId) {
  return db.prepare(
    'SELECT * FROM wearable_accounts WHERE user_id = ? ORDER BY provider'
  ).all(userId).map(rowToAccount);
}

/** Every connected account across all users — the sync sweep. */
function listAll() {
  return db.prepare('SELECT * FROM wearable_accounts').all().map(rowToAccount);
}

/**
 * Create or update a connection. Refresh tokens are preserved when a provider
 * omits one on refresh — dropping it would silently end the connection.
 */
function save(userId, provider, { accessToken, refreshToken, expiresAt, scopes }) {
  if (!secrets.available()) throw new Error('SECRET_KEY_NOT_SET');

  const existing = db.prepare(
    'SELECT * FROM wearable_accounts WHERE user_id = ? AND provider = ?'
  ).get(userId, provider);

  const accessEnc = secrets.encrypt(String(accessToken || ''));
  const refreshEnc = refreshToken
    ? secrets.encrypt(String(refreshToken))
    : (existing ? existing.refresh_token_enc : null);

  if (existing) {
    db.prepare(`
      UPDATE wearable_accounts
         SET access_token_enc = @access, refresh_token_enc = @refresh,
             expires_at = @expires, scopes = @scopes, last_error = NULL
       WHERE id = @id
    `).run({
      id: existing.id, access: accessEnc, refresh: refreshEnc,
      expires: expiresAt || null, scopes: scopes || existing.scopes || null,
    });
    return get(userId, provider);
  }

  db.prepare(`
    INSERT INTO wearable_accounts
      (id, user_id, provider, access_token_enc, refresh_token_enc, expires_at, scopes)
    VALUES (@id, @user_id, @provider, @access, @refresh, @expires, @scopes)
  `).run({
    id: uuid(), user_id: userId, provider,
    access: accessEnc, refresh: refreshEnc,
    expires: expiresAt || null, scopes: scopes || null,
  });
  return get(userId, provider);
}

function markSynced(userId, provider, { error = null } = {}) {
  db.prepare(
    'UPDATE wearable_accounts SET last_synced_at = ?, last_error = ? WHERE user_id = ? AND provider = ?'
  ).run(new Date().toISOString(), error, userId, provider);
}

function remove(userId, provider) {
  db.prepare('DELETE FROM wearable_accounts WHERE user_id = ? AND provider = ?')
    .run(userId, provider);
}

module.exports = { get, listForUser, listAll, save, markSynced, remove };
