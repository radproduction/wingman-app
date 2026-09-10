'use strict';

const browserTools = [
  {
    name: 'open_website',
    description:
      'Open a website in a REAL browser and read what is ACTUALLY on it right now. Use this WHENEVER the user asks ' +
      'to open / go to / show / visit / check / browse / search a website — INCLUDING when they give only a NAME ' +
      'instead of a URL ("open amazon", "daraz kholo", "show me flipkart", "check my portal"): resolve the name to ' +
      'its domain yourself (amazon → amazon.com, daraz → daraz.pk) and pass it as url. If the user saved a login for ' +
      'that site in their vault, Wingman logs in first using the saved password WITHOUT ever seeing it. READ-ONLY: ' +
      'it reads the page and can log in, but does NOT buy, pay, or submit anything else. You have NOT seen the page ' +
      'until this tool returns — never describe, list, or summarise a live page (deals, prices, products, "homepage ' +
      'is up") from your own memory; report ONLY what this call returns in page_text, and if it failed say so.',
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
