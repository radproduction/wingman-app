'use strict';

/**
 * Session 6 self-test: Travel Assistant, People CRM, Meeting Prep.
 * Uses the real DB + real Claude (for CRM enrichment/relationship summary),
 * but mocks the WhatsApp client so proactive sends are captured, not sent.
 */

const path = require('path');
process.env.DATABASE_PATH = './data/test-session6.db';

const fs = require('fs');
const dbFile = path.join(__dirname, '..', 'data', 'test-session6.db');
for (const f of [dbFile, `${dbFile}-wal`, `${dbFile}-shm`]) { try { fs.unlinkSync(f); } catch (_) {} }

const { initSchema } = require('../src/db');
initSchema();

// ── Mock WhatsApp client so proactive sends are captured ──────────────
const outbox = [];
const waPath = require.resolve('../src/whatsapp/client');
require.cache[waPath] = {
  id: waPath,
  filename: waPath,
  loaded: true,
  exports: {
    ready: () => true,
    sendMessage: async (phone, text) => { outbox.push({ phone, text }); return { id: { _serialized: 'mock' } }; },
    sendRaw: async () => ({}),
    initWhatsApp: () => ({}),
    toChatId: (p) => `${p}@c.us`,
  },
};

const usersRepo = require('../src/db/users');
const travelRepo = require('../src/db/travel');
const contactsRepo = require('../src/db/contacts');
const emailItemsRepo = require('../src/db/emailItems');
const calendarEventsRepo = require('../src/db/calendarEvents');

const travelAssistant = require('../src/services/travelAssistant');
const peopleCRM = require('../src/services/peopleCRM');
const meetingPrep = require('../src/services/meetingPrep');

function section(t) { console.log(`\n=== ${t} ===`); }

(async () => {
  // Seed user (onboarded, Dubai)
  let user = usersRepo.create({ phone: '971500000006' });
  user = usersRepo.update(user.id, {
    name: 'Aamir', timezone: 'Asia/Dubai',
    work_hours_start: '09:00', work_hours_end: '18:00',
    gmail_token: JSON.stringify({ access_token: 'x' }),
    preferences: { onboarding: { complete: true }, emailAddress: 'aamir@rad.ae' },
  });

  const now = new Date();
  const iso = (offsetHours) => new Date(now.getTime() + offsetHours * 3600000).toISOString();

  // ── Seed a trip departing in ~23h (to trigger 24h alert) with a hotel ──
  const tripId = travelRepo.upsert(user.id, {
    tripName: 'Dubai → Istanbul', type: 'flight', provider: 'Emirates',
    confirmationCode: 'EK121', origin: 'Dubai (DXB)', destination: 'Istanbul (IST)',
    departTime: iso(23), arriveTime: iso(27), price: 1800, currency: 'AED',
  });
  // A hotel email for Istanbul so itinerary compilation can attach it
  emailItemsRepo.upsert(user.id, {
    gmailId: 'hotel1', subject: 'Your Istanbul hotel booking confirmation',
    sender: 'reservations@hilton.com', category: 'fyi', summary: 'Hilton Istanbul reservation confirmed',
    detectedType: 'general',
    extractedData: { hotel: 'Hilton Istanbul Bosphorus', checkin: '2026-07-02 15:00' },
  });
  // A receipt email so trip-cost compilation finds a charge
  emailItemsRepo.upsert(user.id, {
    gmailId: 'rcpt1', subject: 'Receipt for your Istanbul hotel',
    sender: 'reservations@hilton.com', category: 'fyi', summary: 'Hilton Istanbul receipt total AED 2400',
    detectedType: 'general', extractedData: { company: 'Hilton Istanbul', amount: 'AED 2400' },
  });

  section('Itinerary compilation (flight + hotel)');
  const compiled = travelAssistant.compileItinerary(user.id, tripId);
  console.log('hotel_name:', compiled && compiled.hotel_name);

  section('"any upcoming trips?"');
  console.log(travelAssistant.buildTripsReply(user));

  section('"show my istanbul itinerary"');
  console.log(await travelAssistant.buildItineraryReply(user, 'istanbul'));

  section('"how much did my istanbul trip cost?"');
  console.log(travelAssistant.buildTripCostReply(user, 'istanbul'));

  section('Travel alerts (24h window)');
  const ta = await travelAssistant.alertForUser(user.id, { now });
  console.log('alerts:', ta.alerts);

  // ── People CRM: simulate 6 emails from Fahad to build a "regular" contact ──
  section('People CRM: populate + strength');
  for (let i = 0; i < 6; i++) {
    peopleCRM.recordFromEmail(user.id, {
      sender: '"Fahad Khan" <fahad@acme.com>',
      created_at: iso(-i * 24),
    }, 'aamir@rad.ae');
  }
  // seed a couple of subject lines for enrichment/relationship summary
  emailItemsRepo.upsert(user.id, { gmailId: 'f1', subject: 'Dubai meeting agenda', sender: '"Fahad Khan" <fahad@acme.com>', category: 'needs_reply', summary: 'Fahad shares the agenda for the Dubai meeting', detectedType: 'general', extractedData: {} });
  emailItemsRepo.upsert(user.id, { gmailId: 'f2', subject: 'Q3 proposal draft', sender: '"Fahad Khan" <fahad@acme.com>', category: 'needs_reply', summary: 'Fahad sends the Q3 proposal draft for review', detectedType: 'general', extractedData: {} });
  const fahad = contactsRepo.find(user.id, 'fahad');
  console.log('Fahad interactions:', fahad.interaction_count, 'strength:', fahad.strength);

  section('CRM enrichment (Claude, 5+ interactions)');
  const enr = await peopleCRM.refreshContacts(user.id, { enrich: true });
  console.log('enriched:', enr.enriched);

  section('"what do I know about Fahad?"');
  console.log(peopleCRM.buildContactReply(user, 'Fahad'));

  section('"when did I last talk to Fahad?"');
  console.log(peopleCRM.buildLastTalkedReply(user, 'Fahad'));

  section('"who have I emailed the most?"');
  console.log(peopleCRM.buildTopContactsReply(user));

  // ── Meeting Prep: seed an event starting in ~35 min with Fahad ──
  section('Meeting prep (event in ~35 min, attendee = Fahad)');
  calendarEventsRepo.upsert(user.id, {
    eventId: 'evt1', title: 'Product review with Fahad',
    startTime: iso(0.58), endTime: iso(1.58), location: 'Zoom',
    attendees: [{ email: 'fahad@acme.com', displayName: 'Fahad Khan' }],
    status: 'confirmed',
  });
  const mp = await meetingPrep.prepForUser(user.id, { now });
  console.log(mp.sent[0] || '(no prep generated)');

  section('Outbox (captured proactive sends)');
  console.log(`total: ${outbox.length}`);
  outbox.forEach((m, i) => console.log(`${i + 1}. → ${m.phone}: ${m.text.split('\n')[0]}`));

  console.log('\nAll Session 6 checks executed.');
  process.exit(0);
})().catch((e) => { console.error('TEST ERROR:', e); process.exit(1); });
