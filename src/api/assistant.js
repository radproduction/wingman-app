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

module.exports = router;
