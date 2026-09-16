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

  const contents = [
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
  ];

  // A full meeting transcript is long, so give it plenty of output room — the
  // default cap (~8k) truncates or, worse, returns nothing.
  const baseGen = { temperature: 0, maxOutputTokens: 65536 };

  // Gemini 2.5 "flash" (what gemini-flash-latest now points to) THINKS by
  // default, and those thinking tokens are drawn from the SAME output budget —
  // so for anything past a few seconds the model spends the budget thinking and
  // returns an EMPTY transcript (finishReason MAX_TOKENS). Transcription needs
  // no reasoning, so turn thinking off. Older models ignore the field; if one
  // ever rejects it (400), we retry without it.
  async function call(withThinking) {
    const generationConfig = withThinking
      ? { ...baseGen, thinkingConfig: { thinkingBudget: 0 } }
      : baseGen;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents, generationConfig }),
    });
    const data = await res.json().catch(() => ({}));
    return { res, data };
  }

  let { res, data } = await call(true);
  // Only the thinking field could make an otherwise-valid request 400 — retry
  // once without it before giving up.
  if (!res.ok && res.status === 400 && /thinking|generationConfig|unknown|unexpected/i.test(JSON.stringify(data))) {
    ({ res, data } = await call(false));
  }
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `HTTP ${res.status}`;
    throw new Error(`gemini_${res.status}: ${msg}`);
  }

  const cand = data.candidates && data.candidates[0];
  const parts = cand && cand.content && cand.content.parts;
  const text = (parts || []).map((p) => p && p.text).filter(Boolean).join('\n').trim();
  if (!text) {
    // Surface WHY it was empty (finishReason / block reason) so this is never a
    // blind failure again — MAX_TOKENS points at budget, SAFETY at a block.
    const reason =
      (cand && cand.finishReason) ||
      (data.promptFeedback && data.promptFeedback.blockReason) ||
      'unknown';
    throw new Error(`gemini_empty_transcript (finish: ${reason})`);
  }
  return text;
}

function enabled() {
  return !!config.gemini.apiKey;
}

module.exports = { transcribe, enabled };
