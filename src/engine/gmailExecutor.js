'use strict';

const gmail = require('../services/gmail');
const contactsRepo = require('../db/contacts');
const googleAuth = require('../auth/googleAuth');

/** Pull a bare email address out of a "Name <addr>" header, else return as-is. */
function extractAddress(from) {
  if (!from) return '';
  const m = from.match(/<([^>]+)>/);
  return (m ? m[1] : from).trim();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Execute a single Gmail tool_use block. Returns a plain object that is sent
 * back to Claude as the tool_result. Never throws — errors become {error}.
 *
 * @param {Object} user
 * @param {{name:string, input:Object}} toolUse
 */
async function executeGmailTool(user, toolUse) {
  if (!googleAuth.isEmailConnected(user)) {
    return { error: 'EMAIL_NOT_CONNECTED' };
  }

  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'find_contact': {
        const c = contactsRepo.find(user.id, input.query || '');
        if (c && c.email) {
          return { found: true, name: c.name || null, email: c.email };
        }
        // No stored contact — offer the user's top contacts as hints.
        const top = contactsRepo.topContacts(user.id, { limit: 5 })
          .filter((x) => x.email)
          .map((x) => ({ name: x.name, email: x.email }));
        return { found: false, suggestions: top };
      }

      case 'list_recent_emails': {
        const limit = Math.min(Math.max(parseInt(input.limit, 10) || 6, 1), 10);
        // Pull from every linked Google account so a user with personal + work
        // mailboxes sees one merged inbox. One bad account doesn't break the rest.
        const accounts = gmail.accountsFor(user);
        const emails = [];
        for (const account of accounts) {
          try {
            const ids = await gmail.listMessageIds(user, { maxResults: limit, query: input.query, account });
            for (const id of ids.slice(0, limit)) {
              const m = await gmail.getMessage(user, id, account);
              emails.push({
                id: m.gmailId,
                account: account ? account.email : null,
                from: m.sender,
                subject: m.subject,
                snippet: (m.snippet || '').slice(0, 200),
              });
            }
          } catch (err) {
            console.warn(`[gmail] list failed for ${(account && account.email) || 'primary'}:`, err.message);
          }
        }
        const linked = accounts.map((a) => (a ? a.email : null)).filter(Boolean);
        return { count: emails.length, accounts: linked, emails };
      }

      case 'read_email': {
        for (const account of gmail.accountsFor(user)) {
          try {
            const m = await gmail.getMessage(user, input.email_id, account);
            return {
              found: true,
              id: m.gmailId,
              account: account ? account.email : null,
              from: m.sender,
              subject: m.subject,
              body: m.body,
              attachments: m.attachments || [],
            };
          } catch (_) { /* try the next account */ }
        }
        return { found: false, error: 'EMAIL_NOT_FOUND', detail: 'That message was not found in any connected mailbox.' };
      }

      case 'send_email': {
        const to = (input.to || '').trim();
        if (!EMAIL_RE.test(to)) {
          return { error: 'INVALID_RECIPIENT', detail: `"${to}" is not a valid email address. Use find_contact or ask the user for the address.` };
        }
        await gmail.sendMessage(user, {
          to,
          subject: input.subject || '(no subject)',
          body: input.body || '',
        });
        // Keep the CRM warm so future "who did I email" answers stay accurate.
        try { contactsRepo.recordInteraction(user.id, { email: to, at: new Date().toISOString() }); } catch (_) {}
        return { sent: true, to, subject: input.subject || '(no subject)' };
      }

      case 'reply_to_email': {
        // The message may live in any linked mailbox — find the account that
        // actually holds it so the reply is sent from the right address.
        let account = null;
        let original = null;
        for (const candidate of gmail.accountsFor(user)) {
          try {
            original = await gmail.getMessage(user, input.email_id, candidate);
            account = candidate;
            break;
          } catch (_) { /* try the next account */ }
        }
        if (!original) return { error: 'EMAIL_NOT_FOUND', detail: 'That message was not found in any connected mailbox.' };
        const to = extractAddress(original.sender);
        if (!EMAIL_RE.test(to)) {
          return { error: 'REPLY_TARGET_UNKNOWN', detail: 'Could not determine the original sender address.' };
        }
        const subject = /^re:/i.test(original.subject || '')
          ? original.subject
          : `Re: ${original.subject || ''}`.trim();
        await gmail.sendMessage(user, {
          to,
          subject,
          body: input.body || '',
          threadId: original.threadId,
          account,
        });
        try { contactsRepo.recordInteraction(user.id, { email: to, at: new Date().toISOString() }); } catch (_) {}
        return { sent: true, to, subject };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = err && err.message ? err.message : 'gmail_operation_failed';
    if (/insufficient|scope|permission/i.test(msg)) {
      return { error: 'EMAIL_SCOPE_MISSING', detail: 'Gmail send permission was not granted. The user should reconnect Google and allow sending email.' };
    }
    return { error: msg };
  }
}

module.exports = { executeGmailTool };
