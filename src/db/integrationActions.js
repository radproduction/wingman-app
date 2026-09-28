'use strict';

const { db, uuid } = require('./index');

/**
 * Approval gate for third-party (Composio) write actions — CORE-03.
 * A write is stored as 'pending' and can only be executed after the user sends
 * a NEW message (rowid check), so the model cannot self-approve in one turn.
 * All calls are synchronous (better-sqlite3) — never await these.
 */

/** Newest conversation rowid for this user's own (inbound) messages. */
function latestUserMsgRowid(userId) {
  const r = db.prepare(
    "SELECT MAX(rowid) AS rid FROM conversations WHERE user_id = ? AND role = 'user'",
  ).get(userId);
  return (r && r.rid) || 0;
}

function create({ userId, toolkit, toolSlug, toolVersion = null, args = {}, summary = '' }) {
  const id = uuid();
  db.prepare(`
    INSERT INTO integration_actions
      (id, user_id, toolkit, tool_slug, tool_version, arguments, summary, after_msg_rowid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, userId, toolkit, toolSlug, toolVersion, JSON.stringify(args || {}),
    String(summary || '').slice(0, 500), latestUserMsgRowid(userId));
  return get(userId, id);
}

/** Owner-scoped fetch — another user's action id resolves to null. */
function get(userId, id) {
  const row = db.prepare('SELECT * FROM integration_actions WHERE id = ? AND user_id = ?').get(id, userId);
  if (row) {
    try { row.arguments = JSON.parse(row.arguments || '{}'); } catch (_) { row.arguments = {}; }
  }
  return row || null;
}

function listPending(userId) {
  return db.prepare(
    "SELECT id, toolkit, tool_slug, summary, created_at FROM integration_actions WHERE user_id = ? AND status = 'pending' ORDER BY created_at DESC LIMIT 20",
  ).all(userId);
}

/** True when the user has sent a message since this action was proposed. */
function userHasRepliedSince(userId, action) {
  return latestUserMsgRowid(userId) > (action.after_msg_rowid || 0);
}

/**
 * Atomically move pending → executing. Returns false if someone else (an
 * overlapping turn, a double "yes") already claimed it — so it runs once.
 */
function claim(userId, id) {
  const r = db.prepare(
    "UPDATE integration_actions SET status = 'executing', decided_at = datetime('now') WHERE id = ? AND user_id = ? AND status = 'pending'",
  ).run(id, userId);
  return r.changes === 1;
}

function finish(userId, id, { ok, result }) {
  let json = '';
  try { json = JSON.stringify(result == null ? null : result); } catch (_) { json = '"[unserialisable]"'; }
  db.prepare(
    'UPDATE integration_actions SET status = ?, result = ? WHERE id = ? AND user_id = ?',
  ).run(ok ? 'done' : 'failed', json.slice(0, 8000), id, userId);
}

function cancel(userId, id) {
  const r = db.prepare(
    "UPDATE integration_actions SET status = 'cancelled', decided_at = datetime('now') WHERE id = ? AND user_id = ? AND status = 'pending'",
  ).run(id, userId);
  return r.changes === 1;
}

/** Expire stale proposals so an old "yes" can't fire a forgotten action. */
function expireOld(ttlMinutes) {
  db.prepare(
    "UPDATE integration_actions SET status = 'expired' WHERE status = 'pending' AND created_at < datetime('now', ?)",
  ).run(`-${Math.max(1, ttlMinutes | 0)} minutes`);
}

module.exports = { create, get, listPending, userHasRepliedSince, claim, finish, cancel, expireOld };
