'use strict';

/**
 * Anthropic tool definitions for third-party integrations (via Composio).
 *
 * Two kinds of tools:
 *  1. The static management tools below — list / connect / disconnect apps and
 *     approve / cancel a pending action. Always present when Composio is on.
 *  2. Per-user app tools (e.g. OUTLOOK_SEND_EMAIL, HUBSPOT_CREATE_DEAL) loaded at
 *     runtime for whatever apps THIS user has connected — see
 *     integrationToolsForUser(). Their names are Composio slugs.
 */

const config = require('../config');
const composio = require('../services/composio');

const managementTools = [
  {
    name: 'list_integrations',
    description:
      'List the third-party apps Wingman can connect (Outlook/M365, Teams, Zoom, Slack, HubSpot, ' +
      'Pipedrive, WooCommerce, Facebook Pages, Instagram, …), which ones this user has connected, ' +
      'and any actions waiting for their approval. Use when they ask what you can connect to, or ' +
      'before offering to connect something.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'connect_integration',
    description:
      'Get the one-tap link the user opens to connect a third-party app. Use when they ask to ' +
      'connect/link an app, or when they ask for something that needs an app they have not connected. ' +
      'Pass the app slug from list_integrations (e.g. "outlook", "slack", "hubspot").',
    input_schema: {
      type: 'object',
      properties: { app: { type: 'string', description: 'App slug, e.g. "outlook", "hubspot".' } },
      required: ['app'],
    },
  },
  {
    name: 'find_app_tools',
    description:
      'Load more tools for an app the user HAS connected, when none of your current CAPITALS tools ' +
      'for that app can do what they asked (e.g. "list my Facebook pages", "reply to a comment", ' +
      '"get page insights"). Describe the action in a few words. The tools it finds become ' +
      'available in your next step — then call the right one. Never tell the user you lack a ' +
      'tool for a connected app before trying this.',
    input_schema: {
      type: 'object',
      properties: {
        app: { type: 'string', description: 'Connected app slug, e.g. "facebook", "instagram", "slack".' },
        what: { type: 'string', description: 'The action needed, e.g. "list managed pages".' },
      },
      required: ['app', 'what'],
    },
  },
  {
    name: 'disconnect_integration',
    description:
      'Disconnect a third-party app. This is proposed first and only runs after the user says yes ' +
      'in their next message.',
    input_schema: {
      type: 'object',
      properties: { app: { type: 'string', description: 'App slug to disconnect.' } },
      required: ['app'],
    },
  },
  {
    name: 'approve_integration_action',
    description:
      'Run an action that is waiting for approval, ONLY after the user has clearly said yes to it in ' +
      'a message AFTER you showed it to them. Never call this in the same turn you proposed the action.',
    input_schema: {
      type: 'object',
      properties: { action_id: { type: 'string', description: 'The action_id returned when it was proposed.' } },
      required: ['action_id'],
    },
  },
  {
    name: 'cancel_integration_action',
    description: 'Cancel an action that is waiting for approval (the user said no, or changed their mind).',
    input_schema: {
      type: 'object',
      properties: { action_id: { type: 'string' } },
      required: ['action_id'],
    },
  },
];

const managementToolNames = new Set(managementTools.map((t) => t.name));

/**
 * The full integration tool set for this user this turn:
 * { tools: [...anthropic tools], names: Set<string> } — names is what the
 * conversation loop uses to route a tool_use block to integrationExecutor.
 */
async function integrationToolsForUser(user) {
  if (!config.composio.enabled) return { tools: [], names: new Set() };
  const appTools = await composio.toolsForUser(user); // never throws
  const tools = [...managementTools, ...appTools];
  return { tools, names: new Set(tools.map((t) => t.name)) };
}

module.exports = { managementTools, managementToolNames, integrationToolsForUser };
