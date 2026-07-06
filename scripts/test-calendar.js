'use strict';

// Calendar integration test.
// - Verifies the OAuth consent URL is well-formed with the right scopes.
// - Verifies "connect calendar" produces the personalized link.
// - Verifies the Claude tool-use loop calls the calendar tools correctly,
//   using a MOCKED calendar service (so no real Google login is needed).

const { initSchema } = require('../src/db');
const usersRepo = require('../src/db/users');
const googleAuth = require('../src/auth/googleAuth');

// ── Mock the calendar service BEFORE the engine requires it ──
const mockCalls = [];
const calendarService = require('../src/services/calendar');
calendarService.getEvents = async (userId, range) => {
  mockCalls.push(['getEvents', range]);
  return {
    label: range,
    events: [
      { gcalEventId: 'evt1', title: 'Team standup', startTime: '2026-07-02T10:00:00+04:00', endTime: '2026-07-02T10:30:00+04:00', location: 'Zoom' },
      { gcalEventId: 'evt2', title: 'Client call with Fahad', startTime: '2026-07-02T14:00:00+04:00', endTime: '2026-07-02T14:30:00+04:00', location: '' },
    ],
  };
};
calendarService.createEvent = async (userId, opts) => {
  mockCalls.push(['createEvent', opts]);
  return { gcalEventId: 'new123', title: opts.title, startTime: opts.startTime, endTime: opts.endTime };
};
calendarService.checkConflicts = async (userId, s, e) => {
  mockCalls.push(['checkConflicts', s, e]);
  return { free: true, conflicts: [] };
};

const engine = require('../src/engine/conversation');

const PHONE = '971500000009';

async function send(text) {
  console.log(`\nUSER > ${text}`);
  const { reply } = await engine.handleMessage({ text, phoneNumber: PHONE });
  console.log(`WINGMAN > ${reply}`);
  return reply;
}

async function main() {
  initSchema();

  // 1) OAuth URL
  const url = googleAuth.getAuthUrl(PHONE);
  console.log('=== OAuth URL ===');
  console.log(url);
  const okScopes = url.includes('calendar.events') && url.includes('calendar');
  const okState = url.includes(`state=${PHONE}`);
  const okOffline = url.includes('access_type=offline');
  console.log(`scopes ok=${okScopes}, state ok=${okState}, offline ok=${okOffline}`);

  // 2) Onboard the user quickly
  console.log('\n=== ONBOARD ===');
  await send('hi');
  await send('Aamir');
  await send('Asia/Dubai');
  await send('9 to 6');

  // 3) Connect-calendar intent (user not yet connected)
  console.log('\n=== CONNECT CALENDAR INTENT ===');
  await send('connect calendar');

  // 4) Simulate the OAuth callback storing a token so the user is "connected"
  const user = usersRepo.getByPhone(PHONE);
  usersRepo.update(user.id, { calendar_token: JSON.stringify({ access_token: 'fake', refresh_token: 'fake', expiry_date: Date.now() + 3600e3 }) });
  console.log('connected now =', googleAuth.isConnected(usersRepo.getByPhone(PHONE)));

  // 5) Calendar intents via the tool-use loop (mocked service)
  console.log('\n=== SCHEDULE QUERY ===');
  await send("what's my schedule tomorrow?");

  console.log('\n=== CREATE EVENT ===');
  await send('schedule a meeting with Ali at 3pm tomorrow');

  console.log('\n=== FREE CHECK ===');
  await send('am I free at 5pm tomorrow?');

  console.log('\n=== MOCK CALLS MADE ===');
  console.log(JSON.stringify(mockCalls, null, 2));

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
