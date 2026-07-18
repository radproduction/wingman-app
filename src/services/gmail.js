'use strict';

const { google } = require('googleapis');
const googleAuth = require('../auth/googleAuth');

/** Gmail client for a user, optionally for one specific linked account. */
function gmailFor(user, account = null) {
  const auth = googleAuth.getAuthorizedClient(user, 'gmail', account);
  return google.gmail({ version: 'v1', auth });
}

/**
 * Every Google account linked to the user. Returns [null] when there are no
 * account rows so legacy single-account users keep working unchanged.
 */
function accountsFor(user) {
  try {
    const list = require('../db/googleAccounts').listForUser(user.id);
    return list.length ? list : [null];
  } catch (_) {
    return [null];
  }
}

/**
 * List recent message ids for a user.
 *
 * @param {Object} user
 * @param {Object} [opts]
 * @param {number} [opts.maxResults=50]
 * @param {string} [opts.query] Gmail search query (e.g. 'is:unread', 'newer_than:1d')
 * @returns {Promise<string[]>} message ids
 */
async function listMessageIds(user, { maxResults = 50, query, account = null } = {}) {
  const gmail = gmailFor(user, account);
  const res = await gmail.users.messages.list({
    userId: 'me',
    maxResults,
    q: query || undefined,
  });
  return (res.data.messages || []).map((m) => m.id);
}

/** Decode a base64url payload part to a UTF-8 string. */
function decodePart(data) {
  if (!data) return '';
  return Buffer.from(data, 'base64').toString('utf8');
}

/** Recursively extract the best-effort plain text body from a payload. */
function extractBody(payload) {
  if (!payload) return '';
  if (payload.body && payload.body.data && (!payload.mimeType || payload.mimeType.startsWith('text/'))) {
    return decodePart(payload.body.data);
  }
  if (payload.parts && payload.parts.length) {
    // Prefer text/plain, then text/html, then anything
    const plain = payload.parts.find((p) => p.mimeType === 'text/plain');
    const html = payload.parts.find((p) => p.mimeType === 'text/html');
    const pick = plain || html || payload.parts[0];
    if (pick.parts) return extractBody(pick);
    let text = decodePart(pick.body && pick.body.data);
    if (pick.mimeType === 'text/html') {
      text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    }
    return text;
  }
  return '';
}

/**
 * Fetch one message and normalize to {gmailId, subject, sender, snippet, body}.
 */
async function getMessage(user, messageId, account = null) {
  const gmail = gmailFor(user, account);
  const res = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  });
  const msg = res.data;
  const headers = (msg.payload && msg.payload.headers) || [];
  const h = (name) => {
    const found = headers.find((x) => x.name.toLowerCase() === name.toLowerCase());
    return found ? found.value : '';
  };
  const body = extractBody(msg.payload) || msg.snippet || '';
  return {
    gmailId: msg.id,
    threadId: msg.threadId,
    subject: h('Subject'),
    sender: h('From'),
    snippet: msg.snippet || '',
    body: body.slice(0, 4000), // cap for LLM
    labelIds: msg.labelIds || [],
  };
}

/**
 * Send a reply email (used for draft_reply send-through, optional).
 */
async function sendMessage(user, { to, subject, body, threadId, account = null } = {}) {
  const gmail = gmailFor(user, account);
  const raw = Buffer.from(
    `To: ${to}\r\nSubject: ${subject}\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${body}`
  ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw, threadId },
  });
  return res.data;
}

/** Get the authenticated user's email address (for sender-self detection). */
async function getProfile(user, account = null) {
  const gmail = gmailFor(user, account);
  const res = await gmail.users.getProfile({ userId: 'me' });
  return { emailAddress: res.data.emailAddress };
}

module.exports = { listMessageIds, getMessage, sendMessage, extractBody, getProfile, accountsFor };
