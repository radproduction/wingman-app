'use strict';

const credentials = require('../db/credentials');

/**
 * Headless-browser automation (Phase 1: READ-ONLY). Loads a URL in a real
 * Chromium (so JavaScript-rendered pages and pages behind a login work — unlike a
 * plain fetch), optionally logs in with a matching vault credential, and returns
 * the visible page text. It navigates + reads; it does NOT click through
 * purchases or submit forms other than a login. Acting (Phase 2) will layer on
 * top of this and go through the approval gate.
 *
 * Reuses the Chromium the Dockerfile already installs for whatsapp-web.js
 * (PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium), so no extra infra is needed.
 */

function loadPuppeteer() {
  try { return require('puppeteer'); }
  catch (_) { try { return require('puppeteer-core'); } catch (_) { return null; } }
}

const LAUNCH_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function domainOf(url) {
  try { return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, ''); }
  catch (_) { return ''; }
}

async function readPage(url, { userId = null, maxChars = 6000, timeoutMs = 30000 } = {}) {
  const puppeteer = loadPuppeteer();
  if (!puppeteer) return { ok: false, error: 'BROWSER_UNAVAILABLE' };
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;

  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: LAUNCH_ARGS,
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(timeoutMs);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    // Best-effort login if the user has a saved credential for this domain.
    let loggedIn = false;
    if (userId) {
      const cred = matchCredential(userId, url);
      if (cred && cred.secret) loggedIn = await tryLogin(page, cred, timeoutMs);
    }

    await sleep(1200); // let JS settle
    const title = await page.title().catch(() => '');
    const text = await page.evaluate(() => (document.body ? document.body.innerText : '')).catch(() => '');
    return {
      ok: true,
      title,
      url: page.url(),
      loggedIn,
      text: String(text || '').replace(/\n{3,}/g, '\n\n').trim().slice(0, maxChars),
    };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'BROWSE_FAILED' };
  } finally {
    if (browser) { try { await browser.close(); } catch (_) { /* ignore */ } }
  }
}

/** Find a saved credential whose url/label matches this site's domain. Decrypts
 *  server-side only — the plaintext never returns to the caller of readPage. */
function matchCredential(userId, url) {
  try {
    const dom = domainOf(url).toLowerCase();
    if (!dom) return null;
    const list = credentials.listSafe(userId); // labels + usernames + urls (no secret)
    const hit = list.find((c) => {
      const cd = domainOf(c.url || '').toLowerCase();
      if (cd && (dom.includes(cd) || cd.includes(dom))) return true;
      const lab = String(c.label || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return lab && dom.replace(/[^a-z0-9]/g, '').includes(lab);
    });
    return hit ? credentials.getDecrypted(userId, hit.label) : null;
  } catch (_) { return null; }
}

/** Generic best-effort login: fill the password field + a nearby username/email
 *  field, then submit. Works on simple forms; silently gives up otherwise. */
async function tryLogin(page, cred, timeoutMs) {
  try {
    const pass = await page.$('input[type="password"]');
    if (!pass) return false;
    const userInput = await page.$('input[type="email"], input[type="text"], input[name*="user" i], input[name*="email" i], input[id*="user" i], input[id*="email" i]');
    if (userInput && cred.username) {
      await userInput.click({ clickCount: 3 }).catch(() => {});
      await userInput.type(String(cred.username), { delay: 20 });
    }
    await pass.click({ clickCount: 3 }).catch(() => {});
    await pass.type(String(cred.secret), { delay: 20 });
    const btn = await page.$('button[type="submit"], input[type="submit"], button');
    if (btn) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: timeoutMs }).catch(() => {}),
        btn.click().catch(() => {}),
      ]);
    } else {
      await pass.press('Enter').catch(() => {});
      await sleep(2500);
    }
    // Heuristic: logged in if the password field is gone from the page now.
    const stillPass = await page.$('input[type="password"]');
    return !stillPass;
  } catch (_) { return false; }
}

module.exports = { readPage };
