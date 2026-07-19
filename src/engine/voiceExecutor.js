'use strict';

const voice = require('../services/voice');
const usersRepo = require('../db/users');

const VALID_REPLIES = new Set(['off', 'on_voice', 'always']);

/** Execute the voice-preference tool. Never throws — errors become {error}. */
async function executeVoiceTool(user, toolUse) {
  const { name, input } = toolUse;
  if (name !== 'set_voice') return { error: `Unknown tool: ${name}` };

  const patch = {};
  let chosenVoice = null;

  if (input.voice) {
    const resolved = voice.resolveVoice(input.voice);
    if (!resolved) return { error: 'INVALID_VOICE', detail: 'Choose male, female or neutral.' };
    patch.voice_name = resolved;
    chosenVoice = input.voice;
  }

  if (input.replies) {
    if (!VALID_REPLIES.has(input.replies)) {
      return { error: 'INVALID_SETTING', detail: "Choose 'off', 'on_voice' or 'always'." };
    }
    patch.voice_replies = input.replies;
  }

  if (!Object.keys(patch).length) {
    return { error: 'NOTHING_TO_CHANGE', detail: 'Specify a voice and/or when to send voice replies.' };
  }

  usersRepo.update(user.id, patch);
  return {
    updated: true,
    voice: chosenVoice || undefined,
    replies: input.replies || undefined,
    // So the assistant can warn them they won't actually hear it.
    voice_available: voice.enabled(),
  };
}

module.exports = { executeVoiceTool };
