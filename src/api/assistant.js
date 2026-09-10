'use strict';

/**
 * In-app assistant chat — the SAME brain that answers on WhatsApp, exposed to the
 * PWA so the user can have a WhatsApp-style conversation inside the app. When a
 * message makes the agent open a website (open_website), the reply carries a
 * "browser card" (screenshot + title + link) so the site shows up right in the
 * chat, Muse-style. Read-only for now.
 */

const express = require('express');
const router = express.Router();
const { requireAuth } = require('./middleware/auth');
const engine = require('../engine/conversation');
const conversationsRepo = require('../db/conversations');
const { takeRecentBrowse } = require('../engine/browserExecutor');
const liveBrowser = require('../services/liveBrowser');
const liveAgent = require('../services/liveAgent');

/** Recent conversation, oldest-first, to populate the chat on open. */
router.get('/assistant/history', requireAuth, (req, res) => {
  try {
    const rows = conversationsRepo.historyForUser(req.user.id, 40);
    const messages = rows.map((r) => ({
      role: r.role === 'assistant' ? 'assistant' : 'user',
      text: r.content || '',
      at: r.created_at,
    }));
    res.json({ messages });
  } catch (e) {
    console.error('[assistant/history]', e.message);
    res.status(500).json({ error: 'history_failed' });
  }
});

/** Send a message; get the assistant's reply plus any browser cards. */
router.post('/assistant/chat', requireAuth, async (req, res) => {
  const text = String((req.body && req.body.text) || '').trim();
  if (!text) return res.status(400).json({ error: 'text required' });
  try {
    // Reuse the exact WhatsApp pipeline: it logs the message + reply under this
    // user, so app and WhatsApp share one continuous history and context.
    const { reply, ignored } = await engine.handleMessage({
      text,
      phoneNumber: req.user.phone,
      meta: { source: 'app' },
    });
    const cards = takeRecentBrowse(req.user.id);
    res.json({ reply: reply || '', ignored: !!ignored, cards });
  } catch (e) {
    console.error('[assistant/chat]', e);
    res.status(500).json({ error: 'chat_failed' });
  }
});

// ── Level 3: LIVE browser (Browserbase) — watch it work + take control ──

/** Open a live cloud-browser session and return an embeddable live-view URL. */
router.post('/assistant/browse/live', requireAuth, async (req, res) => {
  const url = String((req.body && req.body.url) || '').trim();
  if (!url) return res.status(400).json({ error: 'url required' });
  try {
    const r = await liveBrowser.startLive(url, { userId: req.user.id });
    if (!r.ok) {
      const code = r.error === 'LIVE_BROWSER_NOT_CONFIGURED' ? 503 : 502;
      return res.status(code).json({ error: r.error });
    }
    try {
      require('../db/agentActions').log(req.user.id, {
        kind: 'browse.live',
        summary: `Opened a live browser at ${r.url}`,
        source: 'chat',
      });
    } catch (_) { /* audit best-effort */ }
    res.json({ sessionId: r.sessionId, liveViewUrl: r.liveViewUrl, url: r.url });
  } catch (e) {
    console.error('[assistant/browse/live]', e.message);
    res.status(500).json({ error: 'live_failed' });
  }
});

/** Poll a live AGENT run's progress (steps + result) so the app can show it. */
router.get('/assistant/browse/agent/:sessionId', requireAuth, (req, res) => {
  try {
    res.json(liveAgent.getStatus(String(req.params.sessionId)));
  } catch (e) {
    res.status(500).json({ error: 'status_failed' });
  }
});

/** Close a live session (stops the cloud browser + billing). */
router.post('/assistant/browse/stop', requireAuth, async (req, res) => {
  const sessionId = String((req.body && req.body.sessionId) || '').trim();
  if (!sessionId) return res.status(400).json({ error: 'sessionId required' });
  try {
    await liveBrowser.stopLive(sessionId);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'stop_failed' });
  }
});

module.exports = router;
