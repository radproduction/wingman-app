'use strict';

const { google } = require('googleapis');
const googleAuth = require('../auth/googleAuth');

/**
 * The user's REAL saved Google contacts (address book), via the People API.
 * These are the contacts they actually saved (phone contacts sync to Google),
 * not everyone they've ever emailed — so meeting-attendee suggestions are clean.
 *
 * Requires the contacts.readonly scope; if the user connected before that scope
 * was added, the call throws (insufficient scope) and the caller falls back.
 */
async function listContacts(user, { max = 250 } = {}) {
  const auth = googleAuth.getAuthorizedClient(user, 'gmail');
  const people = google.people({ version: 'v1', auth });

  const out = [];
  const seen = new Set();
  let pageToken;
  do {
    const res = await people.people.connections.list({
      resourceName: 'people/me',
      personFields: 'names,emailAddresses,organizations,photos',
      pageSize: 200,
      sortOrder: 'LAST_MODIFIED_DESCENDING',
      pageToken,
    });
    for (const p of res.data.connections || []) {
      const name = p.names && p.names[0] && p.names[0].displayName;
      const email = p.emailAddresses && p.emailAddresses[0] && p.emailAddresses[0].value;
      if (!name && !email) continue;
      const key = (email || name).toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      // A real, user-set photo — People marks the generic silhouette default:true.
      const photo = (p.photos || []).find((ph) => ph.url && !ph.default);
      out.push({
        name: name || email,
        email: email || null,
        company: (p.organizations && p.organizations[0] && p.organizations[0].name) || null,
        photo: photo ? photo.url : null,
      });
      if (out.length >= max) break;
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken && out.length < max);

  return out;
}

// ── Email → real contact photo map (for showing actual sender faces) ────────
//   People API is heavy, so cache per user for a few minutes; a whole inbox
//   render then costs one lookup, not one API call per sender.
const photoCache = new Map(); // userId -> { at, map }
const PHOTO_TTL_MS = 10 * 60 * 1000;

async function contactPhotoMap(user) {
  if (!user || !user.id) return {};
  const cached = photoCache.get(user.id);
  if (cached && Date.now() - cached.at < PHOTO_TTL_MS) return cached.map;

  const map = {};
  try {
    const auth = googleAuth.getAuthorizedClient(user, 'gmail');
    const people = google.people({ version: 'v1', auth });
    let pageToken;
    do {
      const res = await people.people.connections.list({
        resourceName: 'people/me',
        personFields: 'emailAddresses,photos',
        pageSize: 500,
        pageToken,
      });
      for (const p of res.data.connections || []) {
        const photo = (p.photos || []).find((ph) => ph.url && !ph.default);
        if (!photo) continue;
        for (const e of p.emailAddresses || []) {
          if (e.value) map[e.value.trim().toLowerCase()] = photo.url;
        }
      }
      pageToken = res.data.nextPageToken;
    } while (pageToken);
  } catch (_) {
    // insufficient scope / not connected — empty map, callers fall back to Gravatar/initials
  }
  photoCache.set(user.id, { at: Date.now(), map });
  return map;
}

module.exports = { listContacts, contactPhotoMap };
