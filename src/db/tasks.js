'use strict';

const { db, uuid } = require('./index');

/**
 * Create a task.
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.title
 * @param {string} [opts.source='whatsapp']
 * @param {number} [opts.priority=3]
 * @param {string|null} [opts.dueDate]  ISO string
 * @param {string|null} [opts.recurring]
 */
function create({ userId, title, source = 'whatsapp', priority = 3, dueDate = null, recurring = null } = {}) {
  const id = uuid();
  db.prepare(`
    INSERT INTO tasks (id, user_id, title, source, priority, due_date, recurring)
    VALUES (@id, @userId, @title, @source, @priority, @dueDate, @recurring)
  `).run({ id, userId, title, source, priority, dueDate, recurring });
  return getById(id);
}

function getById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

/** List tasks for a user; by default only the incomplete ones. */
function listForUser(userId, { includeCompleted = false, limit = 50 } = {}) {
  const where = includeCompleted ? '' : 'AND completed = 0';
  return db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? ${where}
    ORDER BY completed ASC, COALESCE(due_date, '9999') ASC, priority ASC, created_at DESC
    LIMIT ?
  `).all(userId, limit);
}

/**
 * Incomplete tasks whose due_date falls within [startISO, endISO).
 */
function listDueBetween(userId, startISO, endISO) {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND completed = 0
      AND due_date IS NOT NULL AND due_date >= ? AND due_date < ?
    ORDER BY due_date ASC
  `).all(userId, startISO, endISO);
}

/** Incomplete tasks with a due_date strictly before nowISO. */
function listOverdue(userId, nowISO) {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND completed = 0
      AND due_date IS NOT NULL AND due_date < ?
    ORDER BY due_date ASC
  `).all(userId, nowISO);
}

/**
 * Count completed tasks. If `sinceISO` is provided, only counts tasks whose
 * created_at is on/after that instant (approximation of "completed today",
 * since the schema has no completed_at column).
 */
function countCompleted(userId, sinceISO) {
  if (sinceISO) {
    return db.prepare(
      "SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND completed = 1 AND created_at >= ?"
    ).get(userId, toSqlite(sinceISO)).c;
  }
  return db.prepare('SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND completed = 1').get(userId).c;
}

/** Convert an ISO string to SQLite's 'YYYY-MM-DD HH:MM:SS' UTC format. */
function toSqlite(iso) {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
}

function countAll(userId) {
  return db.prepare('SELECT COUNT(*) c FROM tasks WHERE user_id = ?').get(userId).c;
}

function complete(id) {
  db.prepare('UPDATE tasks SET completed = 1 WHERE id = ?').run(id);
  return getById(id);
}

/**
 * Find a user's incomplete task by fuzzy title match (case-insensitive
 * substring, either direction). Returns the best (shortest-title) match.
 */
function findByTitle(userId, phrase) {
  const p = (phrase || '').toLowerCase().trim();
  if (!p) return null;
  const rows = db.prepare('SELECT * FROM tasks WHERE user_id = ? AND completed = 0').all(userId);
  const matches = rows.filter((r) => {
    const t = (r.title || '').toLowerCase();
    return t.includes(p) || p.includes(t);
  });
  matches.sort((a, b) => (a.title || '').length - (b.title || '').length);
  return matches[0] || null;
}

function updateDueDate(id, dueDateISO) {
  db.prepare('UPDATE tasks SET due_date = ? WHERE id = ?').run(dueDateISO, id);
  return getById(id);
}

module.exports = {
  create, getById, listForUser, complete,
  listDueBetween, listOverdue, countCompleted, countAll,
  findByTitle, updateDueDate,
};
