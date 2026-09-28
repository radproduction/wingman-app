'use strict';

/**
 * Composio bridge — one client for every third-party app we don't integrate
 * directly (Outlook/M365, Teams, Zoom, Slack, HubSpot, Pipedrive, WooCommerce,
 * Facebook Pages, Instagram, …).
 *
 * Composio holds each user's OAuth tokens and executes the API calls; we only
 * (1) hand out a connect link, (2) list what a user has connected, (3) turn the
 * connected apps' tool schemas into Anthropic tools, and (4) execute a tool.
 *
 * @composio/core is ESM-only and we are CommonJS on Node 20, so it is loaded
 * with a lazy dynamic import(). If COMPOSIO_API_KEY is unset nothing here runs.
 */

const config = require('../config');

// Friendly names for the apps we expect to offer. Unknown slugs fall back to a
// title-cased slug, so adding an app is config-only (COMPOSIO_AUTH_CONFIGS).
const APP_NAMES = {
  outlook: 'Outlook / Microsoft 365',
  microsoft_teams: 'Microsoft Teams',
  zoom: 'Zoom',
  slack: 'Slack',
  hubspot: 'HubSpot',
  pipedrive: 'Pipedrive',
  woocommerce: 'WooCommerce',
  facebook: 'Facebook Pages',
  instagram: 'Instagram',
  one_drive: 'OneDrive',
  notion: 'Notion',
  trello: 'Trello',
  asana: 'Asana',
};

const CONNECTIONS_TTL_MS = 2 * 60 * 1000;   // per-user "what's connected" cache
const SCHEMA_TTL_MS = 60 * 60 * 1000;       // per-app tool schemas (same for everyone)
const EXEC_TIMEOUT_MS = 30 * 1000;
const MAX_TOOL_NAME = 64;                   // Anthropic tool-name limit

let clientPromise = null;
const connectionsCache = new Map();  // composioUserId -> { at, apps: [{toolkit, id, status}] }
const schemaCache = new Map();       // toolkit -> { at, tools: [rawTool] }
const slugIndex = new Map();         // tool slug -> { toolkit, version, readOnly }

function appName(toolkit) {
  return APP_NAMES[toolkit] || toolkit.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Apps this server offers (the keys of COMPOSIO_AUTH_CONFIGS). */
function availableApps() {
  return Object.keys(config.composio.authConfigs || {}).map((t) => String(t).toLowerCase());
}

/** Stable Composio-side user id. Never the phone number (PII in a third party). */
function composioUserId(user) {
  return `wm_${user.id}`;
}

async function getClient() {
  if (!config.composio.enabled) throw new Error('COMPOSIO_NOT_CONFIGURED');
  if (!clientPromise) {
    clientPromise = import('@composio/core').then(({ Composio }) =>
      new Composio({ apiKey: config.composio.apiKey }),
    ).catch((e) => {
      clientPromise = null; // allow a retry on the next call
      throw e;
    });
  }
  return clientPromise;
}

// ─── Connections ───────────────────────────────────────────────────

/**
 * Apps this user has connected (ACTIVE only), limited to apps we still offer.
 * Cached briefly — it's called on every chat turn to build the tool list.
 */
async function listConnections(user, { fresh = false } = {}) {
  const uid = composioUserId(user);
  const hit = connectionsCache.get(uid);
  if (!fresh && hit && Date.now() - hit.at < CONNECTIONS_TTL_MS) return hit.apps;

  const composio = await getClient();
  const offered = new Set(availableApps());
  const res = await composio.connectedAccounts.list({ userIds: [uid], statuses: ['ACTIVE'] });
  const apps = [];
  const seen = new Set();
  for (const acc of (res && res.items) || []) {
    const toolkit = String((acc.toolkit && acc.toolkit.slug) || '').toLowerCase();
    if (!toolkit || !offered.has(toolkit) || seen.has(toolkit)) continue;
    seen.add(toolkit);
    apps.push({ toolkit, id: acc.id, status: acc.status });
  }
  connectionsCache.set(uid, { at: Date.now(), apps });
  return apps;
}

function forgetConnections(user) {
  connectionsCache.delete(composioUserId(user));
}

/** Hosted connect link for one app. The user taps it, logs in, done. */
async function connectLink(user, toolkit) {
  const slug = String(toolkit || '').toLowerCase();
  const authConfigId = (config.composio.authConfigs || {})[slug];
  if (!authConfigId) return { error: 'APP_NOT_AVAILABLE', available: availableApps() };

  const composio = await getClient();
  const req = await composio.connectedAccounts.link(composioUserId(user), authConfigId, {
    callbackUrl: `${config.publicBaseUrl}/auth/integrations/callback`,
  });
  forgetConnections(user); // next turn re-reads, so new tools appear promptly
  return { app: slug, app_name: appName(slug), connect_url: req.redirectUrl || null };
}

async function disconnect(user, toolkit) {
  const slug = String(toolkit || '').toLowerCase();
  const apps = await listConnections(user, { fresh: true });
  const match = apps.find((a) => a.toolkit === slug);
  if (!match) return { error: 'NOT_CONNECTED', app: slug };
  const composio = await getClient();
  await composio.connectedAccounts.delete(match.id);
  forgetConnections(user);
  return { disconnected: true, app: slug, app_name: appName(slug) };
}

// ─── Tools ─────────────────────────────────────────────────────────

function isReadOnly(tool) {
  const tags = (tool.tags || []).map(String);
  // Conservative: only tools Composio explicitly marks read-only skip approval.
  return tags.includes('readOnlyHint') && !tags.includes('destructiveHint');
}

async function schemasFor(toolkit) {
  const hit = schemaCache.get(toolkit);
  if (hit && Date.now() - hit.at < SCHEMA_TTL_MS) return hit.tools;

  const composio = await getClient();
  const pinned = (config.composio.tools || {})[toolkit];
  const query = Array.isArray(pinned) && pinned.length
    ? { tools: pinned }
    : { toolkits: [toolkit], important: true, limit: config.composio.toolsPerApp };
  const raw = await composio.tools.getRawComposioTools(query);
  const tools = (raw || []).filter((t) => t && t.slug && t.slug.length <= MAX_TOOL_NAME && !t.isDeprecated);

  for (const t of tools) {
    slugIndex.set(t.slug, { toolkit, version: t.version || null, readOnly: isReadOnly(t) });
  }
  schemaCache.set(toolkit, { at: Date.now(), tools });
  return tools;
}

function toAnthropicTool(t, toolkit) {
  const schema = t.inputParameters && t.inputParameters.type === 'object'
    ? t.inputParameters
    : { type: 'object', properties: {} };
  const ro = isReadOnly(t);
  const desc = `[${appName(toolkit)}] ${t.description || t.name || t.slug}` +
    (ro ? '' : ' (CHANGES DATA — goes to the user for approval before it runs.)');
  return { name: t.slug, description: desc.slice(0, 1000), input_schema: schema };
}

/**
 * Anthropic tool definitions for every app this user has connected.
 * Never throws: a Composio outage just means no integration tools this turn.
 */
async function toolsForUser(user) {
  if (!config.composio.enabled || !user) return [];
  try {
    const apps = await listConnections(user);
    const out = [];
    for (const { toolkit } of apps) {
      try {
        for (const t of await schemasFor(toolkit)) out.push(toAnthropicTool(t, toolkit));
      } catch (e) {
        console.warn(`[composio] tool schemas for ${toolkit} failed:`, e.message);
      }
    }
    return out;
  } catch (e) {
    console.warn('[composio] toolsForUser failed:', e.message);
    return [];
  }
}

/** Metadata for a slug we've handed to Claude (null if we never offered it). */
function toolMeta(slug) {
  return slugIndex.get(slug) || null;
}

function truncate(obj, max = 8000) {
  let s;
  try { s = JSON.stringify(obj); } catch (_) { return { note: 'result not serialisable' }; }
  if (s.length <= max) return obj;
  return { truncated: true, preview: s.slice(0, max) };
}

/** Run one tool for this user. Returns { ok, data } or { ok:false, error }. */
async function execute(user, slug, args, version) {
  const composio = await getClient();
  const body = { userId: composioUserId(user), arguments: args || {} };
  if (version) body.version = version;
  else body.dangerouslySkipVersionCheck = true; // only if Composio sent no version
  try {
    const res = await composio.tools.execute(slug, body, { signal: AbortSignal.timeout(EXEC_TIMEOUT_MS) });
    if (!res || !res.successful) return { ok: false, error: (res && res.error) || 'The app returned an error.' };
    return { ok: true, data: truncate(res.data) };
  } catch (e) {
    return { ok: false, error: e && e.message ? e.message.slice(0, 300) : 'Integration call failed.' };
  }
}

module.exports = {
  appName,
  availableApps,
  listConnections,
  forgetConnections,
  connectLink,
  disconnect,
  toolsForUser,
  toolMeta,
  execute,
};
