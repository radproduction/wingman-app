'use strict';

/**
 * Phase 3 self-test: proactiveGate level/skill logic + engine registered-user
 * gating (separate-number model bounce for unknown / un-onboarded numbers).
 *
 * Run: DISABLE_WHATSAPP=1 node scripts/test-gating.js
 */

process.env.DISABLE_WHATSAPP = '1';
process.env.NODE_ENV = process.env.NODE_ENV || 'development';
process.env.DATABASE_PATH = process.env.DATABASE_PATH || './data/test-gating.db';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, '..', process.env.DATABASE_PATH);
try { fs.rmSync(dbPath, { force: true }); } catch (_) {}

const { initSchema } = require('../src/db');
initSchema();

const usersRepo = require('../src/db/users');
const gate = require('../src/services/proactiveGate');
const engine = require('../src/engine/conversation');

function makeUser(phone, patch) {
  const u = usersRepo.create({ phone });
  return usersRepo.update(u.id, patch);
}

(async function main() {
  console.log('== proactiveGate ==');

  // low proactiveness → nothing proactive fires, even onboarded
  const low = makeUser('111', { onboarding_complete: 1, proactiveness_level: 'low' });
  for (const job of ['morning', 'wrap', 'bills', 'deliveries', 'followups', 'travel', 'meetingprep', 'taskreminder']) {
    assert.strictEqual(gate.allows(low, job), false, `low should block ${job}`);
  }
  console.log('  low: all jobs blocked ✓');

  // moderate → briefing + wrap + bills (has skill), but NOT high-only jobs
  const mod = makeUser('222', {
    onboarding_complete: 1,
    proactiveness_level: 'moderate',
    enabled_skills: ['bill_tracker'],
  });
  assert.strictEqual(gate.allows(mod, 'morning'), true, 'moderate allows morning');
  assert.strictEqual(gate.allows(mod, 'wrap'), true, 'moderate allows wrap');
  assert.strictEqual(gate.allows(mod, 'bills'), true, 'moderate + bill_tracker allows bills');
  assert.strictEqual(gate.allows(mod, 'deliveries'), false, 'moderate blocks high-only deliveries');
  assert.strictEqual(gate.allows(mod, 'travel'), false, 'moderate blocks travel');
  assert.strictEqual(gate.allows(mod, 'meetingprep'), false, 'moderate blocks meetingprep');
  console.log('  moderate: briefing/wrap/bills only ✓');

  // high but with a skill disabled → skill job blocked, core jobs allowed
  const high = makeUser('333', {
    onboarding_complete: 1,
    proactiveness_level: 'high',
    enabled_skills: ['bill_tracker', 'people_crm'], // travel + delivery + followup OFF
  });
  assert.strictEqual(gate.allows(high, 'travel'), false, 'high but travel skill off → blocked');
  assert.strictEqual(gate.allows(high, 'deliveries'), false, 'high but delivery skill off → blocked');
  assert.strictEqual(gate.allows(high, 'followups'), false, 'high but followup skill off → blocked');
  assert.strictEqual(gate.allows(high, 'bills'), true, 'high + bill_tracker → allowed');
  assert.strictEqual(gate.allows(high, 'meetingprep'), true, 'high core job → allowed');
  assert.strictEqual(gate.allows(high, 'morning'), true, 'high core job → allowed');
  console.log('  high: skill toggles respected ✓');

  // not onboarded → nothing
  const notOb = makeUser('444', { proactiveness_level: 'high' });
  assert.strictEqual(gate.allows(notOb, 'morning'), false, 'un-onboarded blocked');
  console.log('  un-onboarded: blocked ✓');

  console.log('\n== engine separate-number gating ==');

  // Unknown number → bounce, ignored:true, no user created as onboarded
  let r = await engine.handleMessage({ text: 'hi', phoneNumber: '999888777' });
  assert.strictEqual(r.ignored, true, 'unknown number bounced');
  assert.ok(/registered users/i.test(r.reply), 'bounce mentions registration');
  console.log('  unknown number → bounce ✓');

  // Un-onboarded existing user → still bounced
  r = await engine.handleMessage({ text: 'hi', phoneNumber: '444' });
  assert.strictEqual(r.ignored, true, 'un-onboarded existing user bounced');
  console.log('  existing but un-onboarded → bounce ✓');

  // Registered user with travel OFF asking about trips → should NOT hit the
  // deterministic travel handler; falls through to conversation (no crash).
  //   (We can't call Claude here without network, so just assert it doesn't
  //    take the travel branch by checking the skill gate directly.)
  assert.strictEqual(usersRepo.hasSkill(high, 'travel_assistant'), false);
  console.log('  registered user skill lookup ✓');

  console.log('\nALL GATING ASSERTIONS PASSED ✅');
  process.exit(0);
})().catch((e) => { console.error('\nGATING TEST FAILED ❌\n', e); process.exit(1); });
