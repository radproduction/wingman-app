'use strict';

const { google } = require('googleapis');
const googleAuth = require('../auth/googleAuth');
const documentReader = require('./documentReader');

// The combined Google token (stored on calendar_token/gmail_token) carries the
// Drive scope once the user has re-consented, so we can reuse it here.
function driveFor(user) {
  const auth = googleAuth.getAuthorizedClient(user, 'calendar');
  return google.drive({ version: 'v3', auth });
}

const FOLDER_MIME = 'application/vnd.google-apps.folder';

function escapeQ(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/** Shorten Google mime types to a friendly kind. */
function kindOf(mimeType) {
  if (mimeType === FOLDER_MIME) return 'folder';
  if (mimeType === 'application/vnd.google-apps.document') return 'doc';
  if (mimeType === 'application/vnd.google-apps.spreadsheet') return 'sheet';
  if (mimeType === 'application/vnd.google-apps.presentation') return 'slides';
  if (mimeType && mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf') return 'pdf';
  return 'file';
}

function normalizeFile(f) {
  return {
    id: f.id,
    name: f.name,
    kind: kindOf(f.mimeType),
    mimeType: f.mimeType,
    modified: f.modifiedTime || null,
    link: f.webViewLink || null,
    owner: (f.owners && f.owners[0] && (f.owners[0].displayName || f.owners[0].emailAddress)) || null,
  };
}

const LIST_FIELDS = 'files(id,name,mimeType,modifiedTime,webViewLink,owners(displayName,emailAddress))';

/**
 * Search Drive by name/full-text. If `query` is empty, returns the most
 * recently modified items. `folderName` optionally scopes to a named folder.
 */
async function search(user, { query, folderName, limit = 10 } = {}) {
  const drive = driveFor(user);
  const clauses = ['trashed = false'];

  if (query && query.trim()) {
    const q = escapeQ(query.trim());
    clauses.push(`(name contains '${q}' or fullText contains '${q}')`);
  }

  if (folderName && folderName.trim()) {
    // Resolve the folder id by name first.
    const fRes = await drive.files.list({
      q: `mimeType = '${FOLDER_MIME}' and name contains '${escapeQ(folderName.trim())}' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: 1,
    });
    const folder = (fRes.data.files || [])[0];
    if (folder) clauses.push(`'${folder.id}' in parents`);
  }

  const res = await drive.files.list({
    q: clauses.join(' and '),
    fields: LIST_FIELDS,
    orderBy: 'modifiedTime desc',
    pageSize: Math.min(Math.max(limit, 1), 25),
    spaces: 'drive',
  });
  return (res.data.files || []).map(normalizeFile);
}

/** Read (best-effort) the text content of a Drive file. */
async function readFile(user, fileId) {
  const drive = driveFor(user);
  const meta = await drive.files.get({
    fileId,
    fields: 'id,name,mimeType,webViewLink',
  });
  const { mimeType, name, webViewLink } = meta.data;

  const exportMap = {
    'application/vnd.google-apps.document': 'text/plain',
    'application/vnd.google-apps.spreadsheet': 'text/csv',
    'application/vnd.google-apps.presentation': 'text/plain',
  };

  if (exportMap[mimeType]) {
    const res = await drive.files.export(
      { fileId, mimeType: exportMap[mimeType] },
      { responseType: 'text' },
    );
    return { name, kind: kindOf(mimeType), link: webViewLink, content: String(res.data || '').slice(0, 6000) };
  }

  if (mimeType && (mimeType.startsWith('text/') || mimeType === 'application/json')) {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return { name, kind: kindOf(mimeType), link: webViewLink, content: String(res.data || '').slice(0, 6000) };
  }

  if (mimeType === 'application/pdf'
      || mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      || mimeType === 'application/vnd.ms-excel') {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'arraybuffer' });
    const extracted = await documentReader.extractTextFromBuffer(Buffer.from(res.data), { filename: name, mimeType });
    return {
      name,
      kind: kindOf(mimeType),
      link: webViewLink,
      content: extracted.supported ? extracted.text : null,
      note: extracted.supported ? extracted.note : extracted.note || 'Binary file - open the link to view.',
    };
  }

  return { name, kind: kindOf(mimeType), link: webViewLink, content: null, note: 'Binary file - open the link to view.' };
}

/** Resolve a folder id by (partial) name, or null if not found. */
async function resolveFolderId(drive, folderName) {
  if (!folderName || !folderName.trim()) return null;
  const res = await drive.files.list({
    q: `mimeType = '${FOLDER_MIME}' and name contains '${escapeQ(folderName.trim())}' and trashed = false`,
    fields: 'files(id,name)',
    pageSize: 1,
  });
  const f = (res.data.files || [])[0];
  return f ? f.id : null;
}

/** Create a Google Doc with the given text content (optionally inside a folder). */
async function createDoc(user, { name, content = '', folderName } = {}) {
  const drive = driveFor(user);
  const parentId = await resolveFolderId(drive, folderName);
  const requestBody = { name: name || 'Untitled', mimeType: 'application/vnd.google-apps.document' };
  if (parentId) requestBody.parents = [parentId];
  const res = await drive.files.create({
    requestBody,
    media: content ? { mimeType: 'text/plain', body: content } : undefined,
    fields: 'id,name,webViewLink',
  });
  return { id: res.data.id, name: res.data.name, link: res.data.webViewLink };
}

/** Create a folder (optionally inside a named parent folder). */
async function createFolder(user, { name, folderName } = {}) {
  const drive = driveFor(user);
  const parentId = await resolveFolderId(drive, folderName);
  const requestBody = { name: name || 'New folder', mimeType: FOLDER_MIME };
  if (parentId) requestBody.parents = [parentId];
  const res = await drive.files.create({ requestBody, fields: 'id,name,webViewLink' });
  return { id: res.data.id, name: res.data.name, link: res.data.webViewLink };
}

/** Turn rows (array of arrays) into CSV Google will import into a Sheet. */
function toCsv(rows) {
  if (!Array.isArray(rows)) return '';
  return rows.map((row) => (Array.isArray(row) ? row : [row])
    .map((cell) => {
      const s = String(cell == null ? '' : cell);
      // Quote anything with a comma, quote or newline; double embedded quotes.
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',')).join('\n');
}

/**
 * Create a native Google Sheet, optionally pre-filled with rows. Uploading CSV
 * with the spreadsheet target mime type makes Drive convert it — no Sheets API
 * scope needed, so this stays inside the Drive access the user already granted.
 */
async function createSheet(user, { name, rows, folderName } = {}) {
  const drive = driveFor(user);
  const parentId = await resolveFolderId(drive, folderName);
  const requestBody = { name: name || 'Untitled', mimeType: 'application/vnd.google-apps.spreadsheet' };
  if (parentId) requestBody.parents = [parentId];
  const csv = rows && rows.length ? toCsv(rows) : '';
  const res = await drive.files.create({
    requestBody,
    media: csv ? { mimeType: 'text/csv', body: csv } : undefined,
    fields: 'id,name,webViewLink',
  });
  return { id: res.data.id, name: res.data.name, link: res.data.webViewLink };
}

/**
 * Share a file. With an email, shares with that person (and emails them);
 * without one, makes it viewable by anyone with the link. Returns the link.
 */
async function share(user, { fileId, email, role = 'reader', notify = true } = {}) {
  const drive = driveFor(user);
  const permission = email
    ? { type: 'user', role, emailAddress: String(email).trim() }
    : { type: 'anyone', role };
  await drive.permissions.create({
    fileId,
    requestBody: permission,
    sendNotificationEmail: !!email && notify,
    fields: 'id',
  });
  const meta = await drive.files.get({ fileId, fields: 'name,webViewLink' });
  return { name: meta.data.name, link: meta.data.webViewLink, sharedWith: email || 'anyone with the link', role };
}

/** Move a file to the trash (recoverable, not a hard delete). */
async function trashFile(user, fileId) {
  const drive = driveFor(user);
  const meta = await drive.files.get({ fileId, fields: 'name' });
  await drive.files.update({ fileId, requestBody: { trashed: true } });
  return { name: meta.data.name };
}

/** Rename a file or folder. */
async function rename(user, { fileId, name } = {}) {
  const drive = driveFor(user);
  const res = await drive.files.update({ fileId, requestBody: { name }, fields: 'id,name,webViewLink' });
  return { id: res.data.id, name: res.data.name, link: res.data.webViewLink };
}

/** Move a file into a named folder (replaces its current parents). */
async function move(user, { fileId, folderName } = {}) {
  const drive = driveFor(user);
  const parentId = await resolveFolderId(drive, folderName);
  if (!parentId) return { moved: false, reason: 'FOLDER_NOT_FOUND', folderName };
  const cur = await drive.files.get({ fileId, fields: 'parents,name,webViewLink' });
  const res = await drive.files.update({
    fileId,
    addParents: parentId,
    removeParents: (cur.data.parents || []).join(','),
    fields: 'id,name,webViewLink',
  });
  return { moved: true, name: res.data.name, link: res.data.webViewLink, folderName };
}

module.exports = {
  search, readFile, createDoc, createSheet, createFolder,
  share, trashFile, rename, move,
};
