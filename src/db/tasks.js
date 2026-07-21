'use strict';

const { db, uuid } = require('./index');

function nowSqlite() {
  return "datetime('now')";
}

/**
 * Create a task.
 * @param {Object} opts
 * @param {string} opts.userId
 * @param {string} opts.title
 * @param {string} [opts.source='whatsapp']
 * @param {number} [opts.priority=3]
 * @param {string|null} [opts.dueDate]
 * @param {string|null} [opts.recurring]
 * @param {string|null} [opts.googleTaskId]
 * @param {string|null} [opts.googleTasklistId]
 * @param {string|null} [opts.googleAccountId]
 * @param {string|null} [opts.googleUpdatedAt]
 * @param {string} [opts.syncState='local_only']
 * @param {boolean} [opts.completed=false]
 * @param {string|null} [opts.completedAt]
 */
function create({
  userId, title, source = 'whatsapp', priority = 3, dueDate = null, recurring = null,
  googleTaskId = null, googleTasklistId = null, googleAccountId = null, googleUpdatedAt = null,
  syncState = 'local_only', completed = false, completedAt = null,
} = {}) {
  const id = uuid();
  db.prepare(`
    INSERT INTO tasks (
      id, user_id, title, source, priority, due_date, completed, completed_at, recurring,
      google_task_id, google_tasklist_id, google_account_id, google_updated_at, sync_state
    )
    VALUES (
      @id, @userId, @title, @source, @priority, @dueDate, @completed, @completedAt, @recurring,
      @googleTaskId, @googleTasklistId, @googleAccountId, @googleUpdatedAt, @syncState
    )
  `).run({
    id, userId, title, source, priority, dueDate, recurring,
    completed: completed ? 1 : 0,
    completedAt: completed ? (completedAt || new Date().toISOString()) : null,
    googleTaskId, googleTasklistId, googleAccountId, googleUpdatedAt, syncState,
  });
  return getById(id);
}

function getById(id) {
  return db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
}

function getByGoogleRef(userId, { googleAccountId, googleTasklistId, googleTaskId } = {}) {
  if (!userId || !googleTaskId) return null;
  return db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND google_task_id = ? AND COALESCE(google_tasklist_id, '') = COALESCE(?, '')
      AND COALESCE(google_account_id, '') = COALESCE(?, '')
    LIMIT 1
  `).get(userId, googleTaskId, googleTasklistId || null, googleAccountId || null);
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

function listPendingSync(userId, limit = 100) {
  return db.prepare(`
    SELECT * FROM tasks
    WHERE user_id = ? AND sync_state IN ('pending_create', 'pending_update', 'pending_complete')
    ORDER BY updated_at ASC, created_at ASC
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

function countCompleted(userId, sinceISO) {
  if (sinceISO) {
    return db.prepare(`
      SELECT COUNT(*) c FROM tasks
      WHERE user_id = ? AND completed = 1
        AND COALESCE(completed_at, created_at) >= ?
    `).get(userId, toSqlite(sinceISO)).c;
  }
  return db.prepare('SELECT COUNT(*) c FROM tasks WHERE user_id = ? AND completed = 1').get(userId).c;
}

function toSqlite(iso) {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 19);
}

function countAll(userId) {
  return db.prepare('SELECT COUNT(*) c FROM tasks WHERE user_id = ?').get(userId).c;
}

function complete(id, { completedAt = new Date().toISOString(), syncState } = {}) {
  if (syncState) {
    db.prepare(`
      UPDATE tasks
      SET completed = 1, completed_at = ?, sync_state = ?, updated_at = ${nowSqlite()}
      WHERE id = ?
    `).run(completedAt, syncState, id);
  } else {
    db.prepare(`
      UPDATE tasks
      SET completed = 1, completed_at = ?, updated_at = ${nowSqlite()}
      WHERE id = ?
    `).run(completedAt, id);
  }
  return getById(id);
}

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

function updateDueDate(id, dueDateISO, { syncState } = {}) {
  if (syncState) {
    db.prepare(`
      UPDATE tasks SET due_date = ?, sync_state = ?, updated_at = ${nowSqlite()}
      WHERE id = ?
    `).run(dueDateISO, syncState, id);
  } else {
    db.prepare(`UPDATE tasks SET due_date = ?, updated_at = ${nowSqlite()} WHERE id = ?`).run(dueDateISO, id);
  }
  return getById(id);
}

function updateSyncMeta(id, {
  googleTaskId, googleTasklistId, googleAccountId, googleUpdatedAt, syncState,
} = {}) {
  db.prepare(`
    UPDATE tasks
    SET google_task_id = COALESCE(@googleTaskId, google_task_id),
        google_tasklist_id = COALESCE(@googleTasklistId, google_tasklist_id),
        google_account_id = COALESCE(@googleAccountId, google_account_id),
        google_updated_at = COALESCE(@googleUpdatedAt, google_updated_at),
        sync_state = COALESCE(@syncState, sync_state),
        updated_at = ${nowSqlite()}
    WHERE id = @id
  `).run({ id, googleTaskId, googleTasklistId, googleAccountId, googleUpdatedAt, syncState });
  return getById(id);
}

function markLocalDirty(id, syncState) {
  db.prepare(`UPDATE tasks SET sync_state = ?, updated_at = ${nowSqlite()} WHERE id = ?`).run(syncState, id);
  return getById(id);
}

function upsertFromGoogle(userId, task) {
  const existing = getByGoogleRef(userId, task);
  const completed = !!task.completed;
  const completedAt = completed ? (task.completedAt || new Date().toISOString()) : null;

  if (existing) {
    db.prepare(`
      UPDATE tasks
      SET title = @title,
          source = 'google_tasks',
          due_date = @dueDate,
          completed = @completed,
          completed_at = @completedAt,
          google_updated_at = @googleUpdatedAt,
          sync_state = 'synced',
          updated_at = ${nowSqlite()}
      WHERE id = @id
    `).run({
      id: existing.id,
      title: task.title,
      dueDate: task.dueDate,
      completed: completed ? 1 : 0,
      completedAt,
      googleUpdatedAt: task.googleUpdatedAt || null,
    });
    return getById(existing.id);
  }

  return create({
    userId,
    title: task.title,
    source: 'google_tasks',
    priority: task.priority || 3,
    dueDate: task.dueDate || null,
    recurring: null,
    googleTaskId: task.googleTaskId,
    googleTasklistId: task.googleTasklistId || null,
    googleAccountId: task.googleAccountId || null,
    googleUpdatedAt: task.googleUpdatedAt || null,
    syncState: 'synced',
    completed,
    completedAt,
  });
}

function clearGoogleSyncByAccount(userId, accountId) {
  return db.prepare(`
    UPDATE tasks
    SET google_task_id = NULL,
        google_tasklist_id = NULL,
        google_account_id = NULL,
        google_updated_at = NULL,
        sync_state = 'local_only',
        updated_at = ${nowSqlite()}
    WHERE user_id = ? AND google_account_id = ? AND source != 'google_tasks'
  `).run(userId, accountId).changes;
}

function removeGoogleImportedByAccount(userId, accountId) {
  return db.prepare(`
    DELETE FROM tasks
    WHERE user_id = ? AND google_account_id = ? AND source = 'google_tasks'
  `).run(userId, accountId).changes;
}

function clearAllGoogleSync(userId) {
  return db.prepare(`
    UPDATE tasks
    SET google_task_id = NULL,
        google_tasklist_id = NULL,
        google_account_id = NULL,
        google_updated_at = NULL,
        sync_state = 'local_only',
        updated_at = ${nowSqlite()}
    WHERE user_id = ? AND source != 'google_tasks'
  `).run(userId).changes;
}

function removeAllGoogleImported(userId) {
  return db.prepare(`
    DELETE FROM tasks
    WHERE user_id = ? AND source = 'google_tasks'
  `).run(userId).changes;
}

module.exports = {
  create, getById, getByGoogleRef, listForUser, listPendingSync, complete,
  listDueBetween, listOverdue, countCompleted, countAll,
  findByTitle, updateDueDate, updateSyncMeta, markLocalDirty, upsertFromGoogle,
  clearGoogleSyncByAccount, removeGoogleImportedByAccount,
  clearAllGoogleSync, removeAllGoogleImported,
};
