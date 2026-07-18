'use strict';

const crypto = require('crypto');
const config = require('../config');

/**
 * Shopify OAuth for merchants connecting their store.
 *
 * Apps created in the Shopify Dev Dashboard are OAuth apps — they never expose a
 * static Admin API token. The merchant approves the app and Shopify hands back a
 * per-store access token, which we store exactly like the old manual token.
 */

/** Accept "mystore", "mystore.myshopify.com" or a pasted URL → canonical host. */
function normalizeShop(input) {
  let s = String(input || '').trim().toLowerCase();
  s = s.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\s/g, '');
  if (!s) return '';
  if (!s.endsWith('.myshopify.com')) {
    // Strip any other domain suffix the merchant may have typed.
    s = `${s.replace(/\..*$/, '')}.myshopify.com`;
  }
  return s;
}

/** Shopify only permits redirects back to its own admin domains. */
function isValidShop(shop) {
  return /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(shop);
}

function redirectUri() {
  return `${config.publicBaseUrl}/auth/shopify/callback`;
}

/** Build the consent URL the merchant is sent to. */
function buildAuthUrl(shop, state) {
  const url = new URL(`https://${shop}/admin/oauth/authorize`);
  url.searchParams.set('client_id', config.shopify.clientId);
  url.searchParams.set('scope', config.shopify.scopes);
  url.searchParams.set('redirect_uri', redirectUri());
  url.searchParams.set('state', state);
  return url.toString();
}

/**
 * Verify the HMAC Shopify signs every callback with. Without this check anyone
 * could forge a callback and attach an arbitrary store to a user.
 */
function verifyHmac(query) {
  const secret = config.shopify.clientSecret;
  if (!secret) return false;
  const { hmac, signature, ...rest } = query || {};
  if (!hmac) return false;

  const message = Object.keys(rest)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(rest[k])}`)
    .join('&');

  const digest = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const a = Buffer.from(digest, 'utf8');
  const b = Buffer.from(String(hmac), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Swap the one-time code for a lasting Admin API access token. */
async function exchangeCode(shop, code) {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.shopify.clientId,
      client_secret: config.shopify.clientSecret,
      code,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`SHOPIFY_TOKEN_EXCHANGE_FAILED${data.error ? `: ${data.error}` : ''}`);
  }
  return { accessToken: data.access_token, scope: data.scope || null };
}

module.exports = {
  normalizeShop, isValidShop, buildAuthUrl, verifyHmac, exchangeCode, redirectUri,
};
