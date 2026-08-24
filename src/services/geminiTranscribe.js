'use strict';

const config = require('../config');

/**
 * Transcribe meeting audio with Gemini (multimodal). Gemini handles mixed
 * Roman Urdu + English well and keeps Roman Urdu in Latin script, which suits
 * how these users actually speak. Returns the plain transcript text.
 *
 * @param {Buffer} audio      raw audio bytes
 * @param {string} mimeType   e.g. 'audio/webm', 'audio/mp4', 'audio/ogg'
 * @returns {Promise<string>} transcript
 */
async function transcribe(audio, mimeType) {
  if (!config.gemini.apiKey) throw new Error('GEMINI_NOT_CONFIGURED');
  if (!Buffer.isBuffer(audio) || !audio.length) throw new Error('EMPTY_AUDIO');

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent` +
    `?key=${encodeURIComponent(config.gemini.apiKey)}`;

  const body = {
    contents: [
      {
        parts: [
          {
            text:
              'Transcribe this meeting audio verbatim. The speakers may mix Roman Urdu and ' +
              'English — keep Roman Urdu written in Latin/Roman script (do NOT convert to Urdu ' +
              'or Devanagari script). Output ONLY the transcript text, no headings or commentary.',
          },
          { inline_data: { mime_type: mimeType || 'audio/webm', data: audio.toString('base64') } },
        ],
      },
    ],
    generationConfig: { temperature: 0 },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `HTTP ${res.status}`;
    throw new Error(`gemini_${res.status}: ${msg}`);
  }
  const parts = data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts;
  const text = (parts || []).map((p) => p && p.text).filter(Boolean).join('\n').trim();
  if (!text) throw new Error('gemini_empty_transcript');
  return text;
}

function enabled() {
  return !!config.gemini.apiKey;
}

module.exports = { transcribe, enabled };
