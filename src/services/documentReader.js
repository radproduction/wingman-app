'use strict';

const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const MAX_OUTPUT_CHARS = 7000;
const MAX_BINARY_BYTES = 15 * 1024 * 1024;

const DOCX_MIME = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

function normalizeMime(mimeType) {
  return String(mimeType || '').toLowerCase().trim();
}

function normalizeExt(filename) {
  return path.extname(String(filename || '')).toLowerCase();
}

function collapseWhitespace(text) {
  return String(text || '')
    .replace(/\r/g, '\n')
    .replace(/\u0000/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

function truncate(text, limit = MAX_OUTPUT_CHARS) {
  const clean = collapseWhitespace(text);
  if (clean.length <= limit) return { text: clean, truncated: false };
  return {
    text: `${clean.slice(0, limit - 3).trimEnd()}...`,
    truncated: true,
  };
}

function isTextMime(mimeType) {
  const mime = normalizeMime(mimeType);
  return mime.startsWith('text/')
    || mime === 'application/json'
    || mime === 'application/xml'
    || mime === 'text/xml'
    || mime === 'application/javascript'
    || mime === 'application/x-javascript';
}

function textFromHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function renderWorkbook(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const chunks = [];
  for (const name of wb.SheetNames.slice(0, 5)) {
    const sheet = wb.Sheets[name];
    const csv = XLSX.utils.sheet_to_csv(sheet, { blankrows: false }).trim();
    if (!csv) continue;
    chunks.push(`Sheet: ${name}\n${csv}`);
  }
  return chunks.join('\n\n');
}

function kindFor({ mimeType, filename } = {}) {
  const mime = normalizeMime(mimeType);
  const ext = normalizeExt(filename);
  if (mime === 'application/pdf' || ext === '.pdf') return 'pdf';
  if (mime === DOCX_MIME || ext === '.docx') return 'docx';
  if (mime === XLSX_MIME || mime === 'application/vnd.ms-excel' || ext === '.xlsx' || ext === '.xls') return 'spreadsheet';
  if (mime === 'text/html' || ext === '.html' || ext === '.htm') return 'html';
  if (isTextMime(mime) || ['.txt', '.md', '.csv', '.json', '.xml', '.log'].includes(ext)) return 'text';
  return 'binary';
}

async function extractTextFromBuffer(buffer, { filename, mimeType } = {}) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { supported: false, kind: 'empty', filename: filename || 'attachment', mimeType: mimeType || null, text: '', note: 'Empty file.' };
  }
  if (buffer.length > MAX_BINARY_BYTES) {
    return {
      supported: false,
      kind: kindFor({ filename, mimeType }),
      filename: filename || 'attachment',
      mimeType: mimeType || null,
      text: '',
      note: 'File is too large to extract safely.',
    };
  }

  const kind = kindFor({ filename, mimeType });
  let rawText = '';

  try {
    if (kind === 'pdf') {
      const parsed = await pdfParse(buffer);
      rawText = parsed && parsed.text ? parsed.text : '';
    } else if (kind === 'docx') {
      const parsed = await mammoth.extractRawText({ buffer });
      rawText = parsed && parsed.value ? parsed.value : '';
    } else if (kind === 'spreadsheet') {
      rawText = renderWorkbook(buffer);
    } else if (kind === 'html') {
      rawText = textFromHtml(buffer.toString('utf8'));
    } else if (kind === 'text') {
      rawText = buffer.toString('utf8');
    } else {
      return {
        supported: false,
        kind,
        filename: filename || 'attachment',
        mimeType: mimeType || null,
        text: '',
        note: 'This file type is not readable as text yet.',
      };
    }
  } catch (err) {
    return {
      supported: false,
      kind,
      filename: filename || 'attachment',
      mimeType: mimeType || null,
      text: '',
      note: `Could not extract text from this file (${err.message}).`,
    };
  }

  const { text, truncated } = truncate(rawText);
  if (!text) {
    return {
      supported: false,
      kind,
      filename: filename || 'attachment',
      mimeType: mimeType || null,
      text: '',
      note: 'No readable text was found in this file.',
    };
  }

  return {
    supported: true,
    kind,
    filename: filename || 'attachment',
    mimeType: mimeType || null,
    text,
    truncated,
    note: truncated ? 'File was truncated to keep the context compact.' : null,
  };
}

function buildAttachmentContext(extracted, { intro } = {}) {
  if (!extracted) return '';
  const lines = [];
  if (intro) lines.push(intro);
  lines.push(`[Attachment: ${extracted.filename || 'attachment'}${extracted.mimeType ? `, ${extracted.mimeType}` : ''}]`);
  if (extracted.supported && extracted.text) {
    lines.push(extracted.text);
    if (extracted.truncated) lines.push('[Attachment text was truncated]');
  } else if (extracted.note) {
    lines.push(`[Attachment note: ${extracted.note}]`);
  }
  return lines.filter(Boolean).join('\n');
}

module.exports = {
  MAX_OUTPUT_CHARS,
  extractTextFromBuffer,
  buildAttachmentContext,
  kindFor,
};
