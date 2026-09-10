'use strict';

const browser = require('../services/browser');
const liveAgent = require('../services/liveAgent');

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
    .map((e) => (e.kind === 'live_agent'
      ? { type: 'live_agent', url: e.url, sessionId: e.sessionId, liveViewUrl: e.liveViewUrl, goal: e.goal }
      : { type: 'browser', url: e.url, title: e.title, shot: e.shot, loggedIn: e.loggedIn }));
}

async function executeBrowserTool(user, toolUse) {
  const { name, input } = toolUse;

  // Level 3b — the agent DOES a task on a live browser while the user watches.
  if (name === 'browse_and_act') {
    if (!input || !input.goal) return { error: 'GOAL_REQUIRED' };
    const r = await liveAgent.startTask(user.id, String(input.goal), input.url ? String(input.url) : '');
    if (!r.ok) {
      if (r.error === 'LIVE_BROWSER_NOT_CONFIGURED') {
        return { error: 'LIVE_BROWSER_NOT_CONFIGURED', detail: 'The live browser is not switched on for this server yet.' };
      }
      return { error: r.error || 'LIVE_AGENT_FAILED' };
    }
    // Card the app renders as a watchable live-agent panel (iframe + step log).
    rememberBrowse(user.id, { kind: 'live_agent', url: r.url, sessionId: r.sessionId, liveViewUrl: r.liveViewUrl, goal: String(input.goal) });
    try {
      require('../db/agentActions').log(user.id, { kind: 'browse.agent', summary: `Live agent working on: ${String(input.goal).slice(0, 120)}`, source: 'chat' });
    } catch (_) { /* audit best-effort */ }
    // Text-only for the model: tell it the live agent is running so it replies naturally.
    return { ok: true, started: true, message: 'Live browser agent started; the user can watch it work and take control in the app.' };
  }

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
