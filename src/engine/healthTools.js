'use strict';

const { METRICS } = require('../db/healthData');

/**
 * Health tools. Readings arrive from whatever the user connected (Apple Health
 * via a Shortcut, a wearable, or manual logging) — the assistant just reads
 * what's stored.
 */
const healthTools = [
  {
    name: 'get_health',
    description:
      "Get the user's latest health readings — sleep, resting heart rate, steps, HRV, " +
      'blood oxygen, weight. Use for "how did I sleep?", "what\'s my resting heart rate?", ' +
      '"kaisi tabiyat hai?", or when they ask how their health looks.',
    input_schema: {
      type: 'object',
      properties: {
        metric: {
          type: 'string',
          enum: Object.keys(METRICS),
          description: 'A specific metric. Omit for everything we have.',
        },
        days: { type: 'number', description: 'Include a trend over this many days (default 7, max 30).' },
      },
      required: [],
    },
  },
  {
    name: 'log_health',
    description:
      'Record a health reading the user tells you directly ("I slept 6 hours", ' +
      '"my weight is 78 kg"). Only for values they state — never invent or estimate one.',
    input_schema: {
      type: 'object',
      properties: {
        metric: { type: 'string', enum: Object.keys(METRICS), description: 'Which metric.' },
        value: { type: 'number', description: 'The number they gave.' },
        unit: { type: 'string', description: 'Unit if they said one (e.g. "min", "lbs").' },
      },
      required: ['metric', 'value'],
    },
  },
  {
    name: 'get_health_connect_link',
    description:
      'Get the private link and instructions for connecting health data. Use when the ' +
      'user asks to connect Apple Health / their watch / fitness tracker, or when ' +
      'get_health returns HEALTH_NOT_CONNECTED.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

const healthToolNames = new Set(healthTools.map((t) => t.name));

module.exports = { healthTools, healthToolNames };
