'use strict';

/**
 * Waitlist thank-you email (design: thank-you-v1 → src/templates/email/
 * waitlist-thank-you.html). Sent through Brevo to someone who has just joined
 * the waitlist on imyourwingman.ai.
 *
 * Guarantees:
 *  - ONCE per address: the send is claimed atomically on the waitlist row
 *    (thankyou_sent_at), so a double-submit, a retry or a backfill never sends
 *    a second copy.
 *  - Never to someone who unsubscribed.
 *  - Never blocks or fails the signup — callers fire-and-forget; errors are
 *    logged and the claim is released so a later backfill can retry.
 *
 * The template was written for Resend merge tags; we fill them ourselves:
 *   {{{FIRST_NAME|there}}}       → the first name typed on the form, else "there"
 *   {{{RESEND_UNSUBSCRIBE_URL}}} → our own signed unsubscribe link
 * and point the image URLs at this server (/email/v1/, see server.js).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');
const brevo = require('./brevo');

const TEMPLATE_PATH = path.join(__dirname, '..', 'templates', 'email', 'waitlist-thank-you.html');
const TEMPLATE_IMAGE_BASE = 'https://wingman-rouge.vercel.app/email/v1/';
const CONTACT_EMAIL = 'hello@imyourwingman.ai';
// Not yet sent, or a send that was claimed but never finished (crash/redeploy
// mid-send) more than 15 minutes ago — safe to (re)claim.
const NOT_SENT_SQL =
  "(thankyou_sent_at IS NULL OR (thankyou_sent_at LIKE 'sending:%' AND substr(thankyou_sent_at, 9) < datetime('now', '-15 minutes')))";

let templateCache = null;

function cfg() {
  return config.waitlist.thankYou;
}

function enabled() {
  return cfg().enabled && brevo.enabled();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * Tidy a first name typed into the signup form: first word only, letters plus
 * ' and - (any script), max 30 chars, first letter capitalised. Anything else
 * (empty, emails, numbers, junk) → null, and the email falls back to "there".
 */
function cleanFirstName(raw) {
  const word = String(raw || '').trim().split(/\s+/)[0] || '';
  if (!word || word.length > 30) return null;
  if (!/^[\p{L}][\p{L}'\u2019-]*$/u.test(word)) return null;
  return word.charAt(0).toLocaleUpperCase() + word.slice(1);
}

// ─── DB (sync, better-sqlite3) ───────────────────────────────────────

/** Waitlist table + the columns this feature needs. Idempotent. */
function ensureTable() {
  const { db } = require('../db');
  db.prepare("CREATE TABLE IF NOT EXISTS waitlist (email TEXT PRIMARY KEY, created_at TEXT DEFAULT (datetime('now')))").run();
  for (const col of ['ip TEXT', 'country TEXT', 'thankyou_sent_at TEXT', 'unsubscribed_at TEXT', 'first_name TEXT']) {
    try { db.prepare(`ALTER TABLE waitlist ADD COLUMN ${col}`).run(); } catch (_) { /* already there */ }
  }
  return db;
}

/**
 * Atomically reserve the send for this address. True for exactly one caller;
 * false if already sent/claimed, unsubscribed, or not on the list.
 */
function claim(db, email) {
  const r = db.prepare(
    `UPDATE waitlist SET thankyou_sent_at = 'sending:' || datetime('now') WHERE email = ? AND ${NOT_SENT_SQL} AND unsubscribed_at IS NULL`,
  ).run(email);
  return r.changes === 1;
}

// ─── Unsubscribe tokens ──────────────────────────────────────────────

function sign(email) {
  const secret = cfg().signingSecret;
  if (!secret) return null;
  return crypto.createHmac('sha256', `waitlist-unsub:${secret}`).update(String(email).toLowerCase()).digest('hex').slice(0, 32);
}

function verify(email, token) {
  const expected = sign(email);
  if (!expected || typeof token !== 'string' || token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}

function unsubscribeUrl(email) {
  const t = sign(email);
  if (!t) return null;
  return `${cfg().publicUrl}/api/waitlist/unsubscribe?e=${encodeURIComponent(email)}&t=${t}`;
}

/** Mark unsubscribed. Returns true if the address is on the list. */
function unsubscribe(email) {
  const db = ensureTable();
  const r = db.prepare(
    "UPDATE waitlist SET unsubscribed_at = COALESCE(unsubscribed_at, datetime('now')) WHERE email = ?",
  ).run(String(email).toLowerCase());
  return r.changes === 1;
}

// ─── Rendering ───────────────────────────────────────────────────────

function loadTemplate() {
  if (!templateCache) templateCache = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  return templateCache;
}

/** { html, text, unsubUrl } for one recipient. Throws if a merge tag is left. */
function render(email, firstName) {
  const greetName = cleanFirstName(firstName) || 'there';
  const unsubUrl = unsubscribeUrl(email);
  // No signing secret → fall back to a reply-to-unsubscribe mailto so the link
  // still works (and we never ship an email with a broken unsubscribe).
  const unsubHref = unsubUrl || `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Unsubscribe')}`;
  const imageBase = `${cfg().publicUrl}/email/v1/`;

  let html = loadTemplate()
    .split(TEMPLATE_IMAGE_BASE).join(imageBase)
    .split('{{{FIRST_NAME|there}}}').join(escapeHtml(greetName))
    .split('{{{RESEND_UNSUBSCRIBE_URL}}}').join(escapeHtml(unsubHref));

  if (html.includes('{{{') || html.includes(TEMPLATE_IMAGE_BASE)) {
    throw new Error('thank-you template has an unfilled merge tag or old image URL');
  }

  // Plain-text alternative — same words as the HTML, in the same order.
  const text = [
    "You're on the list",
    '',
    'Thanks for signing up for Wingman. You will be among the first to hear when it is ready.',
    '',
    `Hi ${greetName},`,
    '',
    'We are building Wingman to take the everyday admin off your plate, and we are keeping the details close while we get it right.',
    '',
    'Signing up this early genuinely helps. It tells us people want this, and it gives us a small group to share the first version with.',
    '',
    'What happens next',
    '1. Nothing to do for now — Your spot is saved. There is no app to download yet.',
    '2. The occasional update — We only write when there is something worth telling you.',
    '3. Your invite, first — When we open the doors, you get in before anyone else.',
    '',
    `So you do not miss the invite, add ${CONTACT_EMAIL} to your contacts.`,
    '',
    'Know someone who could use a hand? Send them our way and they can join the list too: https://imyourwingman.ai',
    '',
    'Thanks again,',
    'The Wingman team',
    'Questions? Just reply. A person reads every email.',
    '',
    '—',
    'You are getting this because you signed up at imyourwingman.ai.',
    `Changed your mind? Unsubscribe: ${unsubHref}`,
    '© 2026 Wingman. All rights reserved.',
  ].join('\n');

  return { html, text, unsubUrl };
}

// ─── Sending ─────────────────────────────────────────────────────────

async function deliver(email, firstName) {
  const { html, text, unsubUrl } = render(email, firstName);
  const headers = {};
  if (unsubUrl) {
    // RFC 8058 one-click unsubscribe — Gmail/Yahoo bulk-sender requirement.
    headers['List-Unsubscribe'] = `<${unsubUrl}>, <mailto:${CONTACT_EMAIL}?subject=Unsubscribe>`;
    headers['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }
  return brevo.sendEmail({
    from: cfg().from,
    fromName: cfg().fromName,
    to: email,
    subject: cfg().subject,
    html,
    text,
    replyTo: cfg().from,
    headers,
    tags: ['waitlist-thank-you'],
  });
}

/**
 * Send the thank-you to one address if it hasn't had one yet. Never throws.
 * Returns { sent: true } | { skipped: reason } | { error }.
 */
async function sendOnce(rawEmail) {
  const email = String(rawEmail || '').trim().toLowerCase();
  if (!email) return { skipped: 'no_email' };
  if (!enabled()) return { skipped: 'disabled' };

  let db;
  let firstName = null;
  try {
    db = ensureTable();
    if (!claim(db, email)) return { skipped: 'already_sent_or_unsubscribed' };
    const row = db.prepare('SELECT first_name FROM waitlist WHERE email = ?').get(email);
    firstName = row && row.first_name;
  } catch (e) {
    console.warn('[waitlist:thankyou] claim failed:', e.message);
    return { error: e.message };
  }

  // One quick retry for transient Brevo/network errors.
  let lastErr = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const r = await deliver(email, firstName);
      db.prepare("UPDATE waitlist SET thankyou_sent_at = datetime('now') WHERE email = ?").run(email);
      console.log(`[waitlist:thankyou] sent to ${email}${r && r.messageId ? ` (${r.messageId})` : ''}`);
      return { sent: true };
    } catch (e) {
      lastErr = e;
      if (attempt === 1) await new Promise((res) => setTimeout(res, 4000));
    }
  }
  // Release the claim so a backfill can try again later.
  try { db.prepare('UPDATE waitlist SET thankyou_sent_at = NULL WHERE email = ?').run(email); } catch (_) {}
  console.warn(`[waitlist:thankyou] FAILED for ${email}:`, lastErr && lastErr.message);
  return { error: lastErr ? lastErr.message : 'send_failed' };
}

/**
 * Addresses that joined but never got the thank-you (and didn't unsubscribe).
 * Used by the admin backfill route.
 */
function pendingRecipients(limit = 500) {
  const db = ensureTable();
  return db.prepare(
    `SELECT email, created_at FROM waitlist WHERE ${NOT_SENT_SQL} AND unsubscribed_at IS NULL ORDER BY created_at ASC LIMIT ?`,
  ).all(limit);
}

module.exports = {
  enabled,
  ensureTable,
  sendOnce,
  render,
  verify,
  unsubscribe,
  pendingRecipients,
  cleanFirstName,
};
