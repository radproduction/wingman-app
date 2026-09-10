'use strict';

const browser = require('../services/browser');

// A short-lived buffer of the pages we opened per user, so the in-app chat can
// show a "browser card" (screenshot + title + link) for a browse that happened
// during the turn it just requested. WhatsApp never reads this — its tool result
// stays text-only. Entries are consumed once and expire fast so a card never
// attaches to an unrelated later message.
const recentBrowse = new Map(); // userId -> [{ url, title, shot, loggedIn, at }]
const BROWSE_TTL_MS = 60 * 1000;

function rememberBrowse(userId, entry) {
  if (!userId) return;
  const list = recentBrowse.get(userId) || [];
  list.push({ ...entry, at: Date.now() });
  recentBrowse.set(userId, list);
}

/** Return + clear this user's fresh browse cards (used by the app chat endpoint). */
function takeRecentBrowse(userId) {
  const list = recentBrowse.get(userId) || [];
  recentBrowse.delete(userId);
  const now = Date.now();
  return list
    .filter((e) => now - e.at < BROWSE_TTL_MS)
    .map((e) => ({ type: 'browser', url: e.url, title: e.title, shot: e.shot, loggedIn: e.loggedIn }));
}

async function executeBrowserTool(user, toolUse) {
  const { name, input } = toolUse;
  if (name !== 'open_website') return { error: `Unknown tool: ${name}` };
  if (!input || !input.url) return { error: 'URL_REQUIRED' };

  // Ask for a screenshot too — it's stashed for the app card, NOT returned to
  // the model (which only needs the page text).
  const r = await browser.readPage(String(input.url), { userId: user.id, screenshot: true });
  if (!r.ok) {
    if (r.error === 'BROWSER_UNAVAILABLE') {
      return { error: 'BROWSER_UNAVAILABLE', detail: 'The browser runtime is not available on the server right now.' };
    }
    return { error: r.error || 'BROWSE_FAILED' };
  }

  rememberBrowse(user.id, { url: r.url, title: r.title, shot: r.shot, loggedIn: !!r.loggedIn });

  // Opening a site (especially a logged-in one) is a real action — record it.
  try {
    require('../db/agentActions').log(user.id, {
      kind: 'browse',
      summary: `Opened ${r.url}${r.loggedIn ? ' (logged in)' : ''}`,
      source: 'chat',
    });
  } catch (_) { /* audit best-effort */ }

  // Text-only result for the model (no base64 screenshot → no context bloat).
  return { ok: true, title: r.title, url: r.url, logged_in: !!r.loggedIn, page_text: r.text };
}

module.exports = { executeBrowserTool, takeRecentBrowse };
