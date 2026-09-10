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

browserTools.push({
  name: 'browse_and_act',
  description:
    'Open a LIVE browser and DO a multi-step task on a website yourself — navigate, fill forms, click, search, and read the result — while the user watches live and can take over. Use this (instead of open_website) whenever the user wants an ACTION done on a site, not just a read: "check FlyJinnah flight status Karachi to Lahore", "search daraz for the cheapest earbuds and show me", "log in and get my balance", "find X on this site". Give a clear `goal` (what to accomplish, with all details the user gave) and, when you know the site, its `url` (resolve names: FlyJinnah → flyjinnah.com, Daraz → daraz.pk). It is READ/SEARCH only — it will NOT pay or place orders; it stops and asks the user for CAPTCHAs, logins it lacks, or any purchase. The user sees a live view + the steps in the app; you just tell them you\'ve started and, when they follow up, that the live agent is working.',
  input_schema: {
    type: 'object',
    properties: {
      goal: { type: 'string', description: 'The full task to accomplish, including every detail the user gave (route, dates, item, etc.).' },
      url: { type: 'string', description: 'Best starting site URL/domain if known (e.g. flyjinnah.com). Optional — omit to start from a search engine.' },
    },
    required: ['goal'],
  },
});

const browserToolNames = new Set(browserTools.map((t) => t.name));

module.exports = { browserTools, browserToolNames };
