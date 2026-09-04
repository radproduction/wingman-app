'use strict';

const crypto = require('crypto');
const { db, uuid } = require('./index');

/**
 * Notetaker bot sessions (meeting_bots). One row per attempt to send the Wingman
 * bot into a live call. The browser worker (a separate host) drives the actual
 * join/record and reports back over the bot API; the backend owns scheduling,
 * status and turning the returned audio into a summary.
 *
 * Lifecycle status:
 *   scheduled → dispatched → joining → waiting → recording → processing → done
 *   (or → failed / cancelled at any point)
 */

const ACTIVE = new Set(['scheduled', 'dispatched', 'joining', 'waiting', 'recording', 'processing']);

function create(userId, {
  meetingId = null,
  gcalEventId = null,
  meetingUrl,
  provider = null,
  botName = 'Wingman Notetaker',
  scheduledAt = null,
  status = 'scheduled',
} = {}) {
  if (!meetingUrl) throw new Error('meetingUrl required');
  const id = uuid();
  const workerToken = crypto.randomBytes(24).toString('hex');
  db.prepare(`
    INSERT INTO meeting_bots
      (id, user_id, meeting_id, gcal_event_id, meeting_url, provider, bot_name, status, worker_token, scheduled_at)
    VALUES
      (@id, @user_id, @meeting_id, @gcal_event_id, @meeting_url, @provider, @bot_name, @status, @worker_token, @scheduled_at)
  `).run({
    id,
    user_id: userId,
    meeting_id: meetingId,
    gcal_event_id: gcalEventId,
    meeting_url: meetingUrl,
    provider: provider || null,
    bot_name: botName || 'Wingman Notetaker',
    status,
    worker_token: workerToken,
    scheduled_at: scheduledAt || null,
  });
  return getById(id);
}

function getById(id) {
  return db.prepare('SELECT * FROM meeting_bots WHERE id = ?').get(id) || null;
}

/** Scoped read — only if it belongs to this user. */
function getForUser(userId, id) {
  return db.prepare('SELECT * FROM meeting_bots WHERE id = ? AND user_id = ?').get(id, userId) || null;
}

/** A session for a calendar event that should BLOCK a new dispatch — so we
 *  never send two bots to the same meeting. This is any still-active session,
 *  PLUS one that failed in the last 12 hours: without that cooldown, a meeting
 *  whose bot failed (not admitted / no audio) was re-dispatched every auto-join
 *  tick, spamming the user with repeated "couldn't capture" pings hours apart and
 *  burning Recall credits. 12h covers a normal meeting/day; a genuinely new
 *  occurrence the next day can still retry. */
function findActiveForEvent(userId, gcalEventId) {
  if (!gcalEventId) return null;
  return db.prepare(`
    SELECT * FROM meeting_bots
    WHERE user_id = ? AND gcal_event_id = ?
      AND (
        status NOT IN ('failed', 'cancelled')
        OR (status = 'failed' AND created_at > datetime('now', '-12 hours'))
      )
    ORDER BY created_at DESC LIMIT 1
  `).get(userId, gcalEventId) || null;
}

function listForUser(userId, limit = 50) {
  return db.prepare('SELECT * FROM meeting_bots WHERE user_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(userId, limit);
}

/** Recall-driven sessions still in flight — polled until Recall says done. */
function listRecallActive(limit = 50) {
  return db.prepare(`
    SELECT * FROM meeting_bots
    WHERE recall_bot_id IS NOT NULL
      AND status NOT IN ('done', 'failed', 'cancelled')
    ORDER BY created_at ASC
    LIMIT ?
  `).all(limit);
}

/** Sessions the worker still needs to run (fresh dispatches), oldest first. */
function listDispatchable(limit = 20) {
  return db.prepare(`
    SELECT * FROM meeting_bots
    WHERE status IN ('scheduled', 'dispatched')
    ORDER BY scheduled_at ASC, created_at ASC
    LIMIT ?
  `).all(limit);
}

// Columns a status update may set. worker_token is never patchable.
const FIELDS = {
  status: 'status',
  meetingId: 'meeting_id', meeting_id: 'meeting_id',
  startedAt: 'started_at', started_at: 'started_at',
  endedAt: 'ended_at', ended_at: 'ended_at',
  error: 'error',
  recordingUrl: 'recording_url', recording_url: 'recording_url',
  scheduledAt: 'scheduled_at', scheduled_at: 'scheduled_at',
  recallBotId: 'recall_bot_id', recall_bot_id: 'recall_bot_id',
};

function update(id, patch = {}) {
  const owned = db.prepare('SELECT id FROM meeting_bots WHERE id = ?').get(id);
  if (!owned) return null;
  const sets = [];
  const vals = { id };
  for (const [k, v] of Object.entries(patch)) {
    const col = FIELDS[k];
    if (!col) continue;
    sets.push(`${col} = @${col}`);
    vals[col] = v == null ? null : v;
  }
  if (!sets.length) return getById(id);
  sets.push("updated_at = datetime('now')");
  db.prepare(`UPDATE meeting_bots SET ${sets.join(', ')} WHERE id = @id`).run(vals);
  return getById(id);
}

function remove(userId, id) {
  return db.prepare('DELETE FROM meeting_bots WHERE id = ? AND user_id = ?').run(id, userId).changes > 0;
}

function isActive(status) {
  return ACTIVE.has(String(status || ''));
}

module.exports = {
  create, getById, getForUser, findActiveForEvent, listForUser,
  listDispatchable, listRecallActive, update, remove, isActive,
};
