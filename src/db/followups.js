'use strict';

const { db, uuid } = require('./index');

/**
 * Create a follow-up. De-dupes on (user_id, type, description).
 */
function create(userId, f) {
  const existing = db.prepare(
    'SELECT id FROM followups WHERE user_id = ? AND type = ? AND description = ?'
  ).get(userId, f.type, f.description || '');
  if (existing) return existing.id;

  const id = uuid();
  db.prepare(`
    INSERT INTO followups (id, user_id, type, description, counterparty, due_date, status, source_email_id)
    VALUES (@id, @user_id, @type, @description, @counterparty, @due_date, @status, @source_email_id)
  `).run({
    id,
    user_id: userId,
    type: f.type,
    description: f.description || null,
    counterparty: f.counterparty || null,
    due_date: f.dueDate || null,
    status: f.status || 'open',
    source_email_id: f.sourceEmailId || null,
  });
  return id;
}

function listOpen(userId) {
  return db.prepare(
    "SELECT * FROM followups WHERE user_id = ? AND status = 'open' ORDER BY COALESCE(due_date,'9999') ASC"
  ).all(userId);
}

/**
 * All follow-ups for a user (open first, then by due date). The /api/followups
 * endpoint expects this; without it, authenticated users always got an empty
 * list and "People waiting on you" / Business follow-up counts read zero.
 */
function listForUser(userId) {
  return db.prepare(
    "SELECT * FROM followups WHERE user_id = ? ORDER BY (status = 'open') DESC, COALESCE(due_date,'9999') ASC"
  ).all(userId);
}

/** Open follow-ups whose due_date is before nowISO. */
function listOverdue(userId, nowISO) {
  return db.prepare(`
    SELECT * FROM followups
    WHERE user_id = ? AND status = 'open'
      AND due_date IS NOT NULL AND due_date < ?
    ORDER BY due_date ASC
  `).all(userId, nowISO);
}

function markStatus(id, status) {
  db.prepare('UPDATE followups SET status = ? WHERE id = ?').run(status, id);
}

module.exports = { create, listOpen, listForUser, listOverdue, markStatus };
