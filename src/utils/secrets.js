'use strict';

const crypto = require('crypto');

/**
 * Encrypt secrets we must store in a reusable form — currently webmail
 * passwords, which (unlike OAuth tokens) cannot be scoped or revoked and would
 * expose a whole mailbox if the database were ever read.
 *
 * AES-256-GCM, so tampering is detected on decrypt rather than silently
 * producing garbage. The key comes from SECRET_KEY (or falls back to the
 * session secret) and is hashed to a stable 32 bytes.
 */

function keyBytes() {
  const raw = process.env.SECRET_KEY || process.env.SESSION_SECRET || '';
  if (!raw) throw new Error('SECRET_KEY_NOT_SET');
  return crypto.createHash('sha256').update(String(raw)).digest();
}

/** Is encryption available? (No key ⇒ we refuse to store secrets at all.) */
function available() {
  return !!(process.env.SECRET_KEY || process.env.SESSION_SECRET);
}

/** → "v1:<iv>:<authTag>:<ciphertext>", all base64. */
function encrypt(plain) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyBytes(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1:${iv.toString('base64')}:${tag.toString('base64')}:${enc.toString('base64')}`;
}

/** Reverse of encrypt(). Throws if the key is wrong or the value was tampered with. */
function decrypt(payload) {
  const parts = String(payload || '').split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') throw new Error('BAD_CIPHERTEXT');
  const [, ivB64, tagB64, dataB64] = parts;
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyBytes(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  const dec = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return dec.toString('utf8');
}

module.exports = { encrypt, decrypt, available };
