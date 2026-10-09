'use strict';

/**
 * ElevenLabs REST client — only what Wingman uses:
 *   - speak(text)                     → a WhatsApp voice note (Ogg/Opus)
 *   - startWhatsAppCall(...)          → the agent calls the user on WhatsApp
 *   - getConversation(id)             → how that call went
 * Never logs the API key. Errors are thrown as Error('ELEVENLABS_<status>: …').
 */

const config = require('../config');

function key() {
  const k = config.elevenlabs.apiKey;
  if (!k) throw new Error('ELEVENLABS_NOT_CONFIGURED');
  return k;
}

function url(path) {
  return `${String(config.elevenlabs.baseUrl).replace(/\/+$/, '')}${path}`;
}

async function call(method, path, body, { raw = false } = {}) {
  const res = await fetch(url(path), {
    method,
    headers: {
      'xi-api-key': key(),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let detail = '';
    try { detail = JSON.stringify(await res.json()).slice(0, 400); } catch (_) { /* not json */ }
    throw new Error(`ELEVENLABS_${res.status}${detail ? `: ${detail}` : ''}`);
  }
  if (raw) return res;
  const text = await res.text();
  return text ? JSON.parse(text) : {};
}

/** Strip what sounds wrong read aloud: emoji, markdown, raw links. */
function forSpeech(text) {
  return String(text || '')
    .replace(/https?:\/\/\S+/g, 'the link in the chat')
    .replace(/[*_~`#>]/g, '')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}]/gu, '')
    .replace(/^\s*[•·\-–]\s*/gm, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\n{2,}/g, '.\n')
    .trim();
}

/**
 * Text → WhatsApp voice note. Asks for Ogg/Opus (what WhatsApp plays as a
 * voice note); if the response isn't Ogg, falls back to MP3, which WhatsApp
 * still delivers as an audio message.
 * @returns {Promise<{buffer: Buffer, mimeType: string}>}
 */
async function speak(text, { voiceId = config.elevenlabs.voiceId, maxChars = 2500 } = {}) {
  const spoken = forSpeech(text).slice(0, maxChars);
  if (!spoken) throw new Error('ELEVENLABS_EMPTY_TEXT');
  const body = { text: spoken, model_id: config.elevenlabs.ttsModel };
  const path = (fmt) => `/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${fmt}`;

  const res = await call('POST', path('opus_48000_64'), body, { raw: true });
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length > 4 && buffer.slice(0, 4).toString('ascii') === 'OggS') {
    return { buffer, mimeType: 'audio/ogg' };
  }
  const mp3 = await call('POST', path('mp3_44100_128'), body, { raw: true });
  return { buffer: Buffer.from(await mp3.arrayBuffer()), mimeType: 'audio/mpeg' };
}

/**
 * Ask the Wingman agent to call a user on WhatsApp. If the user hasn't given
 * call permission yet, ElevenLabs first sends the permission template and calls
 * as soon as they allow it.
 * @returns {Promise<{conversationId: string|null, message: string}>}
 */
async function startWhatsAppCall({ waUserId, dynamicVariables = {}, language = null, firstMessage = null }) {
  const cfg = config.elevenlabs;
  if (!cfg.agentId) throw new Error('ELEVENLABS_AGENT_ID_MISSING');
  if (!cfg.callPhoneNumberId) throw new Error('ELEVENLABS_CALL_NUMBER_MISSING');
  const override = {};
  if (language || firstMessage) {
    override.agent = {};
    if (language) override.agent.language = language;
    if (firstMessage) override.agent.first_message = firstMessage;
  }
  const r = await call('POST', '/v1/convai/whatsapp/outbound-call', {
    agent_id: cfg.agentId,
    whatsapp_phone_number_id: cfg.callPhoneNumberId,
    whatsapp_user_id: String(waUserId).replace(/\D/g, ''),
    whatsapp_call_permission_request_template_name: cfg.callPermissionTemplate,
    whatsapp_call_permission_request_template_language_code: cfg.callPermissionTemplateLang,
    conversation_initiation_client_data: {
      dynamic_variables: dynamicVariables,
      ...(Object.keys(override).length ? { conversation_config_override: override } : {}),
    },
  });
  if (r && r.success === false) throw new Error(`ELEVENLABS_CALL_REFUSED: ${r.message || ''}`);
  return { conversationId: (r && r.conversation_id) || null, message: (r && r.message) || '' };
}

/** Status + metadata + transcript of one conversation (call). */
async function getConversation(conversationId) {
  return call('GET', `/v1/convai/conversations/${encodeURIComponent(conversationId)}`);
}

module.exports = { speak, startWhatsAppCall, getConversation, forSpeech, call };
