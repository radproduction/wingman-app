'use strict';

/**
 * Executes integration tool calls (see integrationTools.js).
 *
 * THE APPROVAL GATE (CORE-03) IS ENFORCED HERE, NOT IN THE PROMPT:
 *  - Read-only app tools (Composio tags them readOnlyHint) run immediately.
 *  - Every other app tool is parked in integration_actions as 'pending' and the
 *    model gets back { approval_required, action_id, preview } to show the user.
 *  - approve_integration_action only runs it if the user has sent a NEW message
 *    since it was proposed (rowid check) and it hasn't expired — so the model
 *    cannot approve its own proposal, and an automated run can never execute a
 *    write. There is no bypass flag and the user's autonomy setting does not
 *    skip it.
 * Never throws — errors come back as { error } so Claude can explain them.
 */

const config = require('../config');
const composio = require('../services/composio');
const actions = require('../db/integrationActions');
const agentActions = require('../db/agentActions');
const { managementToolNames } = require('./integrationTools');

const DISCONNECT = '__DISCONNECT__';

function preview(toolkit, slug, args) {
  let a = '';
  try { a = JSON.stringify(args || {}); } catch (_) { a = '{}'; }
  if (a.length > 400) a = a.slice(0, 400) + '…';
  const what = slug === DISCONNECT ? 'Disconnect' : slug.replace(/_/g, ' ').toLowerCase();
  return `${composio.appName(toolkit)} — ${what} ${a === '{}' ? '' : a}`.trim();
}

async function propose(user, { toolkit, slug, version, args }, ctx = {}) {
  // Same action already waiting? Don't pile up duplicates (the chat history is
  // text-only, so the model often re-calls the tool on the user's "yes"
  // instead of approve_integration_action). If the user has replied since it
  // was shown to them, and this is a live chat turn, the re-call is the go-ahead.
  actions.expireOld(config.composio.approvalTtlMinutes);
  const same = actions.findSamePending(user.id, slug, args);
  if (same) {
    if (!ctx.automated && actions.userHasRepliedSince(user.id, same)) return approve(user, same.id, ctx);
    return {
      approval_required: true,
      action_id: same.id,
      instruction: 'This exact action is already waiting for the user\'s yes. Show it once and wait for their reply.',
    };
  }
  const summary = preview(toolkit, slug, args);
  const row = actions.create({ userId: user.id, toolkit, toolSlug: slug, toolVersion: version, args, summary });
  return {
    approval_required: true,
    action_id: row.id,
    app: composio.appName(toolkit),
    action: slug,
    details: args,
    instruction:
      'Nothing has been done yet. Show the user EXACTLY what will happen (recipient, content, ' +
      'amount, which account) in plain words and ask for a yes/no. Only after they reply yes, ' +
      'call approve_integration_action with this action_id.',
  };
}

async function runApproved(user, row) {
  if (row.tool_slug === DISCONNECT) {
    try {
      const r = await composio.disconnect(user, row.toolkit);
      return r.error ? { ok: false, error: r.error } : { ok: true, data: r };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  }
  return composio.execute(user, row.tool_slug, row.arguments, row.tool_version);
}

async function approve(user, actionId, ctx = {}) {
  if (ctx.automated) return { error: 'NEEDS_USER_CONFIRMATION', detail: 'Automated runs cannot approve actions.' };
  actions.expireOld(config.composio.approvalTtlMinutes);
  const row = actions.get(user.id, String(actionId || ''));
  if (!row) return { error: 'ACTION_NOT_FOUND' };
  if (row.status !== 'pending') return { error: `ACTION_${String(row.status).toUpperCase()}`, detail: `This action is already ${row.status}.` };
  if (!actions.userHasRepliedSince(user.id, row)) {
    return {
      error: 'NEEDS_USER_CONFIRMATION',
      detail: 'The user has not replied yet. Show them the action and wait for their yes in their next message.',
    };
  }
  if (!actions.claim(user.id, row.id)) return { error: 'ACTION_ALREADY_HANDLED' };

  // Duplicates of this same action (e.g. from repeated proposals) must never run twice.
  actions.cancelDuplicates(user.id, row);
  const res = await runApproved(user, row);
  actions.finish(user.id, row.id, { ok: res.ok, result: res.ok ? res.data : res.error });
  if (res.ok) {
    agentActions.log(user.id, { kind: `integration.${row.tool_slug}`, summary: row.summary, source: 'chat' });
    return { done: true, app: composio.appName(row.toolkit), result: res.data };
  }
  return { error: 'ACTION_FAILED', app: composio.appName(row.toolkit), detail: res.error };
}

async function listIntegrations(user) {
  const available = composio.availableApps();
  let connected = [];
  try {
    connected = (await composio.listConnections(user, { fresh: true })).map((a) => a.toolkit);
  } catch (e) {
    return { error: 'INTEGRATIONS_UNAVAILABLE', detail: e.message };
  }
  actions.expireOld(config.composio.approvalTtlMinutes);
  return {
    apps: available.map((slug) => ({ app: slug, name: composio.appName(slug), connected: connected.includes(slug) })),
    pending_actions: actions.listPending(user.id),
  };
}

async function executeIntegrationTool(user, toolUse, ctx = {}) {
  const { name, input = {} } = toolUse;
  try {
    if (!config.composio.enabled) return { error: 'INTEGRATIONS_NOT_CONFIGURED' };

    if (managementToolNames.has(name)) {
      switch (name) {
        case 'list_integrations':
          return listIntegrations(user);
        case 'connect_integration':
          return composio.connectLink(user, input.app);
        case 'find_app_tools':
          return composio.findTools(user, input.app, input.what, input.tools);
        case 'disconnect_integration': {
          const slug = String(input.app || '').toLowerCase();
          const apps = await composio.listConnections(user, { fresh: true });
          if (!apps.some((a) => a.toolkit === slug)) return { error: 'NOT_CONNECTED', app: slug };
          return propose(user, { toolkit: slug, slug: DISCONNECT, version: null, args: {} }, ctx);
        }
        case 'approve_integration_action':
          return approve(user, input.action_id, ctx);
        case 'cancel_integration_action':
          return actions.cancel(user.id, String(input.action_id || ''))
            ? { cancelled: true }
            : { error: 'NOTHING_TO_CANCEL' };
        default:
          return { error: 'UNKNOWN_TOOL' };
      }
    }

    // An app tool (Composio slug). Only tools we offered this user are allowed.
    const meta = composio.toolMeta(name);
    if (!meta) return { error: 'UNKNOWN_TOOL', detail: `${name} is not an available integration tool.` };
    const connected = await composio.listConnections(user);
    if (!connected.some((a) => a.toolkit === meta.toolkit)) {
      return { error: 'APP_NOT_CONNECTED', app: meta.toolkit, detail: 'Offer the connect link (connect_integration).' };
    }

    if (meta.readOnly) {
      const res = await composio.execute(user, name, input, meta.version);
      return res.ok ? { app: composio.appName(meta.toolkit), result: res.data } : { error: 'ACTION_FAILED', detail: res.error };
    }
    return propose(user, { toolkit: meta.toolkit, slug: name, version: meta.version, args: input }, ctx);
  } catch (e) {
    console.warn(`[integrations] ${name} failed:`, e.message);
    return { error: 'INTEGRATION_ERROR', detail: e.message };
  }
}

/**
 * Text block for the system prompt listing this user's waiting actions WITH
 * their action_ids — chat history is text-only, so without this the model
 * forgets the id by the time the user says yes.
 */
function pendingActionsBlock(user) {
  try {
    if (!config.composio.enabled || !user) return '';
    actions.expireOld(config.composio.approvalTtlMinutes);
    const seen = new Set();
    const rows = actions.listPending(user.id).filter((r) => {
      const k = `${r.tool_slug}|${r.summary}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).slice(0, 5);
    if (!rows.length) return '';
    return '\n\n--- ACTIONS WAITING FOR THE USER\'S YES ---\n' +
      rows.map((r) => `- action_id ${r.id}: ${r.summary}`).join('\n') +
      '\nIf the user\'s latest message agrees to one of these (yes / haan / kar do / ok / go ahead, in any wording), call approve_integration_action with its action_id RIGHT NOW — do not ask again and do not re-create it. If they decline, cancel_integration_action.';
  } catch (_) {
    return '';
  }
}

module.exports = { executeIntegrationTool, pendingActionsBlock };
