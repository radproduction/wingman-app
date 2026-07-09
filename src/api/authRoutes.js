'use strict';

/**
 * Phone + OTP authentication for the Wingman web app.
 *
 * Flow:
 *   1. POST /api/auth/request-otp  { phone }
 *        → creates a 6-digit OTP, tries to deliver it via Wingman's WhatsApp
 *          number. In dev (config.auth.exposeOtpInDev) the code is also
 *          returned in the response so the app can be tested without a live
 *          WhatsApp pairing.
 *   2. POST /api/auth/verify-otp   { phone, code }
 *        → verifies the code, finds-or-creates the user, mints a session
 *          token, returns { token, user }.
 *   3. POST /api/auth/logout       (Authorization: Bearer <token>)
 *        → destroys the session.
 *   4. GET  /api/auth/me           (Authorization: Bearer <token>)
 *        → returns the current user (public projection).
 *
 * Wingman runs on its OWN WhatsApp number; OTP delivery uses that number.
 */

const express = require('express');
const router = express.Router();

const config = require('../config');
const auth = require('../db/auth');
const usersRepo = require('../db/users');
const wa = require('../whatsapp/client');
const { readToken } = require('./middleware/auth');

/** Normalize a user-entered phone into digits only (E.164 without '+'). */
function normalizePhone(input) {
  if (!input) return '';
  return String(input).replace(/[^0-9]/g, '');
}

// ── POST /api/auth/request-otp ────────────────────────────────────────
router.post('/request-otp', async (req, res) => {
  const phone = normalizePhone((req.body || {}).phone);
  if (!phone || phone.length < 8) {
    return res.status(400).json({ error: 'A valid phone number is required.' });
  }

  try {
    const otp = auth.createOtp(phone, {
      purpose: 'login',
      ttlSeconds: config.auth.otpTtlSeconds,
    });

    // Deliver via Wingman's own WhatsApp number using the approved OTP
    // authentication template, which reaches new users too (no 24h window
    // restriction, unlike plain text). sendOtp falls back to plain text on the
    // dev whatsapp-web.js path.
    let delivered = false;
    try {
      if (wa.ready()) {
        await wa.sendOtp(phone, otp.code);
        delivered = true;
      }
    } catch (waErr) {
      console.warn('[auth] OTP WhatsApp delivery failed:', waErr.message);
    }

    const payload = { sent: true, delivered };

    // Only surface the code on-screen when dev exposure is explicitly enabled
    // AND WhatsApp delivery did not succeed — so a real, delivered OTP is never
    // leaked into the UI in front of a client. EXPOSE_OTP_IN_DEV=0 in production.
    if (config.auth.exposeOtpInDev && !delivered) {
      console.log(`[auth] DEV OTP for ${phone}: ${otp.code}`);
      payload.dev_code = otp.code;
    }

    res.json(payload);
  } catch (err) {
    console.error('[auth] request-otp error:', err);
    res.status(500).json({ error: 'Could not create verification code.' });
  }
});

// ── POST /api/auth/verify-otp ─────────────────────────────────────────
router.post('/verify-otp', (req, res) => {
  const body = req.body || {};
  const phone = normalizePhone(body.phone);
  const code = (body.code || '').toString().trim();

  if (!phone || !code) {
    return res.status(400).json({ error: 'Phone and code are required.' });
  }

  const result = auth.verifyOtp(phone, code);
  if (!result.ok) {
    const map = {
      no_code: 'No verification code found. Please request a new one.',
      expired: 'That code has expired. Please request a new one.',
      too_many_attempts: 'Too many attempts. Please request a new code.',
      mismatch: 'That code is incorrect. Please try again.',
    };
    return res.status(400).json({ error: map[result.reason] || 'Verification failed.', reason: result.reason });
  }

  // Find or create the user by phone.
  let user = usersRepo.getByPhone(phone);
  if (!user) {
    user = usersRepo.create({ phone });
  }

  const session = auth.createSession(user.id, { ttlDays: config.auth.sessionTtlDays });

  res.json({
    token: session.token,
    expires_at: session.expiresAt,
    user: usersRepo.toPublic(user),
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────
router.post('/logout', (req, res) => {
  const token = readToken(req);
  try {
    auth.destroySession(token);
  } catch (_) { /* ignore */ }
  res.json({ ok: true });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const token = readToken(req);
  const userId = auth.resolveSession(token);
  if (!userId) return res.status(401).json({ error: 'Not authenticated.' });
  const user = usersRepo.getById(userId);
  if (!user) return res.status(401).json({ error: 'Not authenticated.' });
  res.json({ user: usersRepo.toPublic(user) });
});

module.exports = router;
