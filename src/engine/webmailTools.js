'use strict';

/**
 * Business-email tools (IMAP/SMTP). Separate from the Gmail tools because this
 * is typically the address customers actually write to — info@company.com —
 * and the user wants to read and answer it from WhatsApp.
 */
const webmailTools = [
  {
    name: 'list_business_emails',
    description:
      "List recent messages in the user's connected business mailbox (their " +
      'company address, e.g. info@company.com — NOT their Gmail). Use for ' +
      '"any customer emails?", "check the business inbox", or before replying to a customer.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'How many messages (default 10, max 25).' },
      },
      required: [],
    },
  },
  {
    name: 'send_business_email',
    description:
      "Send an email FROM the user's business address (their company mailbox). " +
      'Use when they want to write to a customer from the business email rather than ' +
      'their personal Gmail. Only send when they have clearly asked you to send. ' +
      'Write the full body yourself.',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: 'Recipient email address.' },
        subject: { type: 'string', description: 'Subject line.' },
        body: { type: 'string', description: 'Full plain-text body, written out properly with a sign-off.' },
      },
      required: ['to', 'subject', 'body'],
    },
  },
];

const webmailToolNames = new Set(webmailTools.map((t) => t.name));

module.exports = { webmailTools, webmailToolNames };
