'use strict';

/**
 * Third-party integrations (Composio) for the Control Center.
 *
 *   GET    /api/integrations               → apps on offer + which are connected
 *   POST   /api/integrations/:app/connect  → { connect_url } to open
 *   DELETE /api/integrations/:app          → disconnect (the user clicked it in
 *                                            the app, so no chat approval step)
 *   GET    /auth/integrations/callback     → landing page after the provider
 *                                            login (Composio redirects here)
 *
 * All /api routes require a session and act only on req.user.
 */

const express = require('express');
const config = require('../config');
const { requireAuth } = require('./middleware/auth');
const composio = require('../services/composio');

const router = express.Router();

function notConfigured(res) {
  return res.status(503).json({ error: 'integrations_not_configured' });
}

router.get('/integrations', requireAuth, async (req, res) => {
  if (!config.composio.enabled) return res.json({ enabled: false, apps: [] });
  try {
    const connected = await composio.listConnections(req.user, { fresh: true });
    const byApp = new Map(connected.map((a) => [a.toolkit, a]));
    res.json({
      enabled: true,
      apps: composio.availableApps().map((slug) => ({
        app: slug,
        name: composio.appName(slug),
        connected: byApp.has(slug),
      })),
    });
  } catch (e) {
    console.error('[integrations/list]', e.message);
    res.status(502).json({ error: 'integrations_unavailable' });
  }
});

router.post('/integrations/:app/connect', requireAuth, async (req, res) => {
  if (!config.composio.enabled) return notConfigured(res);
  try {
    const r = await composio.connectLink(req.user, req.params.app);
    if (r.error) return res.status(400).json(r);
    res.json(r);
  } catch (e) {
    console.error('[integrations/connect]', e.message);
    res.status(502).json({ error: 'connect_failed' });
  }
});

router.delete('/integrations/:app', requireAuth, async (req, res) => {
  if (!config.composio.enabled) return notConfigured(res);
  try {
    const r = await composio.disconnect(req.user, req.params.app);
    if (r.error) return res.status(404).json(r);
    try {
      require('../db/agentActions').log(req.user.id, {
        kind: 'integration.disconnect', summary: `Disconnected ${r.app_name}`, source: 'chat',
      });
    } catch (_) { /* audit is best-effort */ }
    res.json(r);
  } catch (e) {
    console.error('[integrations/disconnect]', e.message);
    res.status(502).json({ error: 'disconnect_failed' });
  }
});

// Post-login landing page. Composio appends ?status=success|failed. We never
// echo query params into the HTML (no reflected XSS) — just pick a fixed message.
const callbackRouter = express.Router();
callbackRouter.get('/auth/integrations/callback', (req, res) => {
  const ok = req.query.status !== 'failed';
  const title = ok ? 'Connected ✅' : 'Connection failed';
  const body = ok
    ? 'You can close this tab and go back to WhatsApp — just ask Wingman what you need.'
    : 'Something went wrong. Go back to WhatsApp and ask Wingman for a fresh connect link.';
  res.type('html').send(
    `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<title>Wingman</title><body style="font-family:system-ui,sans-serif;max-width:32rem;margin:15vh auto;padding:0 1rem;text-align:center">` +
    `<h1>${title}</h1><p>${body}</p></body>`,
  );
});

module.exports = { router, callbackRouter };
