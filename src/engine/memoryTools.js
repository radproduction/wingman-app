'use strict';

/**
 * Tools that let the assistant manage what it knows about the user, so
 * "remember that…" and "forget that…" actually stick between conversations.
 * (Facts are also learned passively in the background.)
 */
const memoryTools = [
  {
    name: 'remember_fact',
    description:
      'Save a durable fact about the user so you still know it in future conversations. ' +
      'Use when they tell you something lasting ("remember I prefer morning meetings", ' +
      '"Amir is my business partner", "I run a Shopify store"), or when they CORRECT ' +
      'something you had wrong. Only for things that stay true — not one-off requests, ' +
      'reminders or tasks (those are handled separately).',
    input_schema: {
      type: 'object',
      properties: {
        fact: {
          type: 'string',
          description: 'The fact as a short third-person statement, e.g. "Prefers meetings after 2pm".',
        },
        category: {
          type: 'string',
          enum: ['preference', 'habit', 'relationship', 'project', 'context'],
          description: 'What kind of fact this is.',
        },
      },
      required: ['fact'],
    },
  },
  {
    name: 'forget_fact',
    description:
      'Remove things you remember about the user when they ask you to forget something, ' +
      'or when a saved fact is no longer true. Matches on the text of the fact.',
    input_schema: {
      type: 'object',
      properties: {
        about: { type: 'string', description: 'Word or phrase identifying what to forget, e.g. "morning meetings".' },
      },
      required: ['about'],
    },
  },
  {
    name: 'list_known_facts',
    description:
      'List what you currently remember about the user. Use only when they ask ' +
      '("what do you know about me?", "what have you remembered?").',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

const memoryToolNames = new Set(memoryTools.map((t) => t.name));

module.exports = { memoryTools, memoryToolNames };
