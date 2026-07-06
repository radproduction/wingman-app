'use strict';

const { initSchema, db } = require('../src/db');
initSchema();

const cols = db.prepare('PRAGMA table_info(users)').all().map((r) => r.name);
console.log('users cols:', cols.join(', '));

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
  .all().map((r) => r.name);
console.log('tables:', tables.join(', '));

const auth = require('../src/db/auth');
const users = require('../src/db/users');

const u = users.create({ phone: '971500000001', name: 'Test' });
console.log('created user skills:', JSON.stringify(u.enabled_skills));
console.log('  proactiveness:', u.proactiveness_level, '| onboarded:', u.onboarding_complete,
  '| briefing:', u.briefing_time, '| debrief:', u.debrief_time, '| tone:', u.tone,
  '| style:', u.communication_style);

const otp = auth.createOtp('971500000001');
console.log('otp code:', otp.code);
console.log('verify wrong:', JSON.stringify(auth.verifyOtp('971500000001', '000000')));
console.log('verify right:', JSON.stringify(auth.verifyOtp('971500000001', otp.code)));

const s = auth.createSession(u.id);
console.log('session resolves correctly:', auth.resolveSession(s.token) === u.id);

const u2 = users.completeOnboarding(u.id);
console.log('after completeOnboarding:', u2.onboarding_complete);

const pub = users.toPublic(u2);
console.log('toPublic has no tokens:', !('gmail_token' in pub) && pub.gmail_connected === false);
console.log('hasSkill bill_tracker:', users.hasSkill(u2, 'bill_tracker'));
console.log('OK');
