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

const RECALL_KEY = process.env.RECALL_API_KEY || '';
const RECALL_BASE = (process.env.RECALL_API_URL || 'https://us-west-2.recall.ai').replace(/\/+$/, '');
const BOT_NAME = process.env.BOT_NAME || 'Wingman Notetaker';

function enabled() {
  return !!RECALL_KEY;
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
  const body = {
    meeting_url: meetingUrl,
    bot_name: botName,
    // Use the platform's live captions as the transcript source (free). If the
    // account rejects this shape, we still get a recording to fall back on.
    recording_config: { transcript: { provider: { meeting_captions: {} } } },
  };
  if (metadata) body.metadata = metadata;
  try {
    return await api('/bot', { method: 'POST', body });
  } catch (e) {
    // Older/newer accounts may reject recording_config — retry bare.
    if (/recording_config|transcript|provider|400/i.test(e.message)) {
      const bare = { meeting_url: meetingUrl, bot_name: botName };
      if (metadata) bare.metadata = metadata;
      return api('/bot', { method: 'POST', body: bare });
    }
    throw e;
  }
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

/** Download the recording as a buffer (fallback when there's no transcript). */
async function fetchRecording(bot) {
  const url = findMediaUrl(bot);
  if (!url) return null;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`recall recording download ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  let mime = res.headers.get('content-type') || '';
  if (!mime) mime = /\.mp4(\?|$)/i.test(url) ? 'video/mp4' : /\.(m4a|mp3)(\?|$)/i.test(url) ? 'audio/mpeg' : 'audio/ogg';
  return { buffer, mime, url };
}

module.exports = {
  enabled, createBot, getBot, getTranscript, fetchRecording,
  botStatus, isDone, isFatal, assembleTranscript, findMediaUrl, BOT_NAME,
};
