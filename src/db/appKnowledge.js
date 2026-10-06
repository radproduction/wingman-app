'use strict';

const { db } = require('./index');

/**
 * What Wingman understands about each app a user connected (see
 * services/appStudy.js). Synchronous (better-sqlite3) — never await these.
 */

function get(userId, app) {
  return db.prepare('SELECT * FROM app_knowledge WHERE user_id = ? AND app = ?').get(userId, app) || null;
}

function listForUser(userId) {
  return db.prepare('SELECT * FROM app_knowledge WHERE user_id = ? ORDER BY connected_at').all(userId);
}

/**
 * Create the row if it doesn't exist. Returns true when it was newly created.
 * The caller studies a new app straight away; next_study_at (+30 min) is only the
 * scheduler's safety net in case that first study never ran (e.g. a restart).
 */
function ensure(userId, app) {
  const r = db.prepare(`
    INSERT OR IGNORE INTO app_knowledge (user_id, app, status, next_study_at)
    VALUES (?, ?, 'new', datetime('now', '+30 minutes'))
  `).run(userId, app);
  return r.changes === 1;
}

function remove(userId, app) {
  db.prepare('DELETE FROM app_knowledge WHERE user_id = ? AND app = ?').run(userId, app);
}

/** Record a finished study and schedule the next one `nextInDays` from now. */
function saveStudy(userId, app, { note, nextInDays, ready }) {
  db.prepare(`
    UPDATE app_knowledge
    SET note = ?, status = ?, runs = runs + 1, studied_at = datetime('now'),
        next_study_at = datetime('now', ?), last_error = NULL
    WHERE user_id = ? AND app = ?
  `).run(String(note || '').slice(0, 4000), ready ? 'ready' : 'learning', `+${Math.max(1, nextInDays | 0)} days`, userId, app);
}

/** A study failed — keep the old note, try again later. */
function saveFailure(userId, app, error, retryInHours = 12) {
  db.prepare(`
    UPDATE app_knowledge
    SET status = CASE WHEN note IS NULL THEN 'failed' ELSE status END,
        last_error = ?, next_study_at = datetime('now', ?)
    WHERE user_id = ? AND app = ?
  `).run(String(error || '').slice(0, 300), `+${Math.max(1, retryInHours | 0)} hours`, userId, app);
}

/** Studies that are due now, oldest first. */
function due(limit = 5) {
  return db.prepare(`
    SELECT * FROM app_knowledge
    WHERE next_study_at IS NOT NULL AND next_study_at <= datetime('now')
    ORDER BY next_study_at LIMIT ?
  `).all(limit);
}

module.exports = { get, listForUser, ensure, remove, saveStudy, saveFailure, due };
