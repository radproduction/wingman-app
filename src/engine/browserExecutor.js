'use strict';

const browser = require('../services/browser');

async function executeBrowserTool(user, toolUse) {
  const { name, input } = toolUse;
  if (name !== 'open_website') return { error: `Unknown tool: ${name}` };
  if (!input || !input.url) return { error: 'URL_REQUIRED' };

  const r = await browser.readPage(String(input.url), { userId: user.id });
  if (!r.ok) {
    if (r.error === 'BROWSER_UNAVAILABLE') {
      return { error: 'BROWSER_UNAVAILABLE', detail: 'The browser runtime is not available on the server right now.' };
    }
    return { error: r.error || 'BROWSE_FAILED' };
  }

  // Opening a site (especially a logged-in one) is a real action — record it.
  try {
    require('../db/agentActions').log(user.id, {
      kind: 'browse',
      summary: `Opened ${r.url}${r.loggedIn ? ' (logged in)' : ''}`,
      source: 'chat',
    });
  } catch (_) { /* audit best-effort */ }

  return { ok: true, title: r.title, url: r.url, logged_in: !!r.loggedIn, page_text: r.text };
}

module.exports = { executeBrowserTool };
