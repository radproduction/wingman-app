'use strict';

// Email intelligence test with a MOCKED Gmail service (no real login).
// Verifies: Claude analysis JSON, email_items persistence, fan-out to
// bills/deliveries/travel, urgent WhatsApp alert, and the WhatsApp digest.

const { initSchema } = require('../src/db');
const usersRepo = require('../src/db/users');
const emailItemsRepo = require('../src/db/emailItems');
const billsRepo = require('../src/db/bills');
const deliveriesRepo = require('../src/db/deliveries');
const travelRepo = require('../src/db/travel');

// Mock Gmail BEFORE the scanner requires it
const gmail = require('../src/services/gmail');
const SAMPLE = {
  m1: {
    gmailId: 'm1',
    subject: 'Invoice #4471 — Emergent Cloud',
    sender: 'Billing <billing@emergent.com>',
    body: 'Your Emergent Cloud invoice of PKR 250,000 is due on 2026-07-15. Please pay to avoid service interruption.',
    snippet: 'invoice due',
  },
  m2: {
    gmailId: 'm2',
    subject: 'Your Amazon order has shipped',
    sender: 'Amazon <ship@amazon.ae>',
    body: 'Your order "Sony WH-1000XM5 Headphones" from Amazon.ae has shipped via Aramex, tracking 1234567890, expected delivery 2026-07-05.',
    snippet: 'order shipped',
  },
  m3: {
    gmailId: 'm3',
    subject: 'Emirates Booking Confirmation EK502',
    sender: 'Emirates <no-reply@emirates.com>',
    body: 'Your flight EK502 from Dubai (DXB) to Karachi (KHI) on 2026-07-10 departs at 03:30. Confirmation code ABC123.',
    snippet: 'flight confirmed',
  },
  m4: {
    gmailId: 'm4',
    subject: 'URGENT: Server outage affecting production',
    sender: 'Ops Team <ops@rad.com>',
    body: 'Production is down for 3 clients. We need your approval to fail over to the backup region immediately. Please respond ASAP.',
    snippet: 'server down',
  },
};
gmail.listMessageIds = async () => Object.keys(SAMPLE);
gmail.getMessage = async (user, id) => SAMPLE[id];

// Capture WhatsApp alerts instead of really sending
const wa = require('../src/whatsapp/client');
const alerts = [];
wa.ready = () => true;
wa.sendMessage = async (to, text) => { alerts.push({ to, text }); return { id: { _serialized: 'x' } }; };

const emailScanner = require('../src/services/emailScanner');
const emailDigest = require('../src/services/emailDigest');

async function main() {
  initSchema();

  // Create a user and mark email connected
  const user = usersRepo.create({ phone: '971500000077' });
  usersRepo.update(user.id, {
    name: 'Aamir', timezone: 'Asia/Dubai',
    gmail_token: JSON.stringify({ access_token: 'fake', refresh_token: 'fake', expiry_date: Date.now() + 3600e3 }),
    preferences: { onboarding: { step: 'complete', complete: true } },
  });

  console.log('=== RUNNING SCAN (Claude will classify 4 emails) ===');
  const result = await emailScanner.scanUser(user.id);
  console.log('scan result:', JSON.stringify(result));

  console.log('\n=== EMAIL_ITEMS ===');
  for (const e of emailItemsRepo.listForUser(user.id)) {
    console.log(`- [${e.category}/${e.detected_type}] ${e.subject} :: ${e.summary}`);
  }

  console.log('\n=== BILLS ===');
  console.log(JSON.stringify(billsRepo.listForUser(user.id), null, 2));
  console.log('\n=== DELIVERIES ===');
  console.log(JSON.stringify(deliveriesRepo.listForUser(user.id), null, 2));
  console.log('\n=== TRAVEL ===');
  console.log(JSON.stringify(travelRepo.listForUser(user.id), null, 2));

  console.log('\n=== URGENT WHATSAPP ALERTS ===');
  console.log(JSON.stringify(alerts, null, 2));

  console.log('\n=== EMAIL DIGEST (WhatsApp) ===');
  console.log(emailDigest.buildDigest(user.id));

  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
