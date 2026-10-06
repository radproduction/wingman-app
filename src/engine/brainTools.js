'use strict';

/**
 * Tools for the "judgement" layer: the user's standing rules about when Wingman
 * should act, ask, tell them, or stay quiet — plus re-studying a connected app.
 */

const brainTools = [
  {
    name: 'set_rule',
    description:
      'Save a standing rule the user just gave you about how to behave from now on. Use when they say things ' +
      'like "don\'t ask me every time for this", "is ke liye mat poocho", "always check with me before …", ' +
      '"stop telling me about …", "aisi cheezen mat batao", "always tell me when …". ' +
      'kind = auto_approve (a specific app action may run without asking — give app and the exact CAPITALS ' +
      'tool name; the user must confirm this rule once with a yes) · always_ask (always get a yes before ' +
      'something) · notify_mute (don\'t proactively tell them about something) · notify_always (always tell ' +
      'them about something). Write "about" as a short, specific sentence in English.',
    input_schema: {
      type: 'object',
      properties: {
        kind: { type: 'string', enum: ['auto_approve', 'always_ask', 'notify_mute', 'notify_always'] },
        about: { type: 'string', description: 'What the rule covers, e.g. "Posting to the Wingman Posting Facebook page" or "Newsletter and promotional emails".' },
        app: { type: 'string', description: 'For auto_approve: the app slug, e.g. "slack", "facebook".' },
        tool: { type: 'string', description: 'For auto_approve: the exact CAPITALS tool name, e.g. "SLACK_SEND_MESSAGE".' },
      },
      required: ['kind', 'about'],
    },
  },
  {
    name: 'list_rules',
    description: 'List the standing rules the user has given you. Use when they ask what rules/permissions you have.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'remove_rule',
    description: 'Remove a standing rule when the user takes it back ("ask me again for posts", "you can tell me about X again").',
    input_schema: {
      type: 'object',
      properties: {
        rule_id: { type: 'string', description: 'The id from list_rules.' },
        about: { type: 'string', description: 'Or a word/phrase identifying the rule.' },
      },
    },
  },
  {
    name: 'restudy_app',
    description:
      'Study one of the user\'s connected apps again right now and refresh your notes about it. Use when they ' +
      'say your picture of it is outdated or wrong, or ask you to look at it again. Takes a few minutes in the background.',
    input_schema: {
      type: 'object',
      properties: { app: { type: 'string', description: 'App slug, e.g. "shopify", "slack", "facebook".' } },
      required: ['app'],
    },
  },
];

const brainToolNames = new Set(brainTools.map((t) => t.name));

module.exports = { brainTools, brainToolNames };
