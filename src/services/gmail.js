'use strict';

const { google } = require('googleapis');
const googleAuth = require('../auth/googleAuth');
const documentReader = require('./documentReader');

/** Gmail client for a user, optionally for one specific linked account. */
function gmailFor(user, account = null) {
  const auth = googleAuth.getAuthorizedClient(user, 'gmail', account);
  return google.gmail({ version: 'v1', auth });
}

/**
 * The ONE Google account Wingman should actively use for Gmail features.
 * We keep multi-account rows for reconnect/switching, but live reads/sends are
 * anchored to the primary account so the product behaves consistently.
 */
function accountsFor(user) {
  try {
    const primary = require('../db/googleAccounts').getPrimary(user.id);
    return primary ? [primary] : [null];
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

function decodePartBuffer(data) {
  if (!data) return Buffer.alloc(0);
  return Buffer.from(data, 'base64');
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

function collectAttachments(payload, out = []) {
  if (!payload) return out;
  if (payload.filename && payload.body && (payload.body.attachmentId || payload.body.data)) {
    out.push({
      filename: payload.filename,
      mimeType: payload.mimeType || 'application/octet-stream',
      attachmentId: payload.body.attachmentId || null,
      data: payload.body.data || null,
      size: payload.body.size || null,
    });
  }
  for (const part of (payload.parts || [])) collectAttachments(part, out);
  return out;
}

async function extractAttachment(gmail, messageId, part) {
  let buffer = part.data ? decodePartBuffer(part.data) : null;
  if ((!buffer || !buffer.length) && part.attachmentId) {
    const res = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: part.attachmentId,
    });
    buffer = decodePartBuffer(res && res.data && res.data.data);
  }

  const extracted = await documentReader.extractTextFromBuffer(buffer, {
    filename: part.filename,
    mimeType: part.mimeType,
  });
  return {
    filename: part.filename,
    mimeType: part.mimeType,
    supported: !!extracted.supported,
    note: extracted.note || null,
    text: extracted.text || '',
    truncated: !!extracted.truncated,
  };
}

/**
 * Fetch one message and normalize to
 * {gmailId, subject, sender, snippet, body, attachments}.
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
  const attachmentParts = collectAttachments(msg.payload).slice(0, 3);
  const attachments = [];
  for (const part of attachmentParts) {
    try {
      attachments.push(await extractAttachment(gmail, msg.id, part));
    } catch (err) {
      attachments.push({
        filename: part.filename,
        mimeType: part.mimeType,
        supported: false,
        note: `Could not read attachment (${err.message}).`,
        text: '',
        truncated: false,
      });
    }
  }
  const attachmentContext = attachments
    .map((a) => documentReader.buildAttachmentContext({
      filename: a.filename,
      mimeType: a.mimeType,
      supported: a.supported,
      text: a.text,
      truncated: a.truncated,
      note: a.note,
    }))
    .filter(Boolean)
    .join('\n\n');
  const combinedBody = attachmentContext
    ? `${body}\n\n[Email attachments]\n${attachmentContext}`
    : body;
  return {
    gmailId: msg.id,
    threadId: msg.threadId,
    subject: h('Subject'),
    sender: h('From'),
    snippet: msg.snippet || '',
    body: combinedBody.slice(0, 6000), // cap for LLM, incl. attachments
    labelIds: msg.labelIds || [],
    attachments,
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
