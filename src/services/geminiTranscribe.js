'use strict';

const config = require('../config');

/**
 * Transcribe meeting audio/video with Gemini (multimodal). Handles mixed Roman
 * Urdu + English and keeps Roman Urdu in Latin script, which suits how these
 * users actually speak. Returns the plain transcript text.
 *
 * Small files go inline; anything bigger (a long meeting, or a whole video
 * recording) is UPLOADED via the Gemini Files API and referenced by URI — inline
 * data is capped at ~20MB per request, which is why big recordings used to come
 * back empty. Video is fine too: Gemini transcribes the audio track directly.
 *
 * @param {Buffer} audio      raw audio/video bytes
 * @param {string} mimeType   e.g. 'audio/mp4', 'audio/ogg', 'video/mp4'
 * @returns {Promise<string>} transcript
 */

const GEMINI_BASE = 'https://generativelanguage.googleapis.com';
// Inline data must keep the WHOLE request under ~20MB, and base64 inflates by
// ~33%, so cap the inline path well below that and send bigger files via upload.
const INLINE_LIMIT = 12 * 1024 * 1024;

const PROMPT =
  'Transcribe this meeting recording verbatim (it may be audio or video — use the ' +
  'audio). The speakers may mix Roman Urdu and English — keep Roman Urdu written in ' +
  'Latin/Roman script (do NOT convert to Urdu or Devanagari script). Output ONLY the ' +
  'transcript text, no headings or commentary.';

function key() {
  return encodeURIComponent(config.gemini.apiKey);
}

/**
 * The actual generateContent call. Thinking is turned OFF (a 2.5 flash otherwise
 * spends the output budget "thinking" and returns an empty transcript) and the
 * output budget is large (full meetings are long). Retries once without the
 * thinking field if a model rejects it. Throws with the finishReason on empty.
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
  if (!text) {
    const reason =
      (cand && cand.finishReason) ||
      (data.promptFeedback && data.promptFeedback.blockReason) ||
      'unknown';
    throw new Error(`gemini_empty_transcript (finish: ${reason})`);
  }
  return text;
}

/**
 * Upload a big recording via the resumable Files API and wait until Gemini has
 * finished processing it (video/audio go PROCESSING → ACTIVE). Returns the File
 * object ({ name, uri, state }).
 */
async function uploadFile(buffer, mimeType) {
  // 1) Start a resumable upload — the response header carries the upload URL.
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

  // 2) Send the bytes and finalize.
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

  // 3) Wait for ACTIVE — a video/audio file is unusable until Gemini processes it.
  let file = upData.file;
  const deadline = Date.now() + 6 * 60 * 1000; // up to 6 min for a long recording
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

async function transcribe(audio, mimeType) {
  if (!config.gemini.apiKey) throw new Error('GEMINI_NOT_CONFIGURED');
  if (!Buffer.isBuffer(audio) || !audio.length) throw new Error('EMPTY_AUDIO');
  const mt = mimeType || 'audio/webm';

  // Small enough → inline (one round-trip, fastest).
  if (audio.length <= INLINE_LIMIT) {
    return generate([
      { text: PROMPT },
      { inline_data: { mime_type: mt, data: audio.toString('base64') } },
    ]);
  }

  // Big recording (long meeting or a whole video) → upload, reference by URI,
  // then clean the uploaded file up afterwards.
  const file = await uploadFile(audio, mt);
  try {
    return await generate([
      { text: PROMPT },
      { file_data: { mime_type: mt, file_uri: file.uri } },
    ]);
  } finally {
    await deleteFile(file.name);
  }
}

function enabled() {
  return !!config.gemini.apiKey;
}

module.exports = { transcribe, enabled };
