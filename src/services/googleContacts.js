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
      personFields: 'names,emailAddresses,organizations',
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
      out.push({
        name: name || email,
        email: email || null,
        company: (p.organizations && p.organizations[0] && p.organizations[0].name) || null,
      });
      if (out.length >= max) break;
    }
    pageToken = res.data.nextPageToken;
  } while (pageToken && out.length < max);

  return out;
}

module.exports = { listContacts };
