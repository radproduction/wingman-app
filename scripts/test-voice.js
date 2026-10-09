'use strict';
/**
 * Live check of the ElevenLabs voice — nothing is sent on WhatsApp.
 *   docker exec wingman node scripts/test-voice.js
 * Confirms the key works and that voice notes come back as Ogg/Opus.
 */
const el = require('../src/services/elevenlabs');
const config = require('../src/config');

(async () => {
  if (!config.elevenlabs.apiKey) throw new Error('ELEVENLABS_API_KEY is not set');
  const sub = await el.call('GET', '/v1/user/subscription');
  console.log('plan:', sub.tier, '| characters used:', sub.character_count, '/', sub.character_limit);
  const { buffer, mimeType } = await el.speak("Good morning Aamir. You've got three meetings today, the first at ten with Sara. Two emails need a reply, and your K-Electric bill is due tomorrow.");
  console.log('voice note:', mimeType, Math.round(buffer.length / 1024), 'KB', mimeType === 'audio/ogg' ? '(WhatsApp voice note ✓)' : '(sent as audio file)');
  const heard = await require('../src/services/voice').transcribe(buffer, { filename: 'voice.ogg' });
  console.log('heard back (speech-to-text):', heard);
  if (config.elevenlabs.agentId) {
    const a = await el.call('GET', `/v1/convai/agents/${config.elevenlabs.agentId}`);
    console.log('agent:', a.name, '| calls on:', config.elevenlabs.callsReady);
  } else {
    console.log('agent: not set up yet (run scripts/setup-voice-agent.js)');
  }
})().catch((e) => { console.error('FAILED:', e.message); process.exit(1); });
