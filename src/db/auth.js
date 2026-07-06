'use strict';

const crypto = require('crypto');
const { db, uuid } = require('./index');

// ── OTP codes ─────────────────────────────────────────────────────────

/** Create a new OTP for a phone; invalidates prior unconsumed codes. */
function createOtp(phone, { purpose = 'login', ttlSeconds = 300 } = {}) {
  // Invalidate previous unconsumed codes for this phone.
  db.prepare('UPDATE otp_codes SET consumed = 1 WHERE phone = ? AND consumed = 0').run(phone);
  const id = uuid();
  const code = String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString();
  db.prepare(`
    INSERT INTO otp_codes (id, phone, code, purpose, expires_at)
    VALUES (@id, @phone, @code, @purpose, @expiresAt)
  `).run({ id, phone, code, purpose, expiresAt });
  return { id, phone, code, purpose, expiresAt };
}

/**
 * Verify an OTP for a phone. Returns { ok, reason }.
 * Consumes the code on success.
 */
function verifyOtp(phone, code) {
  const row = db.prepare(`
    SELECT * FROM otp_codes
    WHERE phone = ? AND consumed = 0
    ORDER BY created_at DESC LIMIT 1
  `).get(phone);
  if (!row) return { ok: false, reason: 'no_code' };
  if (new Date(row.expires_at).getTime() < Date.now()) return { ok: false, reason: 'expired' };
  if (row.attempts >= 5) {
    db.prepare('UPDATE otp_codes SET consumed = 1 WHERE id = ?').run(row.id);
    return { ok: false, reason: 'too_many_attempts' };
  }
  if (String(row.code) !== String(code).trim()) {
    db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id);
    return { ok: false, reason: 'mismatch' };
  }
  db.prepare('UPDATE otp_codes SET consumed = 1 WHERE id = ?').run(row.id);
  return { ok: true, purpose: row.purpose };
}

// ── Sessions ──────────────────────────────────────────────────────────

/** Create a session token for a user. */
function createSession(userId, { ttlDays = 30 } = {}) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + ttlDays * 86400 * 1000).toISOString();
  db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at)
    VALUES (@token, @userId, @expiresAt)
  `).run({ token, userId, expiresAt });
  return { token, expiresAt };
}

/** Resolve a session token to a user id (or null). Touches last_seen. */
function resolveSession(token) {
  if (!token) return null;
  const row = db.prepare('SELECT * FROM sessions WHERE token = ?').get(token);
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  db.prepare("UPDATE sessions SET last_seen_at = datetime('now') WHERE token = ?").run(token);
  return row.user_id;
}

/** Destroy a session (logout). */
function destroySession(token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}

module.exports = {
  createOtp, verifyOtp,
  createSession, resolveSession, destroySession,
};
