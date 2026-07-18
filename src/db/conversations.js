'use strict';

const { db, uuid } = require('./index');

/**
 * Persist a WhatsApp message into the conversations table.
 * Schema (user-specified): id, user_id, role, content, metadata, created_at
 *
 * @param {Object} opts
 * @param {string|null} opts.userId
 * @param {'user'|'assistant'|'system'} opts.role   'user' = inbound, 'assistant' = Wingman outbound
 * @param {string} opts.content                     message text
 * @param {Object} [opts.metadata={}]               direction, phone, waMessageId, mediaType, etc.
 * @returns {Object} the stored row (metadata parsed)
 */
function logMessage({ userId = null, role, content = '', metadata = {} } = {}) {
  const id = uuid();
  db.prepare(`
    INSERT INTO conversations (id, user_id, role, content, metadata)
    VALUES (@id, @userId, @role, @content, @metadata)
  `).run({
    id,
    userId,
    role,
    content,
    metadata: JSON.stringify(metadata || {}),
  });
  return getById(id);
}

/** Convenience: log an inbound (user) WhatsApp message. */
function logInbound({ userId = null, content = '', phoneNumber, chatId, waMessageId, mediaType = 'text' } = {}) {
  return logMessage({
    userId,
    role: 'user',
    content,
    metadata: { direction: 'inbound', phoneNumber, chatId, waMessageId, mediaType },
  });
}

/** Convenience: log an outbound (Wingman) WhatsApp message. */
function logOutbound({ userId = null, content = '', phoneNumber, chatId, waMessageId, mediaType = 'text' } = {}) {
  return logMessage({
    userId,
    role: 'assistant',
    content,
    metadata: { direction: 'outbound', phoneNumber, chatId, waMessageId, mediaType },
  });
}

function getById(id) {
  const row = db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
  if (row && row.metadata) {
    try { row.metadata = JSON.parse(row.metadata); } catch (_) {}
  }
  return row;
}

function recent(limit = 50) {
  const rows = db
    .prepare('SELECT * FROM conversations ORDER BY created_at DESC, rowid DESC LIMIT ?')
    .all(limit);
  return rows.map((r) => {
    try { r.metadata = JSON.parse(r.metadata); } catch (_) {}
    return r;
  });
}

function countAll() {
  return db.prepare('SELECT COUNT(*) AS n FROM conversations').get().n;
}

/**
 * Last N messages for a user, returned in chronological (oldest-first) order.
 * Only 'user' and 'assistant' rows are included (system rows excluded).
 */
/** How many messages this user has exchanged (used to throttle learning). */
function countForUser(userId) {
  const r = db.prepare('SELECT COUNT(*) AS n FROM conversations WHERE user_id = ?').get(userId);
  return (r && r.n) || 0;
}

function historyForUser(userId, limit = 20) {
  const rows = db.prepare(`
    SELECT id, user_id, role, content, metadata, created_at FROM (
      SELECT rowid AS rid, id, user_id, role, content, metadata, created_at
      FROM conversations
      WHERE user_id = ? AND role IN ('user','assistant')
      ORDER BY created_at DESC, rid DESC
      LIMIT ?
    ) ORDER BY created_at ASC, rid ASC
  `).all(userId, limit);
  return rows;
}

module.exports = { logMessage, logInbound, logOutbound, getById, recent, countAll, historyForUser, countForUser };
