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

/**
 * GET /auth/shopify?shop=mystore.myshopify.com&phone=9231XXXXXXX
 * Sends the merchant to Shopify's consent screen.
 */
router.get('/auth/shopify', (req, res) => {
  const config = require('../config');
  const shopifyAuth = require('./shopifyAuth');

  if (!config.shopify.enabled) {
    return res.status(503).send('Shopify connect is not configured on this server yet.');
  }
  const shop = shopifyAuth.normalizeShop(req.query.shop);
  const phone = (req.query.phone || '').toString();
  if (!shopifyAuth.isValidShop(shop)) {
    return res.status(400).send('Please provide a valid store domain, e.g. mystore.myshopify.com');
  }
  if (!phone) return res.status(400).send('Missing phone parameter.');

  // The phone rides in `state` so the callback can attach the store to the
  // right user (same pattern as the Google flow).
  res.redirect(shopifyAuth.buildAuthUrl(shop, phone));
});

/**
 * GET /auth/shopify/callback
 * Verifies Shopify's signature, swaps the code for an access token, and stores it.
 */
router.get('/auth/shopify/callback', async (req, res) => {
  const shopifyAuth = require('./shopifyAuth');
  const usersRepo = require('../db/users');

  const { code, shop: rawShop, state } = req.query;
  const shop = shopifyAuth.normalizeShop(rawShop);
  const phone = (state || '').toString();

  if (!code || !shopifyAuth.isValidShop(shop)) {
    return res.status(400).send('Invalid Shopify callback.');
  }
  // Reject forged callbacks — without this anyone could attach a store to a user.
  if (!shopifyAuth.verifyHmac(req.query)) {
    return res.status(400).send('Could not verify this request came from Shopify.');
  }

  try {
    const { accessToken } = await shopifyAuth.exchangeCode(shop, code.toString());

    const user = usersRepo.getByPhone(phone);
    if (!user) return res.status(400).send('No Wingman account found for that number.');
    usersRepo.update(user.id, { shopify_domain: shop, shopify_token: accessToken });

    try {
      if (wa.ready() && phone) {
        await wa.sendMessage(phone, `Shopify connected ✅ (${shop})\n\nTry asking me: "how are sales today?"`);
      }
    } catch (waErr) {
      console.warn('[auth] Shopify confirmation failed:', waErr.message);
    }

    res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;">
        <h2>✅ Shopify connected!</h2>
        <p><b>${shop}</b> is now linked to Wingman.</p>
        <p>You can close this tab — try asking “how are sales today?” on WhatsApp.</p>
      </body></html>
    `);
  } catch (err) {
    console.error('[auth] Shopify callback error:', err.message);
    res.status(500).send('Could not complete the Shopify connection. Please try again.');
  }
});

module.exports = router;
