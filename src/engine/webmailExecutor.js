'use strict';

const webmail = require('../services/webmail');
const contactsRepo = require('../db/contacts');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Execute a business-mailbox tool. Never throws — errors become {error}. */
async function executeWebmailTool(user, toolUse) {
  if (!webmail.isConnected(user)) {
    return { error: 'WEBMAIL_NOT_CONNECTED' };
  }

  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'list_business_emails': {
        const limit = Math.min(Math.max(parseInt(input.limit, 10) || 10, 1), 25);
        const messages = await webmail.listRecent(user, { limit });
        return { mailbox: user.webmail_address, count: messages.length, emails: messages };
      }

      case 'send_business_email': {
        const to = String(input.to || '').trim();
        if (!EMAIL_RE.test(to)) {
          return { error: 'INVALID_RECIPIENT', detail: `"${to}" is not a valid email address.` };
        }
        const r = await webmail.send(user, {
          to,
          subject: input.subject || '(no subject)',
          body: input.body || '',
        });
        try { contactsRepo.recordInteraction(user.id, { email: to, at: new Date().toISOString() }); } catch (_) {}
        return { sent: true, from: r.from, to, subject: input.subject || '(no subject)' };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = (err && err.message) || 'webmail_operation_failed';
    if (msg === 'WEBMAIL_AUTH_FAILED') {
      return { error: 'WEBMAIL_AUTH_FAILED', detail: 'The mailbox password was rejected — the user should reconnect it in Settings.' };
    }
    if (msg === 'WEBMAIL_CREDENTIALS_UNREADABLE') {
      return { error: 'WEBMAIL_AUTH_FAILED', detail: 'Stored mail credentials could not be read — the user should reconnect the mailbox.' };
    }
    if (msg === 'WEBMAIL_HOST_NOT_FOUND' || msg === 'WEBMAIL_CONNECTION_FAILED') {
      return { error: 'WEBMAIL_UNREACHABLE', detail: 'The mail server did not respond.' };
    }
    return { error: msg };
  }
}

module.exports = { executeWebmailTool };
