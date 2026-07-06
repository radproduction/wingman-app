'use strict';

const { db, uuid } = require('./index');

/** Relationship strength bucket from interaction count. */
function strengthFor(count) {
  if (count >= 15) return 'close';
  if (count >= 5) return 'regular';
  return 'occasional';
}

/**
 * Record an interaction with a contact (by email). Creates the contact if new,
 * increments interaction_count, and updates last_contacted_at + name if better.
 * @returns {Object} the contact row
 */
function recordInteraction(userId, { email, name, at }) {
  if (!email) return null;
  const normEmail = email.toLowerCase().trim();
  const existing = db.prepare('SELECT * FROM contacts WHERE user_id = ? AND LOWER(email) = ?')
    .get(userId, normEmail);

  const when = at || new Date().toISOString();

  if (existing) {
    const count = (existing.interaction_count || 0) + 1;
    const betterName = (!existing.name || existing.name === existing.email) && name ? name : existing.name;
    const lastAt = !existing.last_contacted_at || when > existing.last_contacted_at ? when : existing.last_contacted_at;
    db.prepare(
      'UPDATE contacts SET interaction_count = ?, name = ?, last_contacted_at = ?, strength = ? WHERE id = ?'
    ).run(count, betterName || normEmail, lastAt, strengthFor(count), existing.id);
    return getById(existing.id);
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO contacts (id, user_id, name, email, last_contacted_at, interaction_count, strength)
    VALUES (@id, @user_id, @name, @email, @last, 1, @strength)
  `).run({ id, user_id: userId, name: name || normEmail, email: normEmail, last: when, strength: strengthFor(1) });
  return getById(id);
}

function getById(id) {
  return db.prepare('SELECT * FROM contacts WHERE id = ?').get(id);
}

/** Fuzzy find a contact by name or email. */
function find(userId, query) {
  const like = `%${(query || '').toLowerCase()}%`;
  return db.prepare(
    `SELECT * FROM contacts WHERE user_id = ?
       AND (LOWER(IFNULL(name,'')) LIKE ? OR LOWER(IFNULL(email,'')) LIKE ?)
     ORDER BY interaction_count DESC LIMIT 1`
  ).get(userId, like, like);
}

function listForUser(userId) {
  return db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY interaction_count DESC').all(userId);
}

/** Top contacts by interaction count, optionally since a date. */
function topContacts(userId, { limit = 5, sinceISO } = {}) {
  if (sinceISO) {
    return db.prepare(
      `SELECT * FROM contacts WHERE user_id = ? AND last_contacted_at >= ?
       ORDER BY interaction_count DESC LIMIT ?`
    ).all(userId, sinceISO, limit);
  }
  return db.prepare('SELECT * FROM contacts WHERE user_id = ? ORDER BY interaction_count DESC LIMIT ?')
    .all(userId, limit);
}

/** Contacts with enough interactions to warrant Claude enrichment, not yet enriched. */
function listForEnrichment(userId, minInteractions = 5) {
  return db.prepare(
    `SELECT * FROM contacts WHERE user_id = ? AND interaction_count >= ?
       AND (notes IS NULL OR notes = '')`
  ).all(userId, minInteractions);
}

function setNotes(id, notes) {
  db.prepare('UPDATE contacts SET notes = ? WHERE id = ?').run(notes, id);
  return getById(id);
}

module.exports = {
  recordInteraction, getById, find, listForUser, topContacts,
  listForEnrichment, setNotes, strengthFor,
};
