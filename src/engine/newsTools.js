'use strict';

const { ALL_TOPICS } = require('../services/news');

/**
 * News tool. Headlines come from Google News (no API key), scoped to the user's
 * followed topics and their city for local news.
 */
const newsTools = [
  {
    name: 'get_news',
    description:
      "Fetch current news headlines. Use for \"what's the news?\", \"any tech news?\", " +
      '"kuch naya hua?", or when the user asks what\'s happening locally. ' +
      'Omit topic to use the topics the user follows. Use topic "local" for news ' +
      "about the user's own city (that's how you answer \"anything happening near me?\").",
    input_schema: {
      type: 'object',
      properties: {
        topic: {
          type: 'string',
          enum: ALL_TOPICS,
          description: 'A single topic to fetch. Omit for the user\'s followed topics.',
        },
        limit: { type: 'number', description: 'Headlines per topic (default 3, max 6).' },
      },
      required: [],
    },
  },
];

const newsToolNames = new Set(newsTools.map((t) => t.name));

module.exports = { newsTools, newsToolNames };
