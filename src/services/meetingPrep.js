'use strict';

const usersRepo = require('../db/users');
const calendarEventsRepo = require('../db/calendarEvents');
const contactsRepo = require('../db/contacts');
const emailItemsRepo = require('../db/emailItems');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

/** Parse attendees JSON from a cached calendar event row. */
function attendeesOf(event) {
  try {
    const arr = JSON.parse(event.attendees || '[]');
    return Array.isArray(arr) ? arr : [];
  } catch (_) { return []; }
}

/** Extract an { name, email } for an attendee entry (string or object). */
function normalizeAttendee(a) {
  if (!a) return null;
  if (typeof a === 'string') {
    const email = a.includes('@') ? a.toLowerCase() : null;
    return { email, name: email ? email.split('@')[0] : a };
  }
  const email = (a.email || '').toLowerCase() || null;
  return { email, name: a.displayName || a.name || (email ? email.split('@')[0] : 'attendee') };
}

/**
 * Build a meeting-prep message for a single event, or null if there's nothing
 * useful to say (no known attendees / context).
 */
function buildPrepForEvent(userId, event, tz) {
  const own = ownEmail(userId);
  const attendees = attendeesOf(event)
    .map(normalizeAttendee)
    .filter((a) => a && a.email && a.email !== own);

  const blocks = [];
  for (const att of attendees.slice(0, 3)) {
    const contact = contactsRepo.find(userId, att.email) || contactsRepo.find(userId, att.name);
    const recent = emailItemsRepo.searchByKeyword(userId, att.email).slice(0, 3);
    const lastDiscussed = recent.length
      ? recent.map((e) => e.summary || e.subject).filter(Boolean)[0]
      : null;
    const relationship = contact && contact.notes ? contact.notes : (contact ? `${contact.strength || 'occasional'} contact, ${contact.interaction_count || 0} interactions` : 'No prior context on file');

    const lines = [`Attendee: ${contact ? contact.name : att.name}`];
    if (lastDiscussed) lines.push(`Last discussed: ${lastDiscussed}`);
    lines.push(`Relationship: ${relationship}`);
    if (recent.length) {
      lines.push('Key points to remember:');
      for (const e of recent.slice(0, 2)) {
        const point = e.summary || e.subject;
        if (point) lines.push(`\u2022 ${point}`);
      }
    }
    blocks.push(lines.join('\n'));
  }

  if (!blocks.length) return null;

  const when = event.start_time ? t.timeLabel(event.start_time, tz) : 'soon';
  const header = `\ud83d\udccb Meeting prep \u2014 ${event.title || 'Meeting'} at ${when}:`;
  return `${header}\n\n${blocks.join('\n\n')}`;
}

function ownEmail(userId) {
  const user = usersRepo.getById(userId);
  if (!user || !user.preferences) return null;
  return (user.preferences.emailAddress || '').toLowerCase() || null;
}

/**
 * Check for events starting in ~30–45 min for one user and send prep messages.
 * De-dupes via a preferences flag set of prepped event ids.
 */
async function prepForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: [] };
  const tz = user.timezone || 'Asia/Karachi';

  const fromISO = new Date(now.getTime() + 30 * 60000).toISOString();
  const toISO = new Date(now.getTime() + 45 * 60000).toISOString();
  const events = calendarEventsRepo.listStartingBetween(userId, fromISO, toISO);

  const prefs = user.preferences || {};
  const prepped = new Set(prefs.preppedEvents || []);
  const sent = [];

  for (const ev of events) {
    if (prepped.has(ev.id)) continue;
    const msg = buildPrepForEvent(userId, ev, tz);
    if (!msg) continue;
    sent.push(msg);
    if (send && wa().ready()) {
      try { await wa().sendMessage(user.phone, msg); } catch (err) { console.warn('[meetingPrep] send failed:', err.message); }
    } else if (send) {
      console.log('[meetingPrep] (WA not ready) would send prep for', ev.title);
    }
    prepped.add(ev.id);
  }

  if (sent.length) {
    prefs.preppedEvents = Array.from(prepped).slice(-50);
    usersRepo.update(userId, { preferences: prefs });
  }
  return { sent };
}

function safeParse(s) { try { return JSON.parse(s || '{}'); } catch (_) { return {}; } }

async function runAllUsers({ now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'meetingprep')) continue;
    results.push({ phone: u.phone, ...(await prepForUser(u.id, { now })) });
  }
  return results;
}

module.exports = { buildPrepForEvent, prepForUser, runAllUsers, normalizeAttendee, attendeesOf };
