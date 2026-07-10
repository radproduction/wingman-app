'use strict';

const { google } = require('googleapis');
const config = require('../config');
const usersRepo = require('../db/users');

// Calendar scopes (read + write events)
const CALENDAR_SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// Gmail scopes (read, send, modify)
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.modify',
];

// Drive scope (full: browse/read files AND create docs & folders).
const DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive',
];

// We request all scopes together so a single consent connects Calendar, Gmail
// and Drive. The same combined token is stored in BOTH users.calendar_token and
// users.gmail_token so each subsystem can check its own connection flag.
const SCOPES = [...CALENDAR_SCOPES, ...GMAIL_SCOPES, ...DRIVE_SCOPES];

/**
 * Create a fresh OAuth2 client (not yet authorized).
 */
function createOAuthClient() {
  return new google.auth.OAuth2(
    config.google.clientId,
    config.google.clientSecret,
    config.google.redirectUri
  );
}

/**
 * Build the Google consent URL. We encode the user's phone number in `state`
 * so the callback can map the returned tokens back to the right user.
 *
 * @param {string} phone  digits-only WhatsApp number
 * @param {string[]} [scopes]  scopes to request (defaults to all)
 * @returns {string} consent URL
 */
function getAuthUrl(phone, scopes = SCOPES) {
  const oauth2Client = createOAuthClient();
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',     // request a refresh token
    prompt: 'consent',          // force refresh_token issuance every time
    scope: scopes,
    state: phone || '',
    include_granted_scopes: true,
  });
}

/**
 * Merge new tokens with an existing stored token JSON string, preserving the
 * refresh_token if Google omits it on re-consent.
 */
function mergeTokens(existingJson, tokens) {
  let existing = {};
  try { existing = JSON.parse(existingJson || '{}'); } catch (_) {}
  const merged = { ...existing, ...tokens };
  if (!merged.refresh_token && existing.refresh_token) {
    merged.refresh_token = existing.refresh_token;
  }
  return merged;
}

/**
 * Exchange an auth code for tokens and persist them on the user
 * (creating the user if needed). Since we request combined scopes, the same
 * token is stored in BOTH calendar_token and gmail_token.
 *
 * @param {string} code   OAuth authorization code
 * @param {string} phone  digits-only WhatsApp number (from state)
 * @returns {Promise<Object>} the updated user row
 */
async function handleCallback(code, phone) {
  const oauth2Client = createOAuthClient();
  const { tokens } = await oauth2Client.getToken(code);

  let user = usersRepo.getByPhone(phone);
  if (!user) {
    user = usersRepo.create({ phone });
  }

  const grantedScope = (tokens.scope || '').split(/\s+/);
  const hasCalendar = grantedScope.some((s) => s.includes('calendar'));
  const hasGmail = grantedScope.some((s) => s.includes('gmail'));

  const updates = {};
  // If we can't tell scopes, store in both (combined consent is the default).
  if (hasCalendar || grantedScope.length === 0) {
    updates.calendar_token = JSON.stringify(mergeTokens(user.calendar_token, tokens));
  }
  if (hasGmail || grantedScope.length === 0) {
    updates.gmail_token = JSON.stringify(mergeTokens(user.gmail_token, tokens));
  }
  // Fallback: if neither matched but we got tokens, store in both.
  if (!updates.calendar_token && !updates.gmail_token) {
    updates.calendar_token = JSON.stringify(mergeTokens(user.calendar_token, tokens));
    updates.gmail_token = JSON.stringify(mergeTokens(user.gmail_token, tokens));
  }

  usersRepo.update(user.id, updates);
  return usersRepo.getById(user.id);
}

/**
 * Build an authorized OAuth2 client for a given user. Reads whichever token
 * field is available (calendar or gmail — they're the same combined token),
 * and auto-persists refreshed tokens back to BOTH fields.
 *
 * @param {Object} user
 * @param {'calendar'|'gmail'} [service='calendar']
 * @throws CALENDAR_NOT_CONNECTED / GMAIL_NOT_CONNECTED
 */
function getAuthorizedClient(user, service = 'calendar') {
  const errCode = service === 'gmail' ? 'GMAIL_NOT_CONNECTED' : 'CALENDAR_NOT_CONNECTED';
  const tokenJson = service === 'gmail'
    ? (user && (user.gmail_token || user.calendar_token))
    : (user && (user.calendar_token || user.gmail_token));

  if (!user || !tokenJson) throw new Error(errCode);

  let tokens;
  try { tokens = JSON.parse(tokenJson); }
  catch (_) { throw new Error(errCode); }

  const oauth2Client = createOAuthClient();
  oauth2Client.setCredentials(tokens);

  oauth2Client.on('tokens', (newTokens) => {
    try {
      const fresh = usersRepo.getById(user.id);
      const updates = {};
      if (fresh.calendar_token) {
        updates.calendar_token = JSON.stringify(mergeTokens(fresh.calendar_token, newTokens));
      }
      if (fresh.gmail_token) {
        updates.gmail_token = JSON.stringify(mergeTokens(fresh.gmail_token, newTokens));
      }
      if (Object.keys(updates).length) usersRepo.update(user.id, updates);
    } catch (_) {}
  });

  return oauth2Client;
}

function isConnected(user) {
  return !!(user && user.calendar_token);
}

function isEmailConnected(user) {
  return !!(user && user.gmail_token);
}

module.exports = {
  SCOPES,
  CALENDAR_SCOPES,
  GMAIL_SCOPES,
  DRIVE_SCOPES,
  createOAuthClient,
  getAuthUrl,
  handleCallback,
  getAuthorizedClient,
  isConnected,
  isEmailConnected,
};
