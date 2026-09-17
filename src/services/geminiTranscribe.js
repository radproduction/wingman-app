'use strict';

const config = require('../config');

/**
 * Transcribe meeting audio/video with Gemini (multimodal). Handles mixed Roman
 * Urdu + English and keeps Roman Urdu in Latin script.
 *
 * Sizes/lengths handled:
 *  - Small clip → inline, one call.
 *  - Big file (long meeting, or a video) → uploaded via the Files API and
 *    referenced by URI (inline is capped ~20MB).
 *  - VERY long meeting (hours) → the single-shot transcript can exceed Gemini's
 *    per-response output cap and come back truncated (finishReason MAX_TOKENS).
 *    We detect that and re-transcribe in TIME SEGMENTS, concatenating them, so a
 *    5-hour meeting loses nothing. Normal meetings never hit this path.
 *
 * @param {Buffer} audio      raw audio/video bytes
 * @param {string} mimeType   e.g. 'audio/mp4', 'audio/ogg', 'video/mp4'
 * @returns {Promise<string>} transcript
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
const INLINE_LIMIT = 12 * 1024 * 1024; // keep the whole inline request under ~20MB
const SEGMENT_MIN = 40;                 // segment length when a long meeting is split
const MAX_SEGMENTS = 12;                // safety cap: 12 × 40min = 8 hours

const PROMPT =
  'Transcribe this meeting recording verbatim (it may be audio or video — use the ' +
  'audio). The speakers may mix Roman Urdu and English — keep Roman Urdu written in ' +
  'Latin/Roman script (do NOT convert to Urdu or Devanagari). Output ONLY the ' +
  'transcript text, no headings or commentary.';

function key() {
  return encodeURIComponent(config.gemini.apiKey);
}

function fmtClock(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hh = Math.floor(s / 3600);
  const mm = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n) => String(n).padStart(2, '0');
  return hh ? `${p(hh)}:${p(mm)}:${p(ss)}` : `${p(mm)}:${p(ss)}`;
}

/**
 * One generateContent call. Thinking is OFF (a 2.5 flash otherwise spends the
 * output budget "thinking" and returns nothing) and the output budget is large.
 * Retries once without the thinking field if a model rejects it. Returns
 * { text, finishReason }; throws only on an HTTP error.
 */
async function generate(parts) {
  const url = `${GEMINI_BASE}/v1beta/models/${config.gemini.model}:generateContent?key=${key()}`;
  const contents = [{ parts }];
  const baseGen = { temperature: 0, maxOutputTokens: 65536 };

  async function call(withThinking) {
    const generationConfig = withThinking ? { ...baseGen, thinkingConfig: { thinkingBudget: 0 } } : baseGen;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  let { res, data } = await call(true);
  if (!res.ok && res.status === 400 && /thinking|generationConfig|unknown|unexpected/i.test(JSON.stringify(data))) {
    ({ res, data } = await call(false));
  }
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `HTTP ${res.status}`;
    throw new Error(`gemini_${res.status}: ${msg}`);
  }

  const cand = data.candidates && data.candidates[0];
  const p = cand && cand.content && cand.content.parts;
  const text = (p || []).map((x) => x && x.text).filter(Boolean).join('\n').trim();
  const finishReason =
    (cand && cand.finishReason) ||
    (data.promptFeedback && data.promptFeedback.blockReason) ||
    '';
  return { text, finishReason };
}

/**
 * Upload a big recording via the resumable Files API and wait until ACTIVE
 * (video/audio must process first). Returns the File object ({ name, uri, state }).
 */
async function uploadFile(buffer, mimeType) {
  const start = await fetch(`${GEMINI_BASE}/upload/v1beta/files?key=${key()}`, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Protocol': 'resumable',
      'X-Goog-Upload-Command': 'start',
      'X-Goog-Upload-Header-Content-Length': String(buffer.length),
      'X-Goog-Upload-Header-Content-Type': mimeType,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file: { display_name: 'meeting' } }),
  });
  if (!start.ok) throw new Error(`gemini_upload_start_${start.status}`);
  const uploadUrl = start.headers.get('x-goog-upload-url');
  if (!uploadUrl) throw new Error('gemini_no_upload_url');

  const up = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Length': String(buffer.length),
      'X-Goog-Upload-Offset': '0',
      'X-Goog-Upload-Command': 'upload, finalize',
    },
    body: buffer,
  });
  const upData = await up.json().catch(() => ({}));
  if (!up.ok || !upData.file) throw new Error(`gemini_upload_${up.status}`);

  let file = upData.file;
  const deadline = Date.now() + 10 * 60 * 1000; // up to 10 min for a long recording
  while (file.state === 'PROCESSING' && Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3000));
    const st = await fetch(`${GEMINI_BASE}/v1beta/${file.name}?key=${key()}`);
    file = await st.json().catch(() => file);
  }
  if (file.state !== 'ACTIVE') throw new Error(`gemini_file_not_active_${file.state || 'unknown'}`);
  return file;
}

async function deleteFile(name) {
  if (!name) return;
  try { await fetch(`${GEMINI_BASE}/v1beta/${name}?key=${key()}`, { method: 'DELETE' }); }
  catch (_) { /* best-effort cleanup */ }
}

/**
 * Transcribe a very long recording in fixed TIME SEGMENTS, so no single response
 * has to hold the whole (cap-exceeding) transcript. Walks 40-min windows until a
 * window has no speech (past the end). Returns the concatenated transcript.
 */
async function transcribeSegmented(fileUri, mimeType) {
  const out = [];
  for (let i = 0; i < MAX_SEGMENTS; i += 1) {
    const startSec = i * SEGMENT_MIN * 60;
    const endSec = (i + 1) * SEGMENT_MIN * 60;
    const segPrompt =
      `Transcribe ONLY the spoken audio between ${fmtClock(startSec)} and ${fmtClock(endSec)} ` +
      'of this recording, verbatim. Mixed Roman Urdu + English — keep Roman Urdu in Latin/Roman ' +
      'script. If there is NO speech in that time range (the recording is shorter than that), ' +
      'reply with exactly: NONE. Output only the transcript text, nothing else.';
    let text = '';
    try {
      ({ text } = await generate([{ text: segPrompt }, { file_data: { mime_type: mimeType, file_uri: fileUri } }]));
    } catch (e) {
      console.warn(`[geminiTranscribe] segment ${i} failed:`, e.message);
      break; // stop on error; return what we have so far
    }
    const clean = String(text || '').trim();
    if (!clean || /^none[.!]?$/i.test(clean)) break; // past the end of the recording
    out.push(clean);
  }
  return out.join('\n').trim();
}

async function transcribe(audio, mimeType) {
  if (!config.gemini.apiKey) throw new Error('GEMINI_NOT_CONFIGURED');
  if (!Buffer.isBuffer(audio) || !audio.length) throw new Error('EMPTY_AUDIO');
  const mt = mimeType || 'audio/webm';

  // Small enough → inline, one round-trip.
  if (audio.length <= INLINE_LIMIT) {
    const { text, finishReason } = await generate([
      { text: PROMPT },
      { inline_data: { mime_type: mt, data: audio.toString('base64') } },
    ]);
    if (!text) throw new Error(`gemini_empty_transcript (finish: ${finishReason || 'unknown'})`);
    return text;
  }

  // Big recording → upload once, reference by URI.
  const file = await uploadFile(audio, mt);
  try {
    const { text, finishReason } = await generate([
      { text: PROMPT },
      { file_data: { mime_type: mt, file_uri: file.uri } },
    ]);

    // A long meeting's transcript can exceed the per-response output cap and come
    // back cut off (MAX_TOKENS) — or empty. Redo it in time segments so nothing
    // is lost. Normal-length meetings finish as STOP and never reach this.
    if (finishReason === 'MAX_TOKENS' || !text) {
      console.warn(`[geminiTranscribe] single-shot finish=${finishReason || 'empty'} — transcribing in segments`);
      const seg = await transcribeSegmented(file.uri, mt);
      if (seg) return seg;
      if (text) return text; // better a truncated real transcript than nothing
      throw new Error(`gemini_empty_transcript (finish: ${finishReason || 'unknown'})`);
    }
    return text;
  } finally {
    await deleteFile(file.name);
  }
}

function enabled() {
  return !!config.gemini.apiKey;
}

module.exports = { transcribe, enabled };
