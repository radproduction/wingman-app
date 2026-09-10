'use strict';

/**
 * Level 3 — LIVE agentic browser via Browserbase (a managed cloud browser).
 *
 * Phase 3a (this file): a LIVE, watchable session. We open a real cloud browser,
 * navigate it, and hand back Browserbase's embeddable "live view" URL — an iframe
 * the user watches in real time AND can take control of (type a password, solve a
 * CAPTCHA, click around). This is the Muse-style "watch it work / take over"
 * experience. Phase 3b will layer an AI action loop (decide + click + type) on the
 * same session, behind the approval gate.
 *
 * Runs on Browserbase's infra, NOT the droplet — so the 1-vCPU box is untouched.
 * Needs BROWSERBASE_API_KEY + BROWSERBASE_PROJECT_ID in the environment.
 */

function sdk() {
  try { return require('@browserbasehq/sdk'); } catch (_) { return null; }
}
function puppet() {
  try { return require('puppeteer'); } catch (_) { try { return require('puppeteer-core'); } catch (_) { return null; } }
}

// Live sessions we currently hold open, so we can close them on stop / timeout.
const sessions = new Map(); // sessionId -> { browser, at, userId }
const MAX_SESSION_MS = 10 * 60 * 1000; // safety auto-close, so a forgotten tab doesn't bill forever

/** Is the live browser configured on this server? */
function available() {
  return !!(process.env.BROWSERBASE_API_KEY && process.env.BROWSERBASE_PROJECT_ID);
}

function client() {
  const mod = sdk();
  if (!mod) return null;
  const Browserbase = mod.Browserbase || mod.default || mod;
  return new Browserbase({ apiKey: process.env.BROWSERBASE_API_KEY });
}

/** Open a live cloud browser at `url` and return its embeddable live-view URL. */
async function startLive(url, { userId = null } = {}) {
  if (!available()) return { ok: false, error: 'LIVE_BROWSER_NOT_CONFIGURED' };
  const puppeteer = puppet();
  const bb = client();
  if (!puppeteer || !bb) return { ok: false, error: 'LIVE_BROWSER_UNAVAILABLE' };
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  try {
    const session = await bb.sessions.create({ projectId: process.env.BROWSERBASE_PROJECT_ID });
    const browser = await puppeteer.connect({ browserWSEndpoint: session.connectUrl });
    const pages = await browser.pages();
    const page = pages[0] || (await browser.newPage());
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => { /* still show the live view */ });

    const debug = await bb.sessions.debug(session.id);
    const liveViewUrl = debug.debuggerFullscreenUrl || debug.debuggerUrl;

    sessions.set(session.id, { browser, at: Date.now(), userId });
    // Safety net: auto-close a session that's left open too long.
    setTimeout(() => { stopLive(session.id).catch(() => {}); }, MAX_SESSION_MS).unref?.();

    return { ok: true, sessionId: session.id, liveViewUrl, url: page.url() };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'LIVE_BROWSER_FAILED' };
  }
}

/** Close a live session (disconnect + ask Browserbase to release it → stops billing). */
async function stopLive(sessionId) {
  const s = sessions.get(sessionId);
  if (s) {
    try { await s.browser.disconnect(); } catch (_) { /* ignore */ }
    sessions.delete(sessionId);
  }
  try {
    const bb = client();
    if (bb && sessionId) {
      await bb.sessions.update(sessionId, {
        projectId: process.env.BROWSERBASE_PROJECT_ID,
        status: 'REQUEST_RELEASE',
      });
    }
  } catch (_) { /* best-effort release */ }
  return { ok: true };
}

module.exports = { available, startLive, stopLive };
