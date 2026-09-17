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

  // Stay in the call through the NORMAL quiet gaps — admitted early, the client
  // joining a few minutes late, brief silences — instead of leaving and missing
  // the real conversation. Recall's defaults leave too eagerly (≈silence/alone),
  // which is how an admitted bot vanished before the other side joined and came
  // back with a fragment. Leave promptly only once EVERYONE has truly left.
  //
  // EVERY field here must be a documented one, or Recall 400s the WHOLE request:
  // a malformed bot_detection (it needs timeout + activate_after + matches, not
  // just matches) once did exactly that, and the fallback below silently cost us
  // both the leave config AND the bot's logo. So we keep to valid fields only.
  const automatic_leave = {
    waiting_room_timeout: 1800,          // up to 30 min stuck in the waiting room
    noone_joined_timeout: 1800,          // up to 30 min waiting for the other side
    everyone_left_timeout: { timeout: 90, activate_after: 300 }, // 5 min in, then leave 90s after all are gone
    in_call_not_recording_timeout: 3600, // don't bail while not yet recording
    silence_detection: { timeout: 3600, activate_after: 1800 },  // tolerate long silence
  };
  const withLeave = { automatic_leave };

  // Record BOTH: small MIXED AUDIO (`audio_mixed_mp3`) AND the video (which is ON
  // by default — we leave it on as a safety net). recordingUrl() PREFERS audio,
  // so we transcribe the small/fast audio; if the audio is ever missing/bad we
  // fall back to the video. The bug before was requesting the OLD `audio_mixed`
  // key, which this account ignored — so NO audio was made and only the big
  // video existed. `audio_mixed_mp3` is the current key that actually produces it.
  const recFull = { audio_mixed_mp3: {}, transcript: { provider: { meeting_captions: {} } } };
  const transcriptOnly = { ...base, recording_config: { transcript: { provider: { meeting_captions: {} } } }, ...withLeave };
  const audioOnly = { ...base, recording_config: { audio_mixed_mp3: {} } };
  // Last-ditch audio via the OLD key, in case an account/API version rejects the
  // new one — still far better than falling all the way to the video default.
  const audioOldKey = { ...base, recording_config: { audio_mixed: {} } };

  // The Wingman logo, broadcast as the bot's camera — Recall bots join anonymous
  // with no profile picture, so this image is their only "face" in the call
  // (without it Meet shows a bare letter, which is what a client saw). 1280x720
  // jpeg, well under Recall's 1.3MB limit.
  const avatar = botAvatarB64();
  const avatarOut = avatar
    ? { automatic_video_output: { in_call_recording: { kind: 'jpeg', b64_data: avatar } } }
    : null;

  const recLeave = { ...base, recording_config: recFull, ...withLeave };

  // Richest → simplest, dropping ONE optional bit at a time on a 400. The logo is
  // what a client sees, so we try "recording + logo, no leave-config" BEFORE ever
  // giving the logo up — a rejected leave-config must never cost us the logo again.
  const attempts = [];
  if (avatarOut) {
    attempts.push({ ...recLeave, ...avatarOut });                        // rec + leave + logo (best)
    attempts.push({ ...base, recording_config: recFull, ...avatarOut }); // rec + logo (keep logo, drop leave)
  }
  attempts.push(recLeave);                                               // audio + transcript + leave (no logo)
  attempts.push({ ...base, recording_config: recFull });                // audio + transcript
  attempts.push(audioOnly);                                             // audio only (new key, video off)
  attempts.push(audioOldKey);                                           // audio only (old key fallback)
  attempts.push(transcriptOnly);                                        // transcript + leave
  attempts.push(base);                                                  // last resort (video-only default)
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
