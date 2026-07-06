'use strict';

const { db, uuid } = require('./index');

/**
 * Store a briefing/wrap record.
 * @param {string} userId
 * @param {Object} b
 * @param {'morning'|'evening'} b.type
 * @param {string} b.content   the formatted WhatsApp text
 * @param {Object} [b.payload] structured aggregate used to build it
 */
function create(userId, b) {
  const id = uuid();
  db.prepare(`
    INSERT INTO briefings (id, user_id, type, content, payload, sent_at)
    VALUES (@id, @user_id, @type, @content, @payload, @sent_at)
  `).run({
    id,
    user_id: userId,
    type: b.type,
    content: b.content || '',
    payload: JSON.stringify(b.payload || {}),
    sent_at: b.sentAt || new Date().toISOString(),
  });
  return id;
}

function listForUser(userId, limit = 20) {
  return db.prepare('SELECT * FROM briefings WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit);
}

module.exports = { create, listForUser };
