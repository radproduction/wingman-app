'use strict';

/**
 * Recall.ai client — Recall runs the meeting bots for us (Google Meet / Zoom /
 * Teams). We create a bot for a meeting URL; Recall's bot joins + records; we
 * poll it (see recallPoll.js) and, when it's done, pull the transcript (or the
 * audio) and run it through our existing meeting pipeline.
 *
 * Config (backend .env):
 *   RECALL_API_KEY   — required to enable Recall
 *   RECALL_API_URL   — your region base, e.g. https://us-east-1.recall.ai
 *                      (find it in the Recall dashboard; default us-west-2)
 *   BOT_NAME         — display name in the call (default "Wingman Notetaker")
 *
 * NOTE: Recall's request/response shapes vary a little by account/API version.
 * createBot sends the minimal documented body; the readers below scan the bot
 * object defensively so small shape differences don't break us.
 */

const fs = require('fs');
const path = require('path');

const RECALL_KEY = process.env.RECALL_API_KEY || '';
const RECALL_BASE = (process.env.RECALL_API_URL || 'https://us-west-2.recall.ai').replace(/\/+$/, '');
const BOT_NAME = process.env.BOT_NAME || 'Wingman Notetaker';

function enabled() {
  return !!RECALL_KEY;
}

// The bot's video-tile image (Wingman logo, 1280x720 jpeg). Recall broadcasts it
// as the bot's camera so the call shows the logo instead of a letter avatar.
// Cached after first read; null if the file is missing.
let _avatar;
function botAvatarB64() {
  if (_avatar === undefined) {
    try { _avatar = fs.readFileSync(path.join(__dirname, '..', 'assets', 'bot-avatar.jpg')).toString('base64'); }
    catch (_) { _avatar = ''; }
  }
  return _avatar || null;
}

async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${RECALL_BASE}/api/v1${path}`, {
    method,
    headers: {
      authorization: `Token ${RECALL_KEY}`,
      'content-type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }
  if (!res.ok) {
    const detail = typeof data === 'string' ? data : JSON.stringify(data);
    throw new Error(`recall ${method} ${path} → ${res.status} ${String(detail).slice(0, 300)}`);
  }
  return data;
}

/**
 * Send a bot to a meeting. Requests transcription via the meeting's own captions
 * (no extra provider cost, follows the meeting language). Returns the bot object
 * (at least { id }).
 */
async function createBot({ meetingUrl, botName = BOT_NAME, metadata } = {}) {
  if (!meetingUrl) throw new Error('meetingUrl required');
  const base = { meeting_url: meetingUrl, bot_name: botName };
  if (metadata) base.metadata = metadata;

  // Record a clean MIXED AUDIO file — small and reliable to transcribe — and ALSO
  // ask for a caption transcript. audio_mixed is what we actually feed to the
  // transcriber; the default video-only recording is a big mp4 our transcriber
  // handles poorly (that's what made real meetings come back empty/garbled).
  const recFull = { audio_mixed: {}, transcript: { provider: { meeting_captions: {} } } };
  const withRec = { ...base, recording_config: recFull };
  const transcriptOnly = { ...base, recording_config: { transcript: { provider: { meeting_captions: {} } } } };
  const avatar = botAvatarB64();
  const full = avatar
    ? { ...withRec, automatic_video_output: { in_call_recording: { kind: 'jpeg', b64_data: avatar } } }
    : withRec;

  // Try the richest config first, then progressively drop optional bits if the
  // account/API version rejects a field (400) — so a bot is always created.
  const attempts = [full, withRec, transcriptOnly, base];
  let lastErr;
  for (const body of attempts) {
    try {
      return await api('/bot', { method: 'POST', body });
    } catch (e) {
      lastErr = e;
      // Only fall back on a request-shape rejection; auth/other errors throw.
      if (!/\b400\b|invalid|unrecognized|unexpected|not allowed|unsupported/i.test(e.message)) throw e;
    }
  }
  throw lastErr;
}

async function getBot(botId) {
  return api(`/bot/${botId}`);
}

/** Coarse lifecycle status from the bot object (latest status_changes entry). */
function botStatus(bot) {
  if (!bot) return 'unknown';
  if (Array.isArray(bot.status_changes) && bot.status_changes.length) {
    const last = bot.status_changes[bot.status_changes.length - 1];
    return (last && (last.code || last.status)) || 'unknown';
  }
  if (bot.status && typeof bot.status === 'object') return bot.status.code || 'unknown';
  return bot.status || 'unknown';
}

const DONE_STATES = new Set(['done', 'call_ended', 'analysis_done', 'media_available']);
const FATAL_STATES = new Set(['fatal', 'error', 'call_error', 'permission_denied']);
function isDone(status) { return DONE_STATES.has(String(status)); }
function isFatal(status) { return FATAL_STATES.has(String(status)); }

/**
 * Fetch + assemble the transcript text for a bot. Tries the transcript endpoint,
 * then a transcript field on the bot. Returns '' when none is available yet.
 */
async function getTranscript(botId) {
  let raw = null;
  try { raw = await api(`/bot/${botId}/transcript`); }
  catch (_) { /* endpoint may differ; fall through */ }
  if (!raw) {
    try { const bot = await getBot(botId); raw = bot && (bot.transcript || bot.transcripts); } catch (_) { /* ignore */ }
  }
  return assembleTranscript(raw);
}

/** Turn Recall's transcript payload (segments of words, various shapes) into
 *  plain "Speaker: text" lines. Tolerant of shape differences. */
function assembleTranscript(raw) {
  if (!raw) return '';
  if (typeof raw === 'string') return raw.trim();
  const segments = Array.isArray(raw) ? raw : (Array.isArray(raw.transcript) ? raw.transcript : []);
  const lines = [];
  for (const seg of segments) {
    if (!seg) continue;
    const speaker = seg.speaker || seg.participant?.name || seg.participant || '';
    let text = '';
    if (typeof seg.text === 'string') text = seg.text;
    else if (Array.isArray(seg.words)) text = seg.words.map((w) => (typeof w === 'string' ? w : (w && w.text) || '')).join(' ');
    text = String(text).replace(/\s+/g, ' ').trim();
    if (text) lines.push(speaker ? `${speaker}: ${text}` : text);
  }
  return lines.join('\n').trim();
}

/** Recursively find the first plausible media (audio/video) download URL. */
function findMediaUrl(obj, depth = 0) {
  if (!obj || depth > 7) return null;
  if (Array.isArray(obj)) {
    for (const x of obj) { const u = findMediaUrl(x, depth + 1); if (u) return u; }
    return null;
  }
  if (typeof obj === 'object') {
    for (const k of ['download_url', 'url', 'audio_url', 'video_url']) {
      const v = obj[k];
      if (typeof v === 'string' && /^https?:\/\//.test(v) && /\.(m4a|mp3|wav|ogg|opus|webm|mp4)(\?|$)/i.test(v)) return v;
    }
    for (const k of Object.keys(obj)) { const u = findMediaUrl(obj[k], depth + 1); if (u) return u; }
  }
  return null;
}

/**
 * Pick the best recording download URL from the bot, PREFERRING mixed audio over
 * mixed video (audio transcribes far more reliably and is much smaller). Reads
 * Recall's recordings[].media_shortcuts.{audio_mixed|video_mixed}.data.download_url,
 * then falls back to a generic media scan.
 * @returns {{url:string, kind:string}|null}
 */
function recordingUrl(bot) {
  const recs = Array.isArray(bot && bot.recordings) ? bot.recordings : [];
  for (const kind of ['audio_mixed', 'video_mixed']) {
    for (const r of recs) {
      const sc = r && r.media_shortcuts && r.media_shortcuts[kind];
      const url = sc && sc.data && sc.data.download_url;
      if (typeof url === 'string' && /^https?:\/\//.test(url)) return { url, kind };
    }
  }
  const scan = findMediaUrl(bot);
  return scan ? { url: scan, kind: 'scan' } : null;
}

/** Download the recording as a buffer (fallback when there's no transcript). */
async function fetchRecording(bot) {
  const picked = recordingUrl(bot);
  if (!picked) return null;
  const res = await fetch(picked.url);
  if (!res.ok) throw new Error(`recall recording download ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  let mime = res.headers.get('content-type') || '';
  if (!mime || /octet-stream/i.test(mime)) {
    if (picked.kind === 'audio_mixed') mime = /\.mp3(\?|$)/i.test(picked.url) ? 'audio/mpeg' : 'audio/mp4';
    else mime = /\.mp4(\?|$)/i.test(picked.url) ? 'video/mp4' : /\.(m4a|mp3)(\?|$)/i.test(picked.url) ? 'audio/mpeg' : 'audio/ogg';
  }
  return { buffer, mime, url: picked.url, kind: picked.kind };
}

module.exports = {
  enabled, createBot, getBot, getTranscript, fetchRecording, recordingUrl,
  botStatus, isDone, isFatal, assembleTranscript, findMediaUrl, BOT_NAME,
};
