'use strict';

const usersRepo = require('../db/users');
const webmail = require('./webmail');
const proactiveGate = require('./proactiveGate');

function wa() { return require('../whatsapp/client'); }

/**
 * Tells the user when new mail lands in their BUSINESS mailbox.
 *
 * Reading works over IMAP even where outbound SMTP is blocked, so this half of
 * the feature is useful on its own: a customer email that sits unseen for a day
 * is the thing this was built to prevent.
 */

// Enough to catch a busy morning without turning a notification into an inbox.
const MAX_LISTED = 5;

function summarise(items) {
  const lines = [`📬 ${items.length} new email${items.length === 1 ? '' : 's'} in your business inbox:`];
  for (const m of items.slice(0, MAX_LISTED)) {
    const from = m.fromAddress || m.from || 'unknown sender';
    lines.push(`• ${m.subject || '(no subject)'} — ${from}`);
  }
  if (items.length > MAX_LISTED) lines.push(`…and ${items.length - MAX_LISTED} more.`);
  lines.push('');
  lines.push('Say "read the latest one" and I\'ll open it.');
  return lines.join('\n');
}

/**
 * Check one mailbox. Returns the message sent, or null.
 *
 * The first run only records where the inbox currently stands — announcing
 * every message already sitting there would be a wall of old mail, not news.
 */
async function checkUser(userId, { send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user || !webmail.isConnected(user)) return { sent: null, skipped: 'not_connected' };
  if (!proactiveGate.allows(user, 'webmail')) return { sent: null, skipped: 'gated' };

  let items;
  try {
    items = await webmail.listRecent(user, { limit: 15 });
  } catch (err) {
    console.warn('[webmailAlerts] could not read mailbox:', err.message);
    return { sent: null, skipped: 'read_failed' };
  }
  if (!items.length) return { sent: null, skipped: 'empty' };

  const prefs = user.preferences || {};
  const lastUid = Number(prefs.webmailLastUid || 0);
  const highest = items.reduce((max, m) => Math.max(max, Number(m.uid) || 0), 0);

  const remember = () => {
    const fresh = usersRepo.getById(userId) || user;
    const p = fresh.preferences || {};
    p.webmailLastUid = highest;
    usersRepo.update(userId, { preferences: p });
  };

  if (!lastUid) { remember(); return { sent: null, skipped: 'first_run' }; }

  const fresh = items.filter((m) => Number(m.uid) > lastUid);
  if (!fresh.length) return { sent: null, skipped: 'nothing_new' };

  const msg = summarise(fresh);
  // Record before sending: a send failure must not replay the same mail forever.
  remember();

  if (send && wa().ready()) {
    try { await wa().sendProactiveMessage(user, msg, { logLabel: 'webmail' }); }
    catch (err) { console.warn('[webmailAlerts] send failed:', err.message); }
  } else if (send) {
    console.log('[webmailAlerts] (WA not ready) would notify:', user.phone);
  }
  return { sent: msg, count: fresh.length };
}

/** Sweep every connected mailbox. Never throws. */
async function runAllUsers({ send = true } = {}) {
  const { db } = require('../db');
  const rows = db.prepare(
    "SELECT id FROM users WHERE webmail_address IS NOT NULL AND webmail_address != ''"
  ).all();

  const results = [];
  for (const row of rows) {
    try {
      const r = await checkUser(row.id, { send });
      if (r.sent) results.push({ userId: row.id, count: r.count });
    } catch (err) {
      console.warn('[webmailAlerts] failed for', row.id, err.message);
    }
  }
  if (results.length) console.log('[webmailAlerts] notified', results.length, 'user(s)');
  return results;
}

module.exports = { checkUser, runAllUsers, summarise };
