'use strict';

/**
 * Lets the user change how Wingman sounds without leaving the chat —
 * "use a male voice", "female voice mein baat karo", "stop sending voice notes".
 */
const voiceTools = [
  {
    name: 'set_voice',
    description:
      'Change the voice Wingman speaks in, or turn spoken replies on/off. ' +
      'Use when the user asks for a male/female voice, or asks you to stop or ' +
      'start replying with voice notes. Confirm the change afterwards.',
    input_schema: {
      type: 'object',
      properties: {
        voice: {
          type: 'string',
          enum: ['male', 'female', 'neutral'],
          description: 'Which voice to speak in.',
        },
        replies: {
          type: 'string',
          enum: ['off', 'on_voice', 'always'],
          description:
            "When to send voice notes: 'off' never, 'on_voice' only when the user " +
            "sends voice (the default), 'always' every reply.",
        },
      },
      required: [],
    },
  },
];

const voiceToolNames = new Set(voiceTools.map((t) => t.name));

module.exports = { voiceTools, voiceToolNames };
