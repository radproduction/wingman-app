'use strict';

const usersRepo = require('../db/users');
const webmail = require('./webmail');
const proactiveGate = require('./proactiveGate');
const { analyzeEmail } = require('./emailAnalyzer');

function wa() { return require('../whatsapp/client'); }

/**
 * Tells the user when new mail lands in their BUSINESS mailbox — and, crucially,
 * which of it is IMPORTANT and what it's about, so a customer email that needs
 * them doesn't sit unseen. Each new email is read and classified (urgent /
 * needs-reply vs FYI); the important ones lead the alert with a one-line summary,
 * the rest are a brief count.
 *
 * Reading works over IMAP even where outbound SMTP is blocked, so this half of
 * the feature is useful on its own.
 */

// Analyse at most this many new emails per sweep (bounds the Claude cost).
const MAX_ANALYZE = 5;
const IMPORTANT = new Set(['urgent', 'needs_reply']);

/** Classify one new email from its (pre-fetched) full body. Safe fallback. */
async function classify(meta, full) {
  const plain = {
    uid: meta.uid,
    subject: (full && full.subject) || meta.subject || '(no subject)',
    from: (full && full.fromAddress) || meta.fromAddress || meta.from || 'unknown sender',
    category: 'fyi',
    summary: '',
    important: false,
  };
  try {
    const analysis = await analyzeEmail({
      subject: plain.subject,
      sender: (full && full.from) || meta.from,
      body: (full && full.body) || '',
    });
    return { ...plain, category: analysis.category, summary: analysis.summary || '', important: IMPORTANT.has(analysis.category) };
  } catch (_) {
    return plain;
  }
}

function buildAlert(classified) {
  const important = classified.filter((c) => c.important);
  const rest = classified.filter((c) => !c.important);
  const lines = [];

  if (important.length) {
    lines.push(`📬 *${important.length} important email${important.length === 1 ? '' : 's'}* in your business inbox:`);
    for (const c of important) {
      const flag = c.category === 'urgent' ? '🔴' : '✉️';
      lines.push('');
      lines.push(`${flag} *${c.subject}* — ${c.from}`);
      if (c.summary) lines.push(`   ${c.summary}`);
    }
    if (rest.length) {
      lines.push('');
      lines.push(`Plus ${rest.length} other new email${rest.length === 1 ? '' : 's'}.`);
    }
    lines.push('');
    lines.push('Want me to reply to any of these? Just tell me — however you like.');
  } else {
    // Nothing urgent — a light heads-up, not an alarm.
    lines.push(`📬 ${classified.length} new business email${classified.length === 1 ? '' : 's'}, nothing urgent.`);
    for (const c of classified.slice(0, 3)) lines.push(`• ${c.subject} — ${c.from}`);
    if (classified.length > 3) lines.push(`…and ${classified.length - 3} more.`);
    lines.push('');
    lines.push('Tell me if you want to see them or reply to any.');
  }
  return lines.join('\n');
}

// Kept for backward compatibility / tests: a plain list summary.
function summarise(items) {
  const lines = [`📬 ${items.length} new email${items.length === 1 ? '' : 's'} in your business inbox:`];
  for (const m of items.slice(0, MAX_ANALYZE)) {
    const from = m.fromAddress || m.from || 'unknown sender';
    lines.push(`• ${m.subject || '(no subject)'} — ${from}`);
  }
  if (items.length > MAX_ANALYZE) lines.push(`…and ${items.length - MAX_ANALYZE} more.`);
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

  // Read + classify the newest ones so we can lead with what's important and say
  // what each is about (not just subject + sender). Bodies are fetched over a
  // SINGLE connection to avoid hammering the mail host.
  const toAnalyze = fresh.slice(-MAX_ANALYZE); // newest N
  let bodies = new Map();
  try { bodies = await webmail.readBodies(user, toAnalyze.map((m) => m.uid)); }
  catch (err) { console.warn('[webmailAlerts] body read failed:', err.message); }
  const classified = [];
  for (const m of toAnalyze) classified.push(await classify(m, bodies.get(Number(m.uid))));
  // Newest first in the message.
  classified.reverse();
  const extra = fresh.length - classified.length;
  const msg = buildAlert(classified) + (extra > 0 ? `\n(+${extra} more not shown)` : '');
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
  // Deduped by phone (+ junk phones excluded) so a duplicate account never
  // double-alerts the same inbox — matches every other proactive sweep.
  const rows = require('../db/users').listWebmailUsers();

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
