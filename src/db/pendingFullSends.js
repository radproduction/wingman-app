'use strict';

const { db } = require('./index');

/**
 * Tracks briefings/wraps that went out as a short template (user outside the
 * 24h window). The next inbound WhatsApp message delivers the full version once.
 * Synchronous (better-sqlite3) — never await these.
 */

function mark(userId, kind, hours = 18) {
  db.prepare(`
    INSERT INTO pending_full_sends (user_id, kind, expires_at)
    VALUES (?, ?, datetime('now', ?))
    ON CONFLICT(user_id, kind) DO UPDATE SET expires_at = excluded.expires_at
  `).run(userId, kind, `+${hours} hours`);
}

/** Atomically take (and clear) every unexpired pending send for this user. */
function takeAll(userId) {
  const rows = db.prepare(
    "SELECT kind FROM pending_full_sends WHERE user_id = ? AND expires_at > datetime('now')",
  ).all(userId);
  db.prepare('DELETE FROM pending_full_sends WHERE user_id = ?').run(userId);
  return rows.map((r) => r.kind);
}

function clear(userId, kind) {
  db.prepare('DELETE FROM pending_full_sends WHERE user_id = ? AND kind = ?').run(userId, kind);
}

module.exports = { mark, takeAll, clear };
