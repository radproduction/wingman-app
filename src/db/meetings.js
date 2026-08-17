'use strict';

const { db, uuid } = require('./index');

/**
 * Meetings the user held. Raw notes → Claude summary + action items, optionally
 * emailed to attendees + the user. JSON columns (attendees, summary) are parsed
 * on read and stringified on write so callers deal in plain objects.
 */

const parse = (s, fallback) => {
  try { return s ? JSON.parse(s) : fallback; } catch (_) { return fallback; }
};

function hydrate(row) {
  if (!row) return null;
  return {
    ...row,
    virtual: !!row.virtual,
    attendees: parse(row.attendees, []),
    summary: parse(row.summary, null),
  };
}

function create(userId, { title, type, company, location, virtual, attendees, notes, status, meetingAt } = {}) {
  const id = uuid();
  db.prepare(`
    INSERT INTO meetings (id, user_id, title, type, company, location, virtual, attendees, notes, status, meeting_at)
    VALUES (@id, @user_id, @title, @type, @company, @location, @virtual, @attendees, @notes, @status, @meeting_at)
  `).run({
    id,
    user_id: userId,
    title: title || null,
    type: type || null,
    company: company || null,
    location: location || null,
    virtual: virtual ? 1 : 0,
    attendees: JSON.stringify(Array.isArray(attendees) ? attendees : []),
    notes: notes || null,
    status: status || 'scheduled',
    meeting_at: meetingAt || null,
  });
  return getById(id);
}

function getById(id) {
  return hydrate(db.prepare('SELECT * FROM meetings WHERE id = ?').get(id));
}

/** Scoped read — only returns the row if it belongs to this user. */
function getForUser(userId, id) {
  return hydrate(db.prepare('SELECT * FROM meetings WHERE id = ? AND user_id = ?').get(id, userId));
}

function listForUser(userId, limit = 50) {
  return db
    .prepare('SELECT * FROM meetings WHERE user_id = ? ORDER BY COALESCE(meeting_at, created_at) DESC LIMIT ?')
    .all(userId, limit)
    .map(hydrate);
}

// Plain scalar columns a client may patch directly.
const SCALAR = { title: 1, type: 1, company: 1, location: 1, status: 1, notes: 1, meeting_at: 1 };

/** Patch a meeting (scoped to the user). Handles JSON + scalar fields. */
function update(userId, id, patch = {}) {
  const owned = db.prepare('SELECT id FROM meetings WHERE id = ? AND user_id = ?').get(id, userId);
  if (!owned) return null;

  const sets = [];
  const vals = { id };
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'attendees') {
      sets.push('attendees = @attendees');
      vals.attendees = JSON.stringify(Array.isArray(v) ? v : []);
    } else if (k === 'summary') {
      sets.push('summary = @summary');
      vals.summary = v == null ? null : JSON.stringify(v);
    } else if (k === 'virtual') {
      sets.push('virtual = @virtual');
      vals.virtual = v ? 1 : 0;
    } else if (k === 'emailedAt' || k === 'emailed_at') {
      sets.push('emailed_at = @emailed_at');
      vals.emailed_at = v || null;
    } else if (k === 'meetingAt') {
      sets.push('meeting_at = @meeting_at');
      vals.meeting_at = v || null;
    } else if (SCALAR[k]) {
      sets.push(`${k} = @${k}`);
      vals[k] = v == null ? null : v;
    }
  }
  if (!sets.length) return getById(id);
  sets.push("updated_at = datetime('now')");
  db.prepare(`UPDATE meetings SET ${sets.join(', ')} WHERE id = @id`).run(vals);
  return getById(id);
}

function remove(userId, id) {
  const info = db.prepare('DELETE FROM meetings WHERE id = ? AND user_id = ?').run(id, userId);
  return info.changes > 0;
}

module.exports = { create, getById, getForUser, listForUser, update, remove };
