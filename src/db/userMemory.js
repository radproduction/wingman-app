'use strict';

const { db, uuid } = require('./index');

const MAX_FACTS = 60;

/** Normalize a fact for duplicate detection (case/punctuation insensitive). */
function normalize(fact) {
  return String(fact || '').toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

/** Everything Wingman knows about a user, explicit facts first. */
function listForUser(userId, limit = MAX_FACTS) {
  return db.prepare(`
    SELECT * FROM user_memory
    WHERE user_id = ?
    ORDER BY (source = 'explicit') DESC, updated_at DESC
    LIMIT ?
  `).all(userId, limit);
}

function countForUser(userId) {
  const r = db.prepare('SELECT COUNT(*) AS n FROM user_memory WHERE user_id = ?').get(userId);
  return (r && r.n) || 0;
}

/**
 * Store a fact, skipping near-duplicates. A fact the user stated explicitly
 * upgrades an existing inferred one rather than creating a second copy.
 * @returns {{added:boolean, id?:string, reason?:string}}
 */
function add(userId, { fact, category = 'context', source = 'learned' } = {}) {
  const text = String(fact || '').trim();
  if (!text || text.length < 4) return { added: false, reason: 'empty' };

  const norm = normalize(text);
  const existing = db.prepare('SELECT * FROM user_memory WHERE user_id = ?').all(userId);
  const dupe = existing.find((r) => normalize(r.fact) === norm);
  if (dupe) {
    // Refresh recency, and promote 'learned' → 'explicit' when confirmed.
    const promote = source === 'explicit' && dupe.source !== 'explicit';
    db.prepare(`UPDATE user_memory SET updated_at = datetime('now')${promote ? ", source = 'explicit'" : ''} WHERE id = ?`)
      .run(dupe.id);
    return { added: false, id: dupe.id, reason: 'duplicate' };
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO user_memory (id, user_id, category, fact, source)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, userId, category, text, source);

  // Keep memory bounded — drop the oldest inferred facts first, never explicit ones.
  const total = countForUser(userId);
  if (total > MAX_FACTS) {
    db.prepare(`
      DELETE FROM user_memory WHERE id IN (
        SELECT id FROM user_memory
        WHERE user_id = ? AND source != 'explicit'
        ORDER BY updated_at ASC
        LIMIT ?
      )
    `).run(userId, total - MAX_FACTS);
  }
  return { added: true, id };
}

/** Remove a single fact (used by "forget that…"). */
function remove(userId, id) {
  const r = db.prepare('DELETE FROM user_memory WHERE id = ? AND user_id = ?').run(id, userId);
  return { removed: r.changes > 0 };
}

/** Delete facts whose text matches a search term — for "forget about X". */
function removeMatching(userId, term) {
  const like = `%${String(term || '').toLowerCase()}%`;
  const r = db.prepare('DELETE FROM user_memory WHERE user_id = ? AND LOWER(fact) LIKE ?').run(userId, like);
  return { removed: r.changes };
}

function clearForUser(userId) {
  db.prepare('DELETE FROM user_memory WHERE user_id = ?').run(userId);
}

module.exports = { listForUser, countForUser, add, remove, removeMatching, clearForUser, normalize, MAX_FACTS };
