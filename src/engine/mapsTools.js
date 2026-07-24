'use strict';

/**
 * Maps tools: live traffic, best route, and "when do I need to leave?".
 * Places can be referred to as "home"/"office" once the user has saved them.
 */
const mapsTools = [
  {
    name: 'save_place',
    description:
      "Save the user's home or office address so travel times can be worked out later. " +
      'Use when they tell you where they live or work, or when a tool reports ' +
      'PLACE_NOT_SET and they then give you the address.',
    input_schema: {
      type: 'object',
      properties: {
        which: { type: 'string', enum: ['home', 'office'], description: 'Which place this is.' },
        address: { type: 'string', description: 'The address as the user gave it, e.g. "DHA Phase 6, Karachi".' },
      },
      required: ['which', 'address'],
    },
  },
  {
    name: 'get_travel_time',
    description:
      'Live driving time and best route between two places, using current traffic. ' +
      'Use for "how long to the office?", "traffic kaisa hai?", "I want to go to Saddar — best route?". ' +
      'For `from`, use "current" to start from where the user is NOW (their app-captured ' +
      'location) — this is the default when they name only a destination ("I want to go to X"). ' +
      '"home"/"office" refer to their saved places.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '"current" (where they are now — the default), "home", "office", or an address.' },
        to: { type: 'string', description: '"home", "office", or an address.' },
        depart_at: {
          type: 'string',
          description: 'Optional ISO 8601 departure time (with offset) to check future traffic. Defaults to now.',
        },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'get_leave_time',
    description:
      'Work out when the user must LEAVE to arrive somewhere on time, accounting for ' +
      'traffic. Use for "when should I leave for my 3pm meeting?" or before an event ' +
      'that has a location. Returns the leave-by time and journey length.',
    input_schema: {
      type: 'object',
      properties: {
        from: { type: 'string', description: '"current", "home", "office", or an address. Defaults to "current".' },
        to: { type: 'string', description: '"home", "office", or the destination address.' },
        arrive_by: { type: 'string', description: 'ISO 8601 arrival time WITH the user timezone offset.' },
      },
      required: ['to', 'arrive_by'],
    },
  },
];

const mapsToolNames = new Set(mapsTools.map((t) => t.name));

module.exports = { mapsTools, mapsToolNames };
