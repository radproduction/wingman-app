'use strict';

// Standalone test of the conversation engine (no WhatsApp needed).
// Simulates an inbound message sequence for a single phone number.

const { initSchema } = require('../src/db');
const engine = require('../src/engine/conversation');
const tasksRepo = require('../src/db/tasks');
const usersRepo = require('../src/db/users');

const PHONE = '971500000001';

async function send(text) {
  console.log(`\nUSER > ${text}`);
  const { reply } = await engine.handleMessage({ text, phoneNumber: PHONE });
  console.log(`WINGMAN > ${reply}`);
  return reply;
}

async function main() {
  initSchema();

  console.log('=== ONBOARDING FLOW (new user) ===');
  await send('hi');                       // greeting + ask name
  await send("I'm Aamir");                // save name -> ask timezone
  await send('Asia/Dubai');               // save tz -> ask hours
  await send('9am to 6pm');               // save hours -> complete

  console.log('\n=== CAPABILITIES ===');
  await send('what can you do?');

  console.log('\n=== TASK CREATION ===');
  await send('remind me to call Ali at 4pm');

  // Give the async task extraction a moment (it runs within handleMessage,
  // so it should already be persisted by now).
  const user = usersRepo.getByPhone(PHONE);
  const tasks = tasksRepo.listForUser(user.id, { includeCompleted: true });
  console.log('\n=== TASKS IN DB ===');
  console.log(JSON.stringify(tasks, null, 2));

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
