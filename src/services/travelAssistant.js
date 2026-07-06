'use strict';

const usersRepo = require('../db/users');
const travelRepo = require('../db/travel');
const emailItemsRepo = require('../db/emailItems');
const weather = require('./weather');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

// ── Itinerary compilation ────────────────────────────────────────────

/**
 * After a flight is stored in `travel`, try to find a matching hotel booking
 * in email_items for the same destination and attach it to the trip.
 * @returns {Object|null} the updated trip row, or null if nothing changed
 */
function compileItinerary(userId, tripId) {
  const trip = travelRepo.getById(tripId);
  if (!trip || !trip.destination) return null;

  // Look for hotel/lodging emails that mention the destination.
  const dest = trip.destination.split(/[(,]/)[0].trim();
  const candidates = emailItemsRepo.searchByKeyword(userId, dest)
    .filter((e) => {
      const hay = `${e.subject || ''} ${e.summary || ''} ${e.detected_type || ''}`.toLowerCase();
      return /hotel|booking|reservation|check-?in|resort|stay|airbnb/.test(hay);
    });

  if (!candidates.length) return null;

  const hotel = candidates[0];
  let data = {};
  try { data = JSON.parse(hotel.extracted_data || '{}'); } catch (_) {}

  const updates = {};
  if (!trip.hotel_name) {
    updates.hotel_name = data.hotel || data.store || data.company || hotel.subject || 'Hotel booking';
  }
  if (!trip.hotel_checkin && data.checkin) updates.hotel_checkin = data.checkin;
  if (!trip.hotel_checkout && data.checkout) updates.hotel_checkout = data.checkout;
  const meta = Object.assign({}, trip.metadata, { hotelEmailId: hotel.id });
  updates.metadata = meta;

  return travelRepo.updateFields(tripId, updates);
}

// ── Weather + packing ────────────────────────────────────────────────

async function destinationWeather(destination) {
  const city = (destination || '').split(/[(,]/)[0].trim();
  const w = await weather.getWeatherForCity(city);
  return { ...w, packing: weather.packingSuggestions(w) };
}

// ── Alerts (scheduler) ───────────────────────────────────────────────

/**
 * Evaluate upcoming trips for a user and emit any due alerts:
 *  - ~24h before departure
 *  - ~3h before departure
 *  - day-of arrival (hotel + weather + packing)
 * Alerts are de-duped via trip.metadata.alertsSent.
 */
async function alertForUser(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { alerts: [] };
  const trips = travelRepo.listUpcoming(user.id, new Date(now.getTime() - 24 * 3600 * 1000).toISOString());
  const alerts = [];

  for (const trip of trips) {
    if (!trip.depart_time) continue;
    const sent = (trip.metadata && trip.metadata.alertsSent) || {};
    const departMs = new Date(trip.depart_time).getTime();
    if (Number.isNaN(departMs)) continue;
    const hoursTo = (departMs - now.getTime()) / 3600000;
    const tz = user.timezone || 'Asia/Karachi';
    const flightNo = trip.confirmation_code || trip.trip_name || 'your flight';
    const dest = trip.destination || 'your destination';

    // 24h reminder (fires in the 21–24h window)
    if (hoursTo <= 24 && hoursTo > 21 && !sent.h24) {
      alerts.push({
        key: 'h24',
        trip,
        text: `\u2708\ufe0f Your flight ${flightNo} to ${dest} departs tomorrow at ${t.timeLabel(trip.depart_time, tz)}. Check-in opens soon!`,
      });
    }
    // 3h reminder (fires in the 2–3h window)
    if (hoursTo <= 3 && hoursTo > 2 && !sent.h3) {
      const gate = (trip.metadata && trip.metadata.gate) || 'TBD';
      alerts.push({
        key: 'h3',
        trip,
        text: `\u2708\ufe0f ${flightNo} departs in 3 hours. Gate: ${gate}. Status: ${trip.status || 'On Time'}.`,
      });
    }
    // Day-of arrival (once, when we're within the arrival day)
    if (trip.arrive_time && !sent.arrival) {
      const arriveMs = new Date(trip.arrive_time).getTime();
      if (!Number.isNaN(arriveMs) && now.getTime() >= arriveMs - 3600000 && now.getTime() <= arriveMs + 12 * 3600000) {
        const w = await destinationWeather(dest);
        const hotel = trip.hotel_name ? `Check-in at ${trip.hotel_name}${trip.hotel_checkin ? ` is at ${trip.hotel_checkin}` : ''}. ` : '';
        alerts.push({
          key: 'arrival',
          trip,
          text: `\ud83c\udfe8 ${hotel}Weather in ${w.city}: ${w.temp}\u00b0C, ${w.condition}. ${w.packing[0]}.`,
        });
      }
    }
  }

  if (send && alerts.length && wa().ready()) {
    for (const a of alerts) {
      try {
        await wa().sendMessage(user.phone, a.text);
        const meta = Object.assign({}, a.trip.metadata);
        meta.alertsSent = Object.assign({}, meta.alertsSent, { [a.key]: new Date().toISOString() });
        travelRepo.updateFields(a.trip.id, { metadata: meta });
      } catch (err) { console.warn('[travelAssistant] send failed:', err.message); }
    }
  } else if (alerts.length) {
    console.log(`[travelAssistant] (WA not ready) would send ${alerts.length} travel alert(s)`);
  }

  return { alerts: alerts.map((a) => a.text) };
}

async function runDueUsers({ now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'travel')) continue;
    results.push({ phone: u.phone, ...(await alertForUser(u.id, { now })) });
  }
  return results;
}

// ── Conversational commands ──────────────────────────────────────────

function isTripsQuery(text) {
  const s = (text || '').toLowerCase();
  return /(upcoming trips|travel plans|my trips|any trips)/.test(s);
}

function detectItineraryQuery(text) {
  const s = (text || '').toLowerCase();
  const m = s.match(/(?:show|see|my)\s+(?:my\s+)?([a-z\s]+?)\s+itinerary/);
  return m ? m[1].trim() : null;
}

function detectWeatherQuery(text) {
  const s = (text || '').toLowerCase();
  const m = s.match(/weather (?:in|at|for) ([a-z\s]+)\??$/);
  return m ? m[1].trim() : null;
}

function detectTripCost(text) {
  const s = (text || '').toLowerCase();
  const m = s.match(/how much did (?:my )?([a-z\s]+?) trip cost/);
  return m ? m[1].trim() : null;
}

function fmtTime(iso, tz) {
  if (!iso) return 'TBD';
  try { return `${t.dayLabel(iso, tz)} ${t.timeLabel(iso, tz)}`; } catch (_) { return iso; }
}

function buildTripsReply(user) {
  const now = new Date().toISOString();
  const trips = travelRepo.listUpcoming(user.id, now);
  if (!trips.length) return 'No upcoming trips on record. \u2708\ufe0f';
  const tz = user.timezone || 'Asia/Karachi';
  const lines = ['\u2708\ufe0f *Upcoming Trips:*'];
  for (const trip of trips) {
    const route = [trip.origin, trip.destination].filter(Boolean).join(' \u2192 ') || trip.destination || 'Trip';
    lines.push(`\u2022 ${route}${trip.depart_time ? ` \u2014 ${fmtTime(trip.depart_time, tz)}` : ''}`);
  }
  return lines.join('\n');
}

async function buildItineraryReply(user, destQuery) {
  const trip = travelRepo.findByDestination(user.id, destQuery);
  if (!trip) return `I don't have an itinerary for "${destQuery}" yet.`;
  const tz = user.timezone || 'Asia/Karachi';
  const w = await destinationWeather(trip.destination || destQuery);
  const lines = [`\u2708\ufe0f *${(trip.destination || destQuery)} Itinerary*`];
  lines.push('');
  lines.push(`*Flight:* ${trip.confirmation_code || trip.provider || ''} ${[trip.origin, trip.destination].filter(Boolean).join(' \u2192 ')}`.trim());
  if (trip.depart_time) lines.push(`Depart: ${fmtTime(trip.depart_time, tz)}`);
  if (trip.arrive_time) lines.push(`Arrive: ${fmtTime(trip.arrive_time, tz)}`);
  if (trip.hotel_name) {
    lines.push('');
    lines.push(`*Hotel:* ${trip.hotel_name}`);
    if (trip.hotel_checkin) lines.push(`Check-in: ${trip.hotel_checkin}`);
  }
  lines.push('');
  lines.push(`\ud83c\udf24 Weather: ${w.temp}\u00b0C, ${w.condition}`);
  lines.push(`\ud83e\udded Packing: ${w.packing.join('; ')}`);
  return lines.join('\n');
}

async function buildWeatherReply(city) {
  const w = await destinationWeather(city);
  return `\ud83c\udf24 ${w.city}: ${w.temp}\u00b0C, ${w.condition}.\n\ud83e\udded ${w.packing.join('; ')}.`;
}

/**
 * Compile trip expenses from receipt/charge emails mentioning the destination.
 */
function buildTripCostReply(user, destQuery) {
  const trip = travelRepo.findByDestination(user.id, destQuery);
  const destName = trip ? (trip.destination || destQuery) : destQuery;
  const receipts = emailItemsRepo.searchByKeyword(user.id, destName)
    .filter((e) => {
      const hay = `${e.subject || ''} ${e.summary || ''}`.toLowerCase();
      return /receipt|charge|invoice|payment|paid|total|booking/.test(hay);
    });

  const items = [];
  let total = 0;
  let currency = trip && trip.currency ? trip.currency : 'PKR';

  if (trip && trip.price) { items.push({ label: `Flight (${trip.confirmation_code || 'ticket'})`, amount: trip.price }); total += trip.price; }

  for (const r of receipts) {
    let data = {};
    try { data = JSON.parse(r.extracted_data || '{}'); } catch (_) {}
    const amtRaw = data.amount || data.total || null;
    const amt = amtRaw ? Number(String(amtRaw).replace(/[^0-9.]/g, '')) : null;
    if (amt && !Number.isNaN(amt)) {
      items.push({ label: data.company || data.store || r.subject || 'Charge', amount: amt });
      total += amt;
      if (typeof amtRaw === 'string' && /[A-Z]{3}/.test(amtRaw)) currency = amtRaw.match(/[A-Z]{3}/)[0];
    }
  }

  if (!items.length) return `I couldn't find any expenses recorded for your ${destName} trip yet.`;
  const lines = [`\ud83d\udcb3 *${destName} trip \u2014 estimated cost:*`];
  for (const it of items) lines.push(`\u2022 ${it.label}: ${currency} ${Number(it.amount).toLocaleString('en-US')}`);
  lines.push('');
  lines.push(`*Total: ${currency} ${Number(total).toLocaleString('en-US')}*`);
  return lines.join('\n');
}

module.exports = {
  compileItinerary, destinationWeather,
  alertForUser, runDueUsers,
  isTripsQuery, detectItineraryQuery, detectWeatherQuery, detectTripCost,
  buildTripsReply, buildItineraryReply, buildWeatherReply, buildTripCostReply,
};
