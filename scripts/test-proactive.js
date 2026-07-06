'use strict';

// Session 5 self-test: proactive services + conversational intents.
// Uses a mocked WhatsApp send (captures outbound), real DB, no live Claude
// needed except the follow-up extractor (which we call directly with a sample).

const { initSchema, db } = require('../src/db');
const usersRepo = require('../src/db/users');
const tasksRepo = require('../src/db/tasks');
const billsRepo = require('../src/db/bills');
const deliveriesRepo = require('../src/db/deliveries');
const calEventsRepo = require('../src/db/calendarEvents');
const followupsRepo = require('../src/db/followups');
const emailItemsRepo = require('../src/db/emailItems');
const tt = require('../src/utils/time');

// Mock WhatsApp
const wa = require('../src/whatsapp/client');
const outbox = [];
wa.ready = () => true;
wa.sendMessage = async (to, text) => { outbox.push({ to, text }); return { id: { _serialized: 'x' } }; };

const morningBriefing = require('../src/services/morningBriefing');
const endOfDayWrap = require('../src/services/endOfDayWrap');
const billAlerts = require('../src/services/billAlerts');
const deliveryAlerts = require('../src/services/deliveryAlerts');
const taskIntents = require('../src/engine/taskIntents');

function iso(tz, dayOffset, hhmm) {
  const base = tt.startOfDayISO(tz, dayOffset);
  return base.replace('T00:00:00', `T${hhmm}:00`);
}

async function main() {
  initSchema();
  const TZ = 'Asia/Dubai';
  const now = new Date();

  const user = usersRepo.create({ phone: '971500000055' });
  usersRepo.update(user.id, {
    name: 'Aamir', timezone: TZ,
    gmail_token: JSON.stringify({ access_token: 'x' }),
    preferences: { onboarding: { step: 'complete', complete: true } },
  });
  const u = usersRepo.getById(user.id);

  // Seed calendar events for today
  calEventsRepo.upsert(u.id, { gcalEventId: 'e1', title: 'Team standup', location: 'Zoom', startTime: iso(TZ, 0, '10:00'), endTime: iso(TZ, 0, '10:30'), status: 'confirmed' });
  calEventsRepo.upsert(u.id, { gcalEventId: 'e2', title: 'Client call with Fahad', startTime: iso(TZ, 0, '14:00'), endTime: iso(TZ, 0, '15:00'), status: 'confirmed' });
  // Tomorrow event
  calEventsRepo.upsert(u.id, { gcalEventId: 'e3', title: 'Product review', startTime: iso(TZ, 1, '11:00'), endTime: iso(TZ, 1, '12:00'), status: 'confirmed' });

  // Seed tasks: two due today, one overdue
  tasksRepo.create({ userId: u.id, title: 'Send Q3 proposal', dueDate: iso(TZ, 0, '17:00') });
  tasksRepo.create({ userId: u.id, title: 'Review design mockups', dueDate: iso(TZ, 0, '16:00') });
  tasksRepo.create({ userId: u.id, title: 'Call the bank', dueDate: iso(TZ, -1, '12:00') });

  // Seed bills: one due in 2 days, one overdue
  const todayDate = tt.startOfDayISO(TZ, 0).slice(0, 10);
  const in2 = tt.startOfDayISO(TZ, 2).slice(0, 10);
  const past = tt.startOfDayISO(TZ, -3).slice(0, 10);
  billsRepo.upsert(u.id, { name: 'Emergent Cloud', amount: 250000, currency: 'PKR', dueDate: in2, status: 'pending' });
  billsRepo.upsert(u.id, { name: 'AMEX Card', amount: 4200, currency: 'AED', dueDate: past, status: 'pending' });

  // Seed a delivery with a return window closing in 2 days
  deliveriesRepo.upsert(u.id, { itemName: 'Sony WH-1000XM5', merchant: 'Amazon.ae', carrier: 'Aramex', trackingNumber: 'TRK1', status: 'in_transit', estimatedDelivery: in2, returnWindowEnds: in2 });

  // Seed a couple of email items for counts
  emailItemsRepo.upsert(u.id, { gmailId: 'g1', subject: 'Urgent: outage', sender: 'Ops', category: 'urgent', summary: 'x', actionNeeded: true });
  emailItemsRepo.upsert(u.id, { gmailId: 'g2', subject: 'Re: agenda', sender: 'Ali', category: 'needs_reply', summary: 'x', actionNeeded: true });

  // ── MORNING BRIEFING ──
  console.log('\n===== MORNING BRIEFING =====');
  const mb = await morningBriefing.sendForUser(u.id, { now });
  console.log(mb.text);

  // ── END OF DAY WRAP ──
  console.log('\n===== END OF DAY WRAP =====');
  const eod = await endOfDayWrap.sendForUser(u.id, { now });
  console.log(eod.text);

  // ── TASK INTENTS ──
  console.log('\n===== TASK INTENTS =====');
  console.log('[what are my tasks?]');
  console.log(taskIntents.handle(u, taskIntents.detect('what are my tasks?'), now));
  console.log('\n[what\'s overdue?]');
  console.log(taskIntents.handle(u, taskIntents.detect("what's overdue?"), now));
  console.log('\n[done with review design mockups]');
  console.log(taskIntents.handle(u, taskIntents.detect('done with review design mockups'), now));
  console.log('\n[move Send Q3 proposal to tomorrow]');
  console.log(taskIntents.handle(u, taskIntents.detect('move Send Q3 proposal to tomorrow'), now));

  // ── BILL INTENTS ──
  console.log('\n===== BILL ALERTS (9am job) =====');
  const ba = await billAlerts.alertForUser(u.id, { now });
  console.log(ba.alerts.join('\n'));
  console.log('\n[any bills due?]');
  console.log(billAlerts.buildBillsReply(u, now));
  console.log('\n[paid my amex]');
  const paidPhrase = billAlerts.detectMarkPaid('paid my amex');
  console.log('detected:', JSON.stringify(paidPhrase), '=>', billAlerts.handleMarkPaid(u, paidPhrase));

  // ── DELIVERY INTENTS ──
  console.log('\n===== DELIVERY =====');
  console.log('[where\'s my order?]');
  console.log(deliveryAlerts.buildDeliveriesReply(u));
  console.log('\n[return window check (9am job)]');
  const rw = await deliveryAlerts.returnWindowCheck(u.id, { now });
  console.log(rw.alerts.join('\n'));

  // ── FOLLOW-UPS ──
  console.log('\n===== FOLLOW-UP TRACKER =====');
  // Seed a follow-up that's overdue and check the alert
  followupsRepo.create(u.id, { type: 'promise_made', description: 'send the proposal', counterparty: 'Fahad', dueDate: iso(TZ, -1, '18:00') });
  const fu = await require('../src/services/followupTracker').checkOverdue(u.id, { now });
  console.log(fu.alerts.join('\n'));

  console.log('\n===== OUTBOX (proactive WhatsApp messages sent) =====');
  console.log('total outbound:', outbox.length);

  console.log('\n===== BRIEFINGS TABLE =====');
  const brefs = db.prepare('SELECT type, length(content) len FROM briefings WHERE user_id = ?').all(u.id);
  console.log(JSON.stringify(brefs));

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
