'use strict';

const browserTools = [
  {
    name: 'open_website',
    description:
      'Open a website in a REAL browser and read what is on it — for pages that have no API or need JavaScript ' +
      '(a bill/utility portal, a dashboard, a page behind a login). If the user has saved a login for that site in ' +
      'their vault, Wingman logs in first, using the saved password WITHOUT ever seeing it. READ-ONLY: it reads the ' +
      'page, it does not click through purchases, payments, or submit anything beyond logging in. Use for ' +
      '"check my electricity portal balance", "log into X and tell me Y", "read this page: <url>". After reading, ' +
      'summarise what the user asked for from page_text — do not dump the whole page.',
    input_schema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'The website URL to open (e.g. the portal or page the user named).' },
      },
      required: ['url'],
    },
  },
];

const browserToolNames = new Set(browserTools.map((t) => t.name));

module.exports = { browserTools, browserToolNames };
