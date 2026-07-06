'use strict';

/**
 * Auth middleware + helpers for the Wingman web API.
 *
 * Reads a bearer token from either `Authorization: Bearer <token>` or the
 * `x-session-token` header, resolves it to a user, and attaches `req.userId`
 * and `req.user` (hydrated).
 *
 * Two exports:
 *   - readToken(req)          → extract the raw token string (or null)
 *   - requireAuth             → hard gate: 401 when no valid session
 *   - attachUserOptional      → soft gate: attaches user when present, else
 *                               lets the request through (used so mock/demo
 *                               data keeps working for unauthenticated dev
 *                               access / investor screenshots)
 */

const auth = require('../../db/auth');
const usersRepo = require('../../db/users');

/** Extract a bearer/session token from the request headers. */
function readToken(req) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  if (header && /^Bearer\s+/i.test(header)) {
    return header.replace(/^Bearer\s+/i, '').trim();
  }
  const alt = req.headers['x-session-token'];
  if (alt) return String(alt).trim();
  return null;
}

/** Resolve the token to a hydrated user and attach it (or null). */
function hydrateFromToken(req) {
  const token = readToken(req);
  if (!token) return null;
  const userId = auth.resolveSession(token);
  if (!userId) return null;
  const user = usersRepo.getById(userId);
  if (!user) return null;
  req.userId = user.id;
  req.user = user;
  req.sessionToken = token;
  return user;
}

/** Hard gate: reject with 401 unless a valid session is present. */
function requireAuth(req, res, next) {
  const user = hydrateFromToken(req);
  if (!user) return res.status(401).json({ error: 'Authentication required.' });
  return next();
}

/**
 * Soft gate: attach the user when a valid session exists, but always call
 * next(). Downstream handlers decide how to behave when `req.user` is absent
 * (in dev they fall back to the rich mock dataset for screenshots).
 */
function attachUserOptional(req, res, next) {
  try { hydrateFromToken(req); } catch (_) { /* ignore */ }
  return next();
}

module.exports = { readToken, requireAuth, attachUserOptional, hydrateFromToken };
