'use strict';

const express = require('express');
const googleAuth = require('./googleAuth');
const wa = require('../whatsapp/client');

const router = express.Router();

/**
 * GET /auth/google?phone=9715XXXXXXX
 * Redirects the user to Google's consent screen (combined calendar + gmail).
 */
router.get('/auth/google', (req, res) => {
  const phone = (req.query.phone || '').toString();
  if (!phone) {
    return res.status(400).send('Missing phone parameter.');
  }
  const url = googleAuth.getAuthUrl(phone);
  res.redirect(url);
});

/**
 * GET /auth/google/callback?code=...&state=<phone>
 * Exchanges the code for tokens, stores them, confirms via WhatsApp, and
 * kicks off an initial email scan when Gmail was connected.
 */
router.get('/auth/google/callback', async (req, res) => {
  const { code, state, error } = req.query;

  if (error) {
    return res.status(400).send(`Authorization failed: ${error}`);
  }
  if (!code) {
    return res.status(400).send('Missing authorization code.');
  }

  const phone = (state || '').toString();

  try {
    const user = await googleAuth.handleCallback(code.toString(), phone);

    const calConnected = googleAuth.isConnected(user);
    const emailConnected = googleAuth.isEmailConnected(user);

    // Best-effort WhatsApp confirmations
    try {
      if (wa.ready() && phone) {
        if (calConnected) {
          await wa.sendMessage(phone, "Calendar connected! \u2713 Try asking me \"what's my schedule tomorrow?\"");
        }
        if (emailConnected) {
          await wa.sendMessage(phone, "Email connected! \u2713 I'll start scanning your inbox now.");
        }
      }
    } catch (waErr) {
      console.warn('[auth] Could not send WhatsApp confirmation:', waErr.message);
    }

    // Kick off an initial inbox scan (non-blocking)
    if (emailConnected) {
      try {
        const emailScanner = require('../services/emailScanner');
        emailScanner.scanUser(user.id).catch((e) =>
          console.warn('[auth] initial scan failed:', e.message)
        );
      } catch (e) {
        console.warn('[auth] could not start initial scan:', e.message);
      }
    }

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>✅ Google account connected!</h2>
        <p>${calConnected ? 'Calendar' : ''}${calConnected && emailConnected ? ' &amp; ' : ''}${emailConnected ? 'Gmail' : ''} linked to Wingman.</p>
        <p>You can close this tab and head back to WhatsApp.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('[auth] Callback error:', err);
    res.status(500).send(`Failed to connect Google account: ${err.message}`);
  }
});

module.exports = router;
