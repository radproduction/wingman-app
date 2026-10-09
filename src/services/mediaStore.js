'use strict';

/**
 * Where images live: on the data volume, one file per image, served publicly at
 * /media/<id>.<ext>. Facebook/Instagram fetch a photo by URL, so the URL has to
 * be reachable without a login — the random UUID is what keeps it private.
 */

const fs = require('fs');
const path = require('path');
const config = require('../config');
const userMedia = require('../db/userMedia');

const EXT = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
const MAX_BYTES = 12 * 1024 * 1024;

function dir() {
  const d = config.media.dir;
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  return d;
}

/** Best-effort sniff so a wrong Content-Type can't mislabel the file. */
function sniffMime(buffer, fallback) {
  if (!buffer || buffer.length < 12) return fallback;
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return 'image/jpeg';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  if (buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (buffer.slice(0, 3).toString('ascii') === 'GIF') return 'image/gif';
  return fallback;
}

/**
 * Instagram only accepts JPEG, and JPEG is the safe choice everywhere else too.
 * Convert when `sharp` is installed; otherwise keep the original (still fine
 * for WhatsApp and Facebook).
 */
async function toJpeg(buffer, mime) {
  if (mime === 'image/jpeg') return { buffer, mime };
  try {
    // eslint-disable-next-line global-require
    const sharp = require('sharp');
    const out = await sharp(buffer).flatten({ background: '#ffffff' }).jpeg({ quality: 90 }).toBuffer();
    return { buffer: out, mime: 'image/jpeg' };
  } catch (e) {
    console.warn('[media] JPEG conversion skipped:', e.message);
    return { buffer, mime };
  }
}

function publicUrl(row) {
  return `${String(config.publicBaseUrl).replace(/\/+$/, '')}/media/${row.id}.${row.ext}`;
}

function filePath(row) {
  return path.join(dir(), `${row.id}.${row.ext}`);
}

/** Save image bytes for a user. Returns the row plus its public url. */
async function save(userId, buffer, { kind, mimeType = 'image/jpeg', note = '' }) {
  if (!buffer || !buffer.length) throw new Error('EMPTY_IMAGE');
  if (buffer.length > MAX_BYTES) throw new Error('IMAGE_TOO_LARGE');
  const sniffed = sniffMime(buffer, String(mimeType || '').split(';')[0].trim().toLowerCase());
  if (!EXT[sniffed]) throw new Error('NOT_AN_IMAGE');
  const conv = await toJpeg(buffer, sniffed);
  const row = userMedia.create({
    userId, kind, ext: EXT[conv.mime], mime: conv.mime, bytes: conv.buffer.length, note,
  });
  fs.writeFileSync(filePath(row), conv.buffer);
  return { ...row, url: publicUrl(row) };
}

function read(row) {
  return fs.readFileSync(filePath(row));
}

function recent(userId, limit = 5) {
  return userMedia.recentForUser(userId, limit)
    .filter((r) => fs.existsSync(filePath(r)))
    .map((r) => ({ ...r, url: publicUrl(r) }));
}

/** Delete images past the retention window (called on boot and daily). */
function cleanup() {
  let n = 0;
  try {
    for (const r of userMedia.olderThan(config.media.keepDays)) {
      try { fs.unlinkSync(path.join(dir(), `${r.id}.${r.ext}`)); } catch (_) { /* already gone */ }
      userMedia.remove(r.id);
      n++;
    }
  } catch (e) {
    console.warn('[media] cleanup failed:', e.message);
  }
  if (n) console.log(`[media] removed ${n} old image(s)`);
  return n;
}

/** Delete every stored image of one user (account deletion). */
function removeAllFor(userId) {
  const { db } = require('../db');
  let rows = [];
  try { rows = db.prepare('SELECT * FROM user_media WHERE user_id = ?').all(userId); } catch (_) { return 0; }
  let n = 0;
  for (const row of rows) {
    try { require('fs').unlinkSync(filePath(row)); n += 1; } catch (_) { /* already gone */ }
  }
  return n;
}

module.exports = { dir, save, read, recent, publicUrl, cleanup, removeAllFor };
