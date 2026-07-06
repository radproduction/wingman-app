'use strict';

/**
 * Phase 2 self-test: exercises the phone+OTP auth backend end-to-end against a
 * live Express instance (WhatsApp disabled so OTP is surfaced in the response).
 *
 * Run: DISABLE_WHATSAPP=1 NODE_ENV=development node scripts/test-auth-flow.js
 */

process.env.DISABLE_WHATSAPP = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_PATH = process.env.DATABASE_PATH || './data/test-auth-flow.db';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Fresh DB for a clean run.
const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH);
try { fs.rmSync(dbPath, { force: true }); } catch (_) {}

const app = require('../src/server');
const config = require('../src/config');

const BASE = `http://127.0.0.1:${config.port}`;
const PHONE = '+971 50 111 2233';
const DIGITS = '971501112233';

async function j(method, url, { body, token } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch (_) {}
  return { status: res.status, data };
}

async function main() {
  // Give the server a moment to bind.
  await new Promise((r) => setTimeout(r, 800));

  console.log('1) request-otp (invalid phone → 400)');
  let r = await j('POST', '/api/auth/request-otp', { body: { phone: '123' } });
  assert.strictEqual(r.status, 400, 'short phone should 400');

  console.log('2) request-otp (valid) → dev_code present');
  r = await j('POST', '/api/auth/request-otp', { body: { phone: PHONE } });
  assert.strictEqual(r.status, 200, 'request-otp should 200');
  assert.strictEqual(r.data.sent, true);
  assert.ok(r.data.dev_code, 'dev_code should be exposed when WhatsApp is down');
  const code = r.data.dev_code;
  console.log('   dev_code =', code);

  console.log('3) verify-otp (wrong code → 400 mismatch)');
  r = await j('POST', '/api/auth/verify-otp', { body: { phone: PHONE, code: '000000' } });
  assert.strictEqual(r.status, 400);
  assert.strictEqual(r.data.reason, 'mismatch');

  console.log('4) verify-otp (correct) → token + user, creates user');
  r = await j('POST', '/api/auth/verify-otp', { body: { phone: PHONE, code } });
  assert.strictEqual(r.status, 200, 'verify-otp should 200');
  assert.ok(r.data.token, 'token returned');
  assert.strictEqual(r.data.user.phone, DIGITS, 'phone normalized to digits');
  assert.strictEqual(r.data.user.onboarding_complete, false);
  const token = r.data.token;

  console.log('5) verify-otp reuse of consumed code → 400 no_code');
  r = await j('POST', '/api/auth/verify-otp', { body: { phone: PHONE, code } });
  assert.strictEqual(r.status, 400);
  assert.ok(['no_code', 'expired'].includes(r.data.reason));

  console.log('6) /api/auth/me without token → 401');
  r = await j('GET', '/api/auth/me');
  assert.strictEqual(r.status, 401);

  console.log('7) /api/auth/me with token → user');
  r = await j('GET', '/api/auth/me', { token });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.user.phone, DIGITS);

  console.log('8) PATCH /api/me (auth) → updates settings');
  r = await j('PATCH', '/api/me', {
    token,
    body: {
      name: 'Aamir',
      timezone: 'Asia/Dubai',
      proactiveness_level: 'high',
      enabled_skills: ['travel_assistant', 'bill_tracker'],
      tone: 'friendly',
      communication_style: 'concise',
      briefing_time: '07:00',
      debrief_time: '20:00',
    },
  });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.user.name, 'Aamir');
  assert.strictEqual(r.data.user.proactiveness_level, 'high');
  assert.deepStrictEqual(r.data.user.enabled_skills, ['travel_assistant', 'bill_tracker']);

  console.log('9) PATCH /api/me WITHOUT token → 401');
  r = await j('PATCH', '/api/me', { body: { name: 'Nope' } });
  assert.strictEqual(r.status, 401);

  console.log('10) POST /api/onboarding/complete (auth) → onboarding_complete true');
  r = await j('POST', '/api/onboarding/complete', { token, body: { communication_style: 'detailed' } });
  assert.strictEqual(r.status, 200);
  assert.strictEqual(r.data.user.onboarding_complete, true);
  assert.strictEqual(r.data.user.communication_style, 'detailed');

  console.log('11) GET /api/dashboard unauthenticated → still serves (mock/dev)');
  r = await j('GET', '/api/dashboard');
  assert.strictEqual(r.status, 200);
  assert.ok(r.data.user, 'dashboard returns a user block');

  console.log('12) logout → me now 401');
  r = await j('POST', '/api/auth/logout', { token });
  assert.strictEqual(r.status, 200);
  r = await j('GET', '/api/auth/me', { token });
  assert.strictEqual(r.status, 401);

  console.log('\nALL AUTH-FLOW ASSERTIONS PASSED ✅');
  process.exit(0);
}

main().catch((err) => {
  console.error('\nAUTH-FLOW TEST FAILED ❌\n', err);
  process.exit(1);
});
