'use strict';

const { db, uuid } = require('./index');

/**
 * Upsert a Google Calendar event into the local cache (calendar_events).
 * Keyed by (user_id, gcal_event_id).
 */
function upsert(userId, ev) {
  const existing = db
    .prepare('SELECT id FROM calendar_events WHERE user_id = ? AND gcal_event_id = ?')
    .get(userId, ev.gcalEventId);

  const row = {
    user_id: userId,
    gcal_event_id: ev.gcalEventId,
    title: ev.title || null,
    description: ev.description || null,
    location: ev.location || null,
    start_time: ev.startTime || null,
    end_time: ev.endTime || null,
    all_day: ev.allDay ? 1 : 0,
    attendees: JSON.stringify(ev.attendees || []),
    status: ev.status || null,
    has_conflict: ev.hasConflict ? 1 : 0,
  };

  if (existing) {
    db.prepare(`
      UPDATE calendar_events SET
        title=@title, description=@description, location=@location,
        start_time=@start_time, end_time=@end_time, all_day=@all_day,
        attendees=@attendees, status=@status, has_conflict=@has_conflict
      WHERE id=@id
    `).run({ ...row, id: existing.id });
    return existing.id;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO calendar_events
      (id, user_id, gcal_event_id, title, description, location,
       start_time, end_time, all_day, attendees, status, has_conflict)
    VALUES
      (@id, @user_id, @gcal_event_id, @title, @description, @location,
       @start_time, @end_time, @all_day, @attendees, @status, @has_conflict)
  `).run({ ...row, id });
  return id;
}

/** Cache a whole batch of events. */
function cacheEvents(userId, events) {
  const tx = db.transaction((evs) => {
    for (const ev of evs) upsert(userId, ev);
  });
  tx(events);
  return events.length;
}

/** Remove a cached event by its Google event id. */
function removeByGcalId(userId, gcalEventId) {
  db.prepare('DELETE FROM calendar_events WHERE user_id = ? AND gcal_event_id = ?')
    .run(userId, gcalEventId);
}

/** Read cached events overlapping a [from, to] ISO window. */
function listCached(userId, fromIso, toIso) {
  return db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND (start_time <= ? AND end_time >= ?)
    ORDER BY start_time ASC
  `).all(userId, toIso, fromIso);
}

/** All cached events for a user, across dates — used by the dashboard calendar
 *  (which filters to the selected day client-side). Skips rows with no start. */
function listForUser(userId, limit = 500) {
  return db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ? AND start_time IS NOT NULL
    ORDER BY start_time ASC
    LIMIT ?
  `).all(userId, limit);
}

/** Events whose start_time falls within [fromIso, toIso). */
function listStartingBetween(userId, fromIso, toIso) {
  return db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND start_time IS NOT NULL AND start_time >= ? AND start_time < ?
    ORDER BY start_time ASC
  `).all(userId, fromIso, toIso);
}

/** Events whose end_time falls within [fromIso, toIso] — for "just wrapped up". */
function listEndingBetween(userId, fromIso, toIso) {
  return db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND end_time IS NOT NULL AND end_time >= ? AND end_time <= ?
    ORDER BY end_time ASC
  `).all(userId, fromIso, toIso);
}

module.exports = { upsert, cacheEvents, removeByGcalId, listCached, listStartingBetween, listForUser, listEndingBetween };
