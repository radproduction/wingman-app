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
    // Which linked Google account this event belongs to, so edits/cancellations
    // are sent to the calendar they actually live on.
    account_id: ev.accountId || null,
    account_email: ev.accountEmail || null,
    title: ev.title || null,
    description: ev.description || null,
    location: ev.location || null,
    start_time: ev.startTime || null,
    end_time: ev.endTime || null,
    all_day: ev.allDay ? 1 : 0,
    attendees: JSON.stringify(ev.attendees || []),
    status: ev.status || null,
    has_conflict: ev.hasConflict ? 1 : 0,
    meeting_url: ev.meetingUrl || null,
    meeting_provider: ev.meetingProvider || null,
  };

  if (existing) {
    db.prepare(`
      UPDATE calendar_events SET
        title=@title, description=@description, location=@location,
        account_id=COALESCE(@account_id, account_id), account_email=COALESCE(@account_email, account_email),
        start_time=@start_time, end_time=@end_time, all_day=@all_day,
        attendees=@attendees, status=@status, has_conflict=@has_conflict,
        meeting_url=@meeting_url, meeting_provider=@meeting_provider
      WHERE id=@id
    `).run({ ...row, id: existing.id });
    return existing.id;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO calendar_events
      (id, user_id, gcal_event_id, account_id, account_email, title, description, location,
       start_time, end_time, all_day, attendees, status, has_conflict, meeting_url, meeting_provider)
    VALUES
      (@id, @user_id, @gcal_event_id, @account_id, @account_email, @title, @description, @location,
       @start_time, @end_time, @all_day, @attendees, @status, @has_conflict, @meeting_url, @meeting_provider)
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

/** Look up one cached event by its Google event id (used to find its account). */
function findByGcalId(userId, gcalEventId) {
  return db.prepare('SELECT * FROM calendar_events WHERE user_id = ? AND gcal_event_id = ?')
    .get(userId, gcalEventId);
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

/**
 * Collapse rows that represent the SAME real event. A single meeting or stay
 * often lands in Google Calendar as two-plus invitations (each its own event id,
 * sometimes its own Meet link or a slightly different title) — and every
 * proactive alert then fired once PER row (two "wrapped up" notes, four leave-by
 * warnings, two notetaker bots → duplicate notes). Two rows count as ONE event
 * when they share a start time AND any of: the same (normalised) title, the same
 * location, or the same meeting URL. Used by the ALERT read paths only — the
 * calendar DISPLAY (listForUser) still shows every row. Rows arrive ordered, so
 * we keep the first and callers are otherwise unchanged.
 */
function collapseDuplicateEvents(rows) {
  const norm = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
  const seen = [];
  const out = [];
  for (const r of rows) {
    const start = r.start_time || '';
    const title = norm(r.title);
    const loc = norm(r.location);
    const url = String(r.meeting_url || '').trim();
    const isDup = seen.some((s) => s.start === start
      && ((title && s.title === title) || (loc && s.loc === loc) || (url && s.url === url)));
    if (isDup) continue;
    seen.push({ start, title, loc, url });
    out.push(r);
  }
  return out;
}

/** Events whose start_time falls within [fromIso, toIso). Deduped to one row per
 *  real event so a duplicate invite doesn't double every alert. */
function listStartingBetween(userId, fromIso, toIso) {
  return collapseDuplicateEvents(db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND start_time IS NOT NULL AND start_time >= ? AND start_time < ?
    ORDER BY start_time ASC
  `).all(userId, fromIso, toIso));
}

/** Events whose end_time falls within [fromIso, toIso] — for "just wrapped up".
 *  Deduped to one row per real event (so a duplicate invite → one wrap note). */
function listEndingBetween(userId, fromIso, toIso) {
  return collapseDuplicateEvents(db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND end_time IS NOT NULL AND end_time >= ? AND end_time <= ?
    ORDER BY end_time ASC
  `).all(userId, fromIso, toIso));
}

/** Upcoming events that carry a video-call link, starting within [fromIso, toIso).
 *  Used by the notetaker dispatcher to decide who to send the bot to. */
function listJoinableBetween(userId, fromIso, toIso) {
  return db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND meeting_url IS NOT NULL AND meeting_url <> ''
      AND start_time IS NOT NULL AND start_time >= ? AND start_time < ?
      AND (status IS NULL OR status <> 'cancelled')
    ORDER BY start_time ASC
  `).all(userId, fromIso, toIso);
}

/**
 * Events with a video link that are ONGOING or about to start — i.e. the bot
 * should be in them right now: start_time <= now+lookahead AND not yet ended.
 * This catches meetings the user is ALREADY in (so the bot still joins mid-call,
 * not only when dispatched before the start).
 */
function listActiveOrUpcoming(userId, nowIso, lookaheadMin) {
  const now = new Date(nowIso).getTime();
  const soon = now + lookaheadMin * 60000;
  // Pull the candidates in SQL, but decide "is it ongoing / about to start" in
  // JS on ABSOLUTE instants. Google stores start/end with each event's own UTC
  // offset (…Z, +00:00, +05:00), so a lexical SQL string compare against a Z
  // timestamp is wrong whenever offsets differ — that quietly broke auto-join.
  // Date.parse() normalises every offset to the same epoch, so this is correct
  // regardless of the calendar's timezone.
  const rows = db.prepare(`
    SELECT * FROM calendar_events
    WHERE user_id = ?
      AND meeting_url IS NOT NULL AND meeting_url <> ''
      AND (status IS NULL OR status <> 'cancelled')
      AND start_time IS NOT NULL
  `).all(userId);
  // Collapse duplicate invites so the notetaker sends ONE bot per real meeting
  // (two invites for one meeting were producing two bots → duplicate notes).
  return collapseDuplicateEvents(rows
    .filter((e) => {
      const s = Date.parse(e.start_time);
      if (Number.isNaN(s) || s > soon) return false;         // not started / too far ahead
      const end = e.end_time ? Date.parse(e.end_time) : NaN;
      if (!Number.isNaN(end) && end <= now) return false;    // already ended
      return true;
    })
    .sort((a, b) => Date.parse(a.start_time) - Date.parse(b.start_time)));
}

function deleteByAccount(userId, accountId) {
  return db.prepare(`
    DELETE FROM calendar_events
    WHERE user_id = ? AND account_id = ?
  `).run(userId, accountId).changes;
}

function deleteAllForUser(userId) {
  return db.prepare('DELETE FROM calendar_events WHERE user_id = ?').run(userId).changes;
}

module.exports = {
  upsert, cacheEvents, removeByGcalId, listCached, listStartingBetween,
  listForUser, listEndingBetween, findByGcalId, listJoinableBetween, listActiveOrUpcoming,
  deleteByAccount, deleteAllForUser,
};
