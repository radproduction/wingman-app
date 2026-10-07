'use strict';

/**
 * Tools for the things Wingman tracks on the user's behalf — bills, deliveries,
 * trips, the people they deal with, and the inbox digest.
 *
 * These used to be reachable only through English keyword shortcuts in
 * conversation.js ("any bills due", "where's my order"), which misfired on real
 * requests and never matched Roman Urdu. As tools, the assistant decides when
 * they apply — in any language, inside any larger request.
 */

const recordsTools = [
  {
    name: 'list_bills',
    description: 'The user\'s pending bills with amounts and due dates. Use for any question about bills, dues, what they owe, what is coming up to pay.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'mark_bill_paid',
    description: 'Mark one of the user\'s bills as paid when THEY say they paid it ("paid K-Electric", "PTCL ka bill de diya"). Only records it — it does not pay anything.',
    input_schema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Biller / bill name, e.g. "K-Electric".' } },
      required: ['name'],
    },
  },
  {
    name: 'list_deliveries',
    description: 'The user\'s active orders/parcels with status, carrier and ETA. Use for "where is my order", "mera parcel kahan hai", any delivery or tracking question.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_trips',
    description: 'The user\'s upcoming trips (found from their email). Use for any question about travel plans or upcoming trips.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'trip_itinerary',
    description: 'Full itinerary for one of the user\'s trips — flights, hotel, weather at the destination.',
    input_schema: {
      type: 'object',
      properties: { destination: { type: 'string', description: 'City or destination of the trip, e.g. "Dubai".' } },
      required: ['destination'],
    },
  },
  {
    name: 'trip_cost',
    description: 'What one of the user\'s trips cost (from the bookings on record).',
    input_schema: {
      type: 'object',
      properties: { destination: { type: 'string', description: 'City or destination of the trip.' } },
      required: ['destination'],
    },
  },
  {
    name: 'city_weather',
    description: 'Current weather and short forecast for a city.',
    input_schema: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city'],
    },
  },
  {
    name: 'contact_info',
    description: 'What Wingman has on record about a person the user deals with — email, how often they are in touch, last contact, notes. Use for "what do I know about X", "X kaun hai", or before writing to someone.',
    input_schema: {
      type: 'object',
      properties: { name: { type: 'string', description: 'Person\'s name or email.' } },
      required: ['name'],
    },
  },
  {
    name: 'top_contacts',
    description: 'The people the user has been in touch with the most (this month, else overall).',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'inbox_digest',
    description: 'A ready digest of the user\'s recent email, grouped by urgent / needs reply / FYI, as Wingman has already analysed it. Use for a quick "anything in my inbox?" — for a specific email, search or reply, use the email tools instead.',
    input_schema: { type: 'object', properties: {} },
  },
];

const recordsToolNames = new Set(recordsTools.map((t) => t.name));

module.exports = { recordsTools, recordsToolNames };
