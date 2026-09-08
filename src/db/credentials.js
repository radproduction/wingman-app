'use strict';

const { db, uuid } = require('./index');
const secrets = require('../utils/secrets');

/**
 * Credential vault — third-party logins Wingman can USE (e.g. to log into a site
 * during browser automation) but must NEVER read back into a reply. The password
 * is AES-256-GCM encrypted (utils/secrets); only getDecrypted() — for server-side
 * automation, never reachable from an LLM tool — ever returns the plaintext.
 */

function save(userId, { label, username = null, secret, url = null } = {}) {
  if (!label) throw new Error('label required');
  if (!secret) throw new Error('secret required');
  if (!secrets.available()) throw new Error('SECRET_KEY_NOT_SET');
  const secretEnc = secrets.encrypt(secret);
  const existing = db.prepare('SELECT id FROM credentials WHERE user_id = ? AND lower(label) = lower(?)').get(userId, label);
  if (existing) {
    db.prepare("UPDATE credentials SET username = @username, secret_enc = @secretEnc, url = COALESCE(@url, url), updated_at = datetime('now') WHERE id = @id")
      .run({ id: existing.id, username, secretEnc, url });
    return { id: existing.id, updated: true };
  }
  const id = uuid();
  db.prepare('INSERT INTO credentials (id, user_id, label, username, secret_enc, url) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, userId, label, username, secretEnc, url);
  return { id, updated: false };
}

/** Safe listing — labels + usernames + urls ONLY. Never the secret. */
function listSafe(userId) {
  return db.prepare('SELECT label, username, url, updated_at FROM credentials WHERE user_id = ? ORDER BY label').all(userId);
}

/**
 * SERVER-SIDE ONLY (e.g. browser automation). Returns the plaintext secret.
 * MUST never be reachable from an LLM tool or an API the model can call.
 */
function getDecrypted(userId, label) {
  const row = db.prepare('SELECT * FROM credentials WHERE user_id = ? AND lower(label) = lower(?)').get(userId, label);
  if (!row) return null;
  let secret = null;
  try { secret = secrets.decrypt(row.secret_enc); } catch (_) { secret = null; }
  return { label: row.label, username: row.username, url: row.url, secret };
}

function remove(userId, label) {
  return db.prepare('DELETE FROM credentials WHERE user_id = ? AND lower(label) = lower(?)').run(userId, label).changes > 0;
}

module.exports = { save, listSafe, getDecrypted, remove };
