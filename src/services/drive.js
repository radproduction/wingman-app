'use strict';

const { google } = require('googleapis');
const googleAuth = require('../auth/googleAuth');

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

  // Plain-text-ish files: download directly.
  if (mimeType && (mimeType.startsWith('text/') || mimeType === 'application/json')) {
    const res = await drive.files.get({ fileId, alt: 'media' }, { responseType: 'text' });
    return { name, kind: kindOf(mimeType), link: webViewLink, content: String(res.data || '').slice(0, 6000) };
  }

  // Binary (image/pdf/etc.) — we can't extract text, return metadata only.
  return { name, kind: kindOf(mimeType), link: webViewLink, content: null, note: 'Binary file — open the link to view.' };
}

module.exports = { search, readFile };
