'use strict';

const { db, uuid } = require('./index');

/**
 * Standing instructions Wingman fulfils on schedule.
 *
 * These are deliberately NOT tasks. A task is a to-do the user does; an
 * automation is something Wingman does by itself at a time — the instruction is
 * kept as plain language and handed to the AI (with all its tools) when it
 * fires, so anything Wingman can do can be scheduled without a bespoke rule.
 */

function create(userId, { instruction, time, kind = 'daily', weekday = null, runDate = null, timezone }) {
  const id = uuid();
  db.prepare(`
    INSERT INTO automations (id, user_id, instruction, time, kind, weekday, run_date, timezone)
    VALUES (@id, @user_id, @instruction, @time, @kind, @weekday, @run_date, @timezone)
  `).run({
    id,
    user_id: userId,
    instruction: String(instruction || '').trim(),
    time: time || null,
    kind,
    weekday: weekday == null ? null : Number(weekday),
    run_date: runDate || null,
    timezone: timezone || null,
  });
  return getById(id);
}

function getById(id) {
  return db.prepare('SELECT * FROM automations WHERE id = ?').get(id) || null;
}

function listForUser(userId, { includeInactive = false } = {}) {
  const sql = includeInactive
    ? 'SELECT * FROM automations WHERE user_id = ? ORDER BY time'
    : 'SELECT * FROM automations WHERE user_id = ? AND active = 1 ORDER BY time';
  return db.prepare(sql).all(userId);
}

/** Every active automation across all users — the scheduler sweep. */
function listAllActive() {
  return db.prepare('SELECT * FROM automations WHERE active = 1').all();
}

function markRun(id, localDay) {
  db.prepare('UPDATE automations SET last_run_date = ? WHERE id = ?').run(localDay, id);
}

function deactivate(id) {
  db.prepare('UPDATE automations SET active = 0 WHERE id = ?').run(id);
}

/** Cancel by id, but only if it belongs to this user (no cross-user deletes). */
function cancelForUser(userId, id) {
  const row = db.prepare('SELECT * FROM automations WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) return false;
  db.prepare('UPDATE automations SET active = 0 WHERE id = ?').run(id);
  return true;
}

module.exports = { create, getById, listForUser, listAllActive, markRun, deactivate, cancelForUser };
