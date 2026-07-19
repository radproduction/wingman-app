'use strict';

const config = require('../config');

/**
 * Voice for WhatsApp: OpenAI Whisper turns the user's voice note into text, and
 * OpenAI TTS turns Wingman's reply back into a voice note.
 *
 * Whisper is used rather than a language-locked engine because users here mix
 * Roman Urdu and English in the same sentence, which it handles well.
 */

const API = 'https://api.openai.com/v1';

function keyOrThrow() {
  if (!config.voice.apiKey) throw new Error('VOICE_NOT_CONFIGURED');
  return config.voice.apiKey;
}

function enabled() {
  return !!config.voice.apiKey;
}

/** Map OpenAI failures to something we can act on / explain. */
function friendlyError(status, body) {
  const msg = (body && body.error && body.error.message) || `HTTP ${status}`;
  if (status === 401) return 'VOICE_BAD_KEY';
  if (status === 429 && /quota|billing/i.test(msg)) return 'VOICE_NO_CREDIT';
  if (status === 429) return 'VOICE_RATE_LIMITED';
  return msg;
}

/**
 * Transcribe a voice note.
 *
 * @param {Buffer} audio     raw audio bytes (WhatsApp sends OGG/Opus)
 * @param {Object} [opts]
 * @param {string} [opts.filename]
 * @returns {Promise<string>} the transcript
 */
async function transcribe(audio, { filename = 'voice.ogg' } = {}) {
  const key = keyOrThrow();
  const form = new FormData();
  // Whisper infers the format from the FILENAME, and rejects ".opus" even
  // though the bytes are fine — WhatsApp voice notes must be sent as ".ogg".
  form.append('file', new Blob([audio]), filename);
  form.append('model', config.voice.sttModel);

  // Users here speak Roman Urdu mixed with English. Left alone, Whisper
  // "corrects" that into Urdu script (and a Roman-only prompt pushes it into
  // Devanagari). Pinning the language to Latin script AND seeding the prompt
  // with real Roman Urdu keeps the transcript in the script they actually type,
  // which in turn keeps the assistant replying in Roman Urdu.
  form.append('language', config.voice.sttLanguage);
  form.append('prompt', 'Bhai kal teen baje meeting rakh do. Mujhe email bhej dena. Traffic kaisa hai? Aaj sales kaisi rahi?');

  const res = await fetch(`${API}/audio/transcriptions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(friendlyError(res.status, data));
  return (data.text || '').trim();
}

/** Strip things that sound wrong when read aloud (emoji, markdown, links). */
function cleanForSpeech(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/g, 'the link I sent')
    .replace(/[*_~`#]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\n{2,}/g, '. ')
    .replace(/\n/g, '. ')
    .trim();
}

/**
 * Turn a reply into speech.
 *
 * WhatsApp voice notes must be OGG/Opus, which is what we request.
 * Long replies are trimmed — nobody wants a three-minute voice note.
 *
 * @returns {Promise<Buffer>} OGG/Opus audio
 */
async function speak(text, { voice } = {}) {
  const key = keyOrThrow();
  const spoken = cleanForSpeech(text).slice(0, 900);
  if (!spoken) throw new Error('VOICE_EMPTY_TEXT');

  const res = await fetch(`${API}/audio/speech`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.voice.ttsModel,
      voice: voice || config.voice.ttsVoice,
      input: spoken,
      response_format: 'opus',
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(friendlyError(res.status, data));
  }
  return Buffer.from(await res.arrayBuffer());
}

/**
 * Should we reply with a voice note?
 * 'off' never, 'on_voice' only when they spoke to us, 'always' every time.
 */
function shouldSpeak(user, incomingWasVoice) {
  const pref = (user && user.voice_replies) || 'on_voice';
  if (!enabled() || pref === 'off') return false;
  if (pref === 'always') return true;
  return !!incomingWasVoice;
}

/**
 * The voices we offer. All verified working against the TTS model; kept to a
 * clear male/female choice rather than exposing raw provider names.
 */
const VOICE_OPTIONS = [
  { id: 'onyx', gender: 'male', label: 'Male — deep' },
  { id: 'echo', gender: 'male', label: 'Male — clear' },
  { id: 'nova', gender: 'female', label: 'Female — warm' },
  { id: 'shimmer', gender: 'female', label: 'Female — soft' },
  { id: 'alloy', gender: 'neutral', label: 'Neutral' },
];

const DEFAULT_BY_GENDER = { male: 'onyx', female: 'nova', neutral: 'alloy' };

function isValidVoice(id) {
  return VOICE_OPTIONS.some((v) => v.id === id);
}

/** Resolve "male"/"female"/"neutral" or an exact voice id to a voice id. */
function resolveVoice(input) {
  const v = String(input || '').trim().toLowerCase();
  if (DEFAULT_BY_GENDER[v]) return DEFAULT_BY_GENDER[v];
  if (isValidVoice(v)) return v;
  return null;
}

/** The voice a given user's replies should be read in. */
function voiceFor(user) {
  const chosen = user && user.voice_name;
  return isValidVoice(chosen) ? chosen : config.voice.ttsVoice;
}

module.exports = {
  enabled, transcribe, speak, shouldSpeak, cleanForSpeech,
  VOICE_OPTIONS, resolveVoice, isValidVoice, voiceFor,
};
