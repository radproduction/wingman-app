'use strict';

const config = require('../config');

/**
 * Sending email through Brevo's transactional HTTP API.
 *
 * Railway blocks outbound SMTP (ports 465/587 time out), so we cannot reach the
 * user's own mail server — or even Brevo's SMTP relay — to send. Brevo's HTTP
 * API goes over HTTPS (443), which is open, so this is how replies actually go
 * out. The From stays the user's business address, kept legitimate by
 * authenticating their domain in Brevo (SPF/DKIM).
 */

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 15000;

function enabled() {
  return config.brevo.enabled;
}

/**
 * Send one message. Throws on failure with a `BREVO:<detail>` message so the
 * caller's friendlyError can surface something useful.
 */
async function sendEmail({ from, fromName, to, subject, text, html, replyTo, inReplyTo, headers, tags }) {
  if (!enabled()) throw new Error('BREVO:not_configured');
  if (!from || !to) throw new Error('BREVO:missing_from_or_to');

  const payload = {
    sender: fromName ? { email: from, name: fromName } : { email: from },
    to: [{ email: to }],
    subject: subject || '(no subject)',
    textContent: text || '',
  };
  // Optional HTML body (marketing/transactional templates). textContent stays as
  // the plain-text alternative — better deliverability than HTML-only.
  if (html) payload.htmlContent = html;
  if (replyTo) payload.replyTo = { email: replyTo };
  // Extra headers (e.g. List-Unsubscribe) plus threading when replying.
  const hdrs = { ...(headers || {}) };
  if (inReplyTo) Object.assign(hdrs, { 'In-Reply-To': inReplyTo, References: inReplyTo });
  if (Object.keys(hdrs).length) payload.headers = hdrs;
  if (Array.isArray(tags) && tags.length) payload.tags = tags;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'api-key': config.brevo.apiKey,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`BREVO:${err && err.name === 'AbortError' ? 'timeout' : 'unreachable'}`);
  }
  clearTimeout(timer);

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // Brevo returns { code, message } — the message usually says exactly what's
    // wrong (unverified sender, bad key, unauthenticated domain).
    const detail = (data && (data.message || data.code)) || `http_${res.status}`;
    throw new Error(`BREVO:${detail}`);
  }
  return { messageId: (data && data.messageId) || null };
}

module.exports = { sendEmail, enabled };
