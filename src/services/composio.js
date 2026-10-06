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
  metaads: 'Meta Ads',
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
// Extra tools a user's assistant discovered on demand (find_app_tools), on top
// of each app's default set. userId -> Map(slug -> raw tool). Kept in memory:
// after a restart the assistant simply searches again.
const userExtras = new Map();
const MAX_EXTRAS_PER_USER = 40;
const catalogCache = new Map();      // toolkit -> { at, tools: [rawTool] } — EVERY tool of the app

// Basics every user of an app needs, always loaded on top of Composio's
// "important" set (which, e.g. for Facebook, leaves out listing your Pages —
// and every other Facebook tool needs a page_id). Merged with COMPOSIO_TOOLS.
const DEFAULT_PINNED = {
  facebook: ['FACEBOOK_LIST_MANAGED_PAGES', 'FACEBOOK_GET_PAGE_POSTS', 'FACEBOOK_GET_PAGE_DETAILS'],
};

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
  // Default set = Composio's "important" tools for the app, PLUS any slugs
  // pinned in COMPOSIO_TOOLS (merged, not instead). Anything else the assistant
  // can still load on demand with find_app_tools.
  const pinned = [...new Set([...(DEFAULT_PINNED[toolkit] || []), ...(((config.composio.tools || {})[toolkit]) || [])])];
  let raw = await composio.tools.getRawComposioTools({ toolkits: [toolkit], important: true, limit: config.composio.toolsPerApp });
  if (Array.isArray(pinned) && pinned.length) {
    const have = new Set((raw || []).map((t) => t.slug));
    const missing = pinned.filter((slug) => !have.has(slug));
    if (missing.length) {
      try {
        raw = (raw || []).concat(await composio.tools.getRawComposioTools({ tools: missing }));
      } catch (e) {
        console.warn(`[composio] pinned tools for ${toolkit} failed:`, e.message);
      }
    }
  }
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
        const seen = new Set();
        for (const t of await schemasFor(toolkit)) { seen.add(t.slug); out.push(toAnthropicTool(t, toolkit)); }
        const extras = userExtras.get(String(user.id));
        if (extras) {
          for (const t of extras.values()) {
            const tk = String((t.toolkit && t.toolkit.slug) || t.__toolkit || '').toLowerCase();
            if (tk === toolkit && !seen.has(t.slug)) { seen.add(t.slug); out.push(toAnthropicTool(t, toolkit)); }
          }
        }
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

/**
 * Find more tools in one of the user's CONNECTED apps (e.g. "list my pages"),
 * and make them available to this user from the assistant's next step on.
 * Returns a short list the model can read.
 */
/** Every tool of one app (cached 1h) — the pool find_app_tools picks from. */
async function catalogFor(toolkit) {
  const hit = catalogCache.get(toolkit);
  if (hit && Date.now() - hit.at < SCHEMA_TTL_MS) return hit.tools;
  const composio = await getClient();
  const raw = await composio.tools.getRawComposioTools({ toolkits: [toolkit], limit: 500 });
  const tools = (raw || []).filter((t) => t && t.slug && t.slug.length <= MAX_TOOL_NAME && !t.isDeprecated);
  catalogCache.set(toolkit, { at: Date.now(), tools });
  return tools;
}

const STOP = new Set(['my', 'the', 'a', 'an', 'of', 'to', 'for', 'on', 'in', 'and', 'or', 'all', 'me', 'your', 'from', 'with', 'by', 'is', 'what', 'which']);
const SYN = { show: 'get', fetch: 'get', read: 'get', see: 'get', view: 'get', find: 'search', add: 'create', make: 'create', new: 'create', publish: 'create', remove: 'delete', edit: 'update', change: 'update' };
function words(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').split(' ')
    .filter((w) => w && !STOP.has(w))
    .map((w) => SYN[w] || w)
    .map((w) => (w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w));
}
function score(tool, qWords) {
  const slugW = new Set(words(tool.slug.replace(/_/g, ' ')));
  const textW = new Set(words(`${tool.name || ''} ${tool.description || ''}`));
  let n = 0;
  for (const w of qWords) { if (slugW.has(w)) n += 3; else if (textW.has(w)) n += 1; }
  return n;
}

/**
 * find_app_tools — generic for EVERY app, no per-app keyword lists.
 *  - With `tools` (exact slugs): load exactly those.
 *  - Otherwise: return the app's FULL menu (every tool, one line each) so the
 *    model itself picks by meaning, and pre-load the best keyword guesses.
 */
async function findTools(user, toolkit, what, pick) {
  const slug = String(toolkit || '').toLowerCase();
  const apps = await listConnections(user);
  if (!apps.some((a) => a.toolkit === slug)) return { error: 'APP_NOT_CONNECTED', app: slug };

  const catalog = await catalogFor(slug);
  const bySlug = new Map(catalog.map((t) => [t.slug.toUpperCase(), t]));
  const query = String(what || '').slice(0, 200);
  const wanted = (Array.isArray(pick) ? pick : []).concat(query.trim() && bySlug.has(query.trim().toUpperCase()) ? [query.trim()] : []);

  let found = [];
  if (wanted.length) {
    found = wanted.map((w) => bySlug.get(String(w).toUpperCase())).filter(Boolean).slice(0, 10);
  } else {
    const qWords = words(query);
    found = catalog.map((t) => ({ t, s: score(t, qWords) })).filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s).map((x) => x.t).slice(0, 5);
  }

  const key = String(user.id);
  const extras = userExtras.get(key) || new Map();
  for (const t of found) {
    t.__toolkit = slug;
    extras.delete(t.slug);
    extras.set(t.slug, t);
    slugIndex.set(t.slug, { toolkit: slug, version: t.version || null, readOnly: isReadOnly(t) });
  }
  while (extras.size > MAX_EXTRAS_PER_USER) extras.delete(extras.keys().next().value);
  userExtras.set(key, extras);
  console.log(`[integrations] find_app_tools ${slug} what="${query}" pick=${JSON.stringify(pick || [])} -> ${found.map((t) => t.slug).join(', ') || 'none'} (catalog ${catalog.length})`);

  const out = {
    app: appName(slug),
    loaded: found.map((t) => ({ tool: t.slug, what: String(t.description || t.name || '').slice(0, 160), changes_data: !isReadOnly(t) })),
  };
  if (wanted.length) {
    out.note = 'Loaded. Call the right one in your next step.';
  } else {
    // The full menu: the model chooses by meaning, not by keyword luck.
    out.all_tools = catalog.map((t) => `${t.slug} — ${String(t.description || t.name || '').replace(/\s+/g, ' ').slice(0, 90)}`);
    out.note = 'all_tools is EVERYTHING this app can do. If a loaded tool fits, call it. Otherwise pick the right names from ' +
      'all_tools and call find_app_tools again with them in "tools". Only if nothing in all_tools fits, tell the user this app cannot do it.';
  }
  return out;
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
  findTools,
  toolMeta,
  // test hook: inject a fake Composio client
  _setClientForTests: (c) => { clientPromise = Promise.resolve(c); },
  execute,
};
