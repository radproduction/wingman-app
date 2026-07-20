'use strict';

const { ImapFlow } = require('imapflow');
const nodemailer = require('nodemailer');
const secrets = require('../utils/secrets');
const usersRepo = require('../db/users');
const config = require('../config');

/**
 * Business email over IMAP/SMTP — for mailboxes that aren't Gmail
 * (info@yourdomain.com on cPanel, Zoho, Outlook, …).
 *
 * The password is stored encrypted and only ever decrypted in memory for the
 * duration of a connection.
 */

// Known providers, so most people only have to type an address and password.
const PROVIDERS = [
  { match: /@(gmail|googlemail)\.com$/i, imap: 'imap.gmail.com', smtp: 'smtp.gmail.com', note: 'Gmail requires an app password (2FA on).' },
  { match: /@(outlook|hotmail|live|msn)\./i, imap: 'outlook.office365.com', smtp: 'smtp.office365.com' },
  { match: /@yahoo\./i, imap: 'imap.mail.yahoo.com', smtp: 'smtp.mail.yahoo.com', note: 'Yahoo requires an app password.' },
  { match: /@zoho\./i, imap: 'imap.zoho.com', smtp: 'smtp.zoho.com' },
  { match: /@(icloud|me)\.com$/i, imap: 'imap.mail.me.com', smtp: 'smtp.mail.me.com', note: 'iCloud requires an app password.' },
];

/**
 * Best-guess IMAP/SMTP settings for an address. Custom domains overwhelmingly
 * follow the mail.<domain> convention used by cPanel and friends.
 */
function detectSettings(address) {
  const email = String(address || '').trim().toLowerCase();
  const domain = email.split('@')[1] || '';
  for (const p of PROVIDERS) {
    if (p.match.test(email)) {
      return { imapHost: p.imap, imapPort: 993, smtpHost: p.smtp, smtpPort: 465, note: p.note || null, guessed: false };
    }
  }
  if (!domain) return null;
  return { imapHost: `mail.${domain}`, imapPort: 993, smtpHost: `mail.${domain}`, smtpPort: 465, note: null, guessed: true };
}

/** Resolve a user's stored settings, decrypting the password. */
function settingsFor(user) {
  if (!user || !user.webmail_address || !user.webmail_password_enc) throw new Error('WEBMAIL_NOT_CONNECTED');
  let password;
  try { password = secrets.decrypt(user.webmail_password_enc); }
  catch (_) { throw new Error('WEBMAIL_CREDENTIALS_UNREADABLE'); }
  return {
    address: user.webmail_address,
    password,
    imapHost: user.webmail_imap_host,
    imapPort: user.webmail_imap_port || 993,
    smtpHost: user.webmail_smtp_host,
    smtpPort: user.webmail_smtp_port || 465,
    fromName: user.webmail_from_name || null,
  };
}

function imapClient(s) {
  return new ImapFlow({
    host: s.imapHost,
    port: s.imapPort,
    secure: s.imapPort === 993,
    auth: { user: s.address, pass: s.password },
    logger: false,
    // Some shared hosts use self-signed certs; still encrypted in transit.
    tls: { rejectUnauthorized: false },
  });
}

function smtpTransport(s) {
  return nodemailer.createTransport({
    host: s.smtpHost,
    port: s.smtpPort,
    secure: s.smtpPort === 465,
    auth: { user: s.address, pass: s.password },
    tls: { rejectUnauthorized: false },
  });
}

/** Map provider errors to something a user can act on. */
function friendlyError(err) {
  const msg = String((err && err.message) || err || '');
  // Brevo (HTTP send) errors — the sender/domain must be authenticated in Brevo.
  if (/^BREVO:/i.test(msg)) {
    if (/unauthor|key not found|invalid.*key/i.test(msg)) return 'WEBMAIL_SEND_KEY_INVALID';
    if (/sender|not been validated|not valid|domain/i.test(msg)) return 'WEBMAIL_SENDER_UNVERIFIED';
    if (/timeout|unreachable/i.test(msg)) return 'WEBMAIL_CONNECTION_FAILED';
    return 'WEBMAIL_SEND_FAILED';
  }
  if (/auth|credential|login|password|AUTHENTICATIONFAILED/i.test(msg)) return 'WEBMAIL_AUTH_FAILED';
  if (/ENOTFOUND|EAI_AGAIN|getaddrinfo/i.test(msg)) return 'WEBMAIL_HOST_NOT_FOUND';
  if (/ETIMEDOUT|ECONNREFUSED|timeout/i.test(msg)) return 'WEBMAIL_CONNECTION_FAILED';
  return msg || 'WEBMAIL_ERROR';
}

/**
 * Verify credentials against BOTH IMAP and SMTP before we store anything, so a
 * bad password fails at setup rather than silently later.
 */
async function testConnection({ address, password, imapHost, imapPort, smtpHost, smtpPort }) {
  const s = { address, password, imapHost, imapPort: imapPort || 993, smtpHost, smtpPort: smtpPort || 465 };

  const client = imapClient(s);
  try {
    await client.connect();
    await client.logout();
  } catch (err) {
    throw new Error(`IMAP:${friendlyError(err)}`);
  }

  // SMTP (sending) is checked but NOT required. Most cloud hosts block outbound
  // SMTP, and refusing the whole connection over that left users unable even to
  // READ their customer mail — which works perfectly well over IMAP. So we
  // report whether sending is available and let the caller decide what to say.
  if (config.brevo.enabled) return { ok: true, canSend: true, via: 'brevo' };

  try {
    await smtpTransport(s).verify();
    return { ok: true, canSend: true, via: 'smtp' };
  } catch (err) {
    return { ok: true, canSend: false, sendError: friendlyError(err) };
  }
}

/** Encrypt + persist a verified mailbox on the user. */
function saveForUser(userId, { address, password, imapHost, imapPort, smtpHost, smtpPort, fromName }) {
  if (!secrets.available()) throw new Error('SECRET_KEY_NOT_SET');
  usersRepo.update(userId, {
    webmail_address: address,
    webmail_password_enc: secrets.encrypt(password),
    webmail_imap_host: imapHost,
    webmail_imap_port: imapPort || 993,
    webmail_smtp_host: smtpHost,
    webmail_smtp_port: smtpPort || 465,
    webmail_from_name: fromName || null,
  });
}

function disconnect(userId) {
  usersRepo.update(userId, {
    webmail_address: null, webmail_password_enc: null,
    webmail_imap_host: null, webmail_imap_port: null,
    webmail_smtp_host: null, webmail_smtp_port: null, webmail_from_name: null,
  });
}

function isConnected(user) {
  return !!(user && user.webmail_address && user.webmail_password_enc);
}

/** Recent messages from the mailbox, newest first. */
async function listRecent(user, { limit = 10, mailbox = 'INBOX' } = {}) {
  const s = settingsFor(user);
  const client = imapClient(s);
  const out = [];
  try {
    await client.connect();
    const lock = await client.getMailboxLock(mailbox);
    try {
      const total = client.mailbox.exists || 0;
      if (total === 0) return [];
      const from = Math.max(1, total - limit + 1);
      for await (const msg of client.fetch(`${from}:${total}`, { envelope: true, uid: true, bodyStructure: false })) {
        const env = msg.envelope || {};
        const sender = (env.from && env.from[0]) || {};
        out.push({
          uid: msg.uid,
          subject: env.subject || '(no subject)',
          from: sender.address ? `${sender.name ? `${sender.name} ` : ''}<${sender.address}>` : (sender.name || 'unknown'),
          fromAddress: sender.address || null,
          date: env.date ? new Date(env.date).toISOString() : null,
        });
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (err) {
    try { await client.logout(); } catch (_) { /* already down */ }
    throw new Error(friendlyError(err));
  }
  return out.reverse(); // newest first
}

/** Send a message from the user's business address. */
async function send(user, { to, subject, body, replyTo } = {}) {
  const s = settingsFor(user);

  // Prefer Brevo's HTTP API — Railway blocks outbound SMTP, so the mailbox's
  // own SMTP server is unreachable from here. The From stays the business
  // address; Brevo keeps it deliverable via the authenticated domain.
  if (config.brevo.enabled) {
    const brevo = require('./brevo');
    const info = await brevo.sendEmail({
      from: s.address,
      fromName: s.fromName,
      to,
      subject,
      text: body,
      replyTo: s.address,
      inReplyTo: replyTo || undefined,
    }).catch((err) => { throw new Error(friendlyError(err)); });
    return { messageId: info.messageId, from: s.address, via: 'brevo' };
  }

  const info = await smtpTransport(s).sendMail({
    from: s.fromName ? `"${s.fromName}" <${s.address}>` : s.address,
    to,
    subject: subject || '(no subject)',
    text: body || '',
    inReplyTo: replyTo || undefined,
    references: replyTo || undefined,
  }).catch((err) => { throw new Error(friendlyError(err)); });
  return { messageId: info.messageId, from: s.address };
}

module.exports = {
  detectSettings, testConnection, saveForUser, disconnect, isConnected,
  listRecent, send, settingsFor,
};
