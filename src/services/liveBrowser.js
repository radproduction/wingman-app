'use strict';

/**
 * Level 3 — LIVE agentic browser via a managed cloud browser.
 *
 * Provider-agnostic: uses Steel (STEEL_API_KEY) or Browserbase
 * (BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID), whichever is configured — so
 * the user picks whichever service they can actually sign up for. Steel is
 * preferred when both are set.
 *
 * Phase 3a (this file): a LIVE, watchable session. We open a real cloud browser,
 * navigate it, and hand back the provider's embeddable "live view" URL — an
 * iframe the user watches in real time AND can take control of (type a password,
 * solve a CAPTCHA, click). This is the Muse-style "watch it work / take over"
 * experience. Phase 3b will add an AI action loop on the same session.
 *
 * Runs on the provider's infra, NOT the droplet — so the 1-vCPU box is untouched.
 */

function puppet() {
  try { return require('puppeteer'); } catch (_) { try { return require('puppeteer-core'); } catch (_) { return null; } }
}

// Live sessions we currently hold open, so we can close them on stop / timeout.
const sessions = new Map(); // sessionId -> { browser, provider, at, userId }
const MAX_SESSION_MS = 10 * 60 * 1000; // safety auto-close so a forgotten tab doesn't bill forever

/** Which provider is configured (null if none). Steel wins if both are set. */
function provider() {
  if (process.env.STEEL_API_KEY) return 'steel';
  if (process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID) return 'browserbase';
  return null;
}
function available() { return !!provider(); }

// ── Steel ────────────────────────────────────────────────────────────
function steelClient() {
  let M; try { M = require('steel-sdk'); } catch (_) { return null; }
  const Steel = M.default || M;
  return new Steel({ steelAPIKey: process.env.STEEL_API_KEY });
}
async function startSteel(puppeteer) {
  const client = steelClient();
  if (!client) return { unavailable: true };
  const session = await client.sessions.create();
  const browser = await puppeteer.connect({
    browserWSEndpoint: `${session.websocketUrl}&apiKey=${process.env.STEEL_API_KEY}`,
  });
  const liveViewUrl = session.sessionViewerUrl || session.debugUrl || `https://app.steel.dev/sessions/${session.id}`;
  return { session, browser, liveViewUrl };
}
async function releaseSteel(sessionId) {
  try { const c = steelClient(); if (c) await c.sessions.release(sessionId); } catch (_) { /* best-effort */ }
}

// ── Browserbase ──────────────────────────────────────────────────────
function bbClient() {
  let M; try { M = require('@browserbasehq/sdk'); } catch (_) { return null; }
  const Browserbase = M.Browserbase || M.default || M;
  return new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
}
async function startBrowserbase(puppeteer) {
  const bb = bbClient();
  if (!bb) return { unavailable: true };
  const session = await bb.sessions.create({ projectId: process.env.BROWSERBASE_PROJECT_ID });
  const browser = await puppeteer.connect({ browserWSEndpoint: session.connectUrl });
  const debug = await bb.sessions.debug(session.id);
  const liveViewUrl = debug.debuggerFullscreenUrl || debug.debuggerUrl;
  return { session, browser, liveViewUrl };
}
async function releaseBrowserbase(sessionId) {
  try {
    const bb = bbClient();
    if (bb) await bb.sessions.update(sessionId, { projectId: process.env.BROWSERBASE_PROJECT_ID, status: 'REQUEST_RELEASE' });
  } catch (_) { /* best-effort */ }
}

// ── Public API ───────────────────────────────────────────────────────

/** Open a live cloud browser at `url` and return its embeddable live-view URL. */
async function startLive(url, { userId = null } = {}) {
  const prov = provider();
  if (!prov) return { ok: false, error: 'LIVE_BROWSER_NOT_CONFIGURED' };
  const puppeteer = puppet();
  if (!puppeteer) return { ok: false, error: 'LIVE_BROWSER_UNAVAILABLE' };
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const started = prov === 'steel' ? await startSteel(puppeteer) : await startBrowserbase(puppeteer);
    if (started.unavailable) return { ok: false, error: 'LIVE_BROWSER_UNAVAILABLE' };
    const { session, browser, liveViewUrl } = started;

    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { /* still show the live view */ });

    sessions.set(session.id, { browser, provider: prov, at: Date.now(), userId });
    setTimeout(() => { stopLive(session.id).catch(() => {}); }, MAX_SESSION_MS).unref?.();

    return { ok: true, sessionId: session.id, liveViewUrl, url: page.url(), provider: prov };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'LIVE_BROWSER_FAILED' };
  }
}

/** Close a live session (disconnect + release it → stops billing). */
async function stopLive(sessionId) {
  const s = sessions.get(sessionId);
  const prov = (s && s.provider) || provider();
  if (s) {
    try { await s.browser.disconnect(); } catch (_) { /* ignore */ }
    sessions.delete(sessionId);
  }
  if (prov === 'steel') await releaseSteel(sessionId);
  else if (prov === 'browserbase') await releaseBrowserbase(sessionId);
  return { ok: true };
}

module.exports = { available, provider, startLive, stopLive };
