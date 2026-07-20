'use strict';

const config = require('../config');
const registry = require('./wearableProviders');
const accountsRepo = require('../db/wearableAccounts');
const healthRepo = require('../db/healthData');
const usersRepo = require('../db/users');

/**
 * One OAuth flow and one sync loop for every wearable brand.
 *
 * The brand-specific parts (endpoints, scopes, how to read a reading) live in
 * wearableProviders; everything here is the same regardless of provider, so
 * supporting a new device never means touching this file.
 */

const REDIRECT_PATH = '/auth/wearable/callback';
const DEFAULT_SINCE_DAYS = 7;
// Refresh a little early — a token that expires mid-sync would fail the pull.
const EXPIRY_SKEW_MS = 60000;

function redirectUri() {
  return `${config.publicBaseUrl}${REDIRECT_PATH}`;
}

/** Consent URL for one provider. `state` carries phone + provider back. */
function connectUrl(provider, phone) {
  const p = registry.get(provider);
  if (!p) throw new Error('UNKNOWN_PROVIDER');
  if (!registry.isConfigured(p)) throw new Error('PROVIDER_NOT_CONFIGURED');

  const { clientId } = registry.credentials(p);
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri(),
    scope: p.scopes.join(p.scopeSeparator || ' '),
    state: `${phone || ''}:${p.id}`,
  });
  return `${p.authUrl}?${params.toString()}`;
}

function parseState(state) {
  const raw = String(state || '');
  const idx = raw.lastIndexOf(':');
  if (idx === -1) return { phone: raw, provider: null };
  return { phone: raw.slice(0, idx), provider: raw.slice(idx + 1) };
}

async function exchange(p, params) {
  const { clientId, clientSecret } = registry.credentials(p);
  const body = new URLSearchParams({ ...params, client_id: clientId, client_secret: clientSecret });

  const res = await fetch(p.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: body.toString(),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    const detail = (data && (data.error_description || data.error)) || `HTTP ${res.status}`;
    throw new Error(`TOKEN_EXCHANGE_FAILED: ${detail}`);
  }
  return data;
}

function expiryFrom(tokenResponse) {
  const secs = Number(tokenResponse.expires_in);
  if (!Number.isFinite(secs)) return null;
  return new Date(Date.now() + secs * 1000).toISOString();
}

/** Finish the consent handshake and store the connection. */
async function handleCallback(code, state) {
  const { phone, provider } = parseState(state);
  const p = registry.get(provider);
  if (!p) throw new Error('UNKNOWN_PROVIDER');

  let user = usersRepo.getByPhone(phone);
  if (!user) user = usersRepo.create({ phone });

  const tokens = await exchange(p, {
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri(),
  });

  accountsRepo.save(user.id, p.id, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: expiryFrom(tokens),
    scopes: tokens.scope || p.scopes.join(' '),
  });

  return { user, provider: p };
}

/**
 * A usable access token, refreshing first when it has expired.
 * WHOOP rotates refresh tokens, so whatever comes back is always stored.
 */
async function accessTokenFor(userId, p) {
  const acct = accountsRepo.get(userId, p.id);
  if (!acct || !acct.accessToken) throw new Error('NOT_CONNECTED');

  const expired = acct.expires_at && Date.parse(acct.expires_at) - EXPIRY_SKEW_MS <= Date.now();
  if (!expired) return acct.accessToken;

  if (!acct.refreshToken) throw new Error('RECONNECT_REQUIRED');

  const tokens = await exchange(p, {
    grant_type: 'refresh_token',
    refresh_token: acct.refreshToken,
    ...(p.scopes.includes('offline') ? { scope: 'offline' } : {}),
  });

  accountsRepo.save(userId, p.id, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,     // rotated for some providers
    expiresAt: expiryFrom(tokens),
    scopes: tokens.scope,
  });
  return tokens.access_token;
}

/** Pull one provider for one user into the shared health store. */
async function syncOne(userId, providerId, { days = DEFAULT_SINCE_DAYS } = {}) {
  const p = registry.get(providerId);
  if (!p) return { saved: 0, error: 'UNKNOWN_PROVIDER' };

  const since = Date.now() - days * 86400000;
  try {
    const token = await accessTokenFor(userId, p);
    const readings = await p.fetchReadings(token, { since });

    let saved = 0;
    for (const r of readings) {
      const stored = healthRepo.record(userId, { ...r, source: p.id });
      if (stored.saved) saved += 1;
    }
    accountsRepo.markSynced(userId, p.id);
    return { saved, provider: p.id };
  } catch (err) {
    const msg = (err && err.message) || 'sync_failed';
    // Surfaced in the UI so a dead connection is visible rather than silent.
    accountsRepo.markSynced(userId, p.id, { error: msg.slice(0, 200) });
    return { saved: 0, provider: p.id, error: msg };
  }
}

/** Every provider the user has connected. */
async function syncUser(userId, { days = DEFAULT_SINCE_DAYS } = {}) {
  const accounts = accountsRepo.listForUser(userId);
  const results = [];
  for (const acct of accounts) {
    results.push(await syncOne(userId, acct.provider, { days }));
  }
  return results;
}

/** Scheduler sweep across everyone. Never throws. */
async function syncAllUsers({ days = 2 } = {}) {
  const accounts = accountsRepo.listAll();
  let saved = 0;
  for (const acct of accounts) {
    try {
      const r = await syncOne(acct.user_id, acct.provider, { days });
      saved += r.saved || 0;
    } catch (err) {
      console.warn('[wearables] sync failed:', acct.provider, err.message);
    }
  }
  if (saved) console.log(`[wearables] synced ${saved} reading(s)`);
  return saved;
}

/** What the Settings screen shows: every brand, and where the user stands. */
function statusFor(user) {
  const connected = accountsRepo.listForUser(user.id);
  const byId = new Map(connected.map((a) => [a.provider, a]));
  const phone = String(user.phone || '').replace(/[^0-9]/g, '');

  return Object.values(registry.PROVIDERS).map((p) => {
    const acct = byId.get(p.id);
    return {
      id: p.id,
      label: p.label,
      blurb: p.blurb,
      available: registry.isConfigured(p),
      connected: !!acct,
      last_synced_at: acct ? acct.last_synced_at : null,
      last_error: acct ? acct.last_error : null,
      connect_url: registry.isConfigured(p)
        ? `${config.publicBaseUrl}/auth/wearable/${p.id}?phone=${encodeURIComponent(phone)}`
        : null,
    };
  });
}

function disconnect(userId, providerId) {
  accountsRepo.remove(userId, providerId);
}

module.exports = {
  connectUrl, handleCallback, syncOne, syncUser, syncAllUsers,
  statusFor, disconnect, parseState, REDIRECT_PATH,
};
