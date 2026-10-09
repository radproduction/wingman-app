'use strict';

/**
 * Runs the record-lookup tools (see recordsTools.js) on top of the existing
 * services. Never throws — errors come back as { error } for Claude to explain.
 * Each tool returns `text`: a ready, formatted answer the assistant can pass on
 * (translated / trimmed to fit what was asked).
 */

const usersRepo = require('../db/users');
const googleAuth = require('../auth/googleAuth');
const billAlerts = require('../services/billAlerts');
const deliveryAlerts = require('../services/deliveryAlerts');
const travelAssistant = require('../services/travelAssistant');
const peopleCRM = require('../services/peopleCRM');
const emailDigest = require('../services/emailDigest');

// Which per-user skill toggle each tool belongs to (none = always available).
const SKILL = {
  list_bills: 'bill_tracker',
  mark_bill_paid: 'bill_tracker',
  list_deliveries: 'delivery_tracker',
  list_trips: 'travel_assistant',
  trip_itinerary: 'travel_assistant',
  trip_cost: 'travel_assistant',
  contact_info: 'people_crm',
  top_contacts: 'people_crm',
};

async function executeRecordsTool(user, toolUse) {
  const { name, input = {} } = toolUse;
  try {
    if (!user) return { error: 'NO_USER' };
    const skill = SKILL[name];
    if (skill && !usersRepo.hasSkill(user, skill)) {
      return { error: 'FEATURE_OFF', detail: `The user has switched off "${skill.replace(/_/g, ' ')}" in Settings. Tell them they can turn it on there.` };
    }

    switch (name) {
      case 'search_user_data': {
        const idx = require('../services/userIndex');
        // Dates are stored both as 'YYYY-MM-DD HH:MM:SS' and ISO 'YYYY-MM-DDTHH:MM…';
        // '~' sorts after both, so an end bound of 'YYYY-MM-DD~' includes that whole day.
        const day = (d, end) => (d && /^\d{4}-\d{2}-\d{2}/.test(d) ? `${String(d).slice(0, 10)}${end ? '~' : ''}` : undefined);
        const results = idx.search(user.id, input.query, {
          sources: input.sources, since: day(input.since), until: day(input.until, true), limit: input.limit,
        });
        if (!results.length) {
          return { results: [], indexed: idx.stats(user.id), note: 'Nothing matched. Try other keywords (names, company, topic in English) or a wider date range; for very recent items use the live tools.' };
        }
        return { results };
      }
      case 'open_user_record': {
        const d = require('../services/userIndex').getDoc(user.id, input.source, input.ref_id);
        return d || { error: 'NOT_FOUND' };
      }
      case 'list_bills':
        return { text: billAlerts.buildBillsReply(user) };
      case 'mark_bill_paid':
        return { text: billAlerts.handleMarkPaid(user, String(input.name || '').trim()) };
      case 'list_deliveries':
        return { text: deliveryAlerts.buildDeliveriesReply(user) };
      case 'list_trips':
        return { text: travelAssistant.buildTripsReply(user) };
      case 'trip_itinerary':
        return { text: await travelAssistant.buildItineraryReply(user, String(input.destination || '').trim()) };
      case 'trip_cost':
        return { text: travelAssistant.buildTripCostReply(user, String(input.destination || '').trim()) };
      case 'city_weather':
        return { text: await travelAssistant.buildWeatherReply(String(input.city || '').trim()) };
      case 'contact_info':
        return { text: peopleCRM.buildContactReply(user, String(input.name || '').trim()) };
      case 'top_contacts':
        return { text: peopleCRM.buildTopContactsReply(user) };
      case 'inbox_digest':
        if (!googleAuth.isEmailConnected(user)) return { error: 'EMAIL_NOT_CONNECTED' };
        return { text: emailDigest.buildDigest(user.id) };
      default:
        return { error: 'UNKNOWN_TOOL' };
    }
  } catch (e) {
    console.warn(`[records] ${name} failed:`, e.message);
    return { error: 'LOOKUP_FAILED', detail: String(e.message || '').slice(0, 200) };
  }
}

module.exports = { executeRecordsTool };
