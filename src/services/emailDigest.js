'use strict';

const emailItemsRepo = require('../db/emailItems');

/**
 * Build a WhatsApp-formatted email digest from stored email_items.
 *
 * @param {string} userId
 * @param {Object} [opts]
 * @param {number} [opts.limit=100]
 * @returns {string} formatted digest
 */
function buildDigest(userId, { limit = 100 } = {}) {
  const groups = emailItemsRepo.groupedByCategory(userId, limit);

  const urgent = groups.urgent || [];
  const needsReply = groups.needs_reply || [];
  const fyi = groups.fyi || [];

  if (!urgent.length && !needsReply.length && !fyi.length) {
    return "📧 Email Update\n\nInbox is quiet — nothing new to flag right now. ✨";
  }

  const lines = ['📧 *Email Update*', ''];

  if (urgent.length) {
    lines.push(`*Urgent (${urgent.length}):*`);
    for (const e of urgent) lines.push(`• ${formatItem(e)}`);
    lines.push('');
  }

  if (needsReply.length) {
    lines.push(`*Needs Reply (${needsReply.length}):*`);
    for (const e of needsReply) lines.push(`• ${formatItem(e)}`);
    lines.push('');
  }

  if (fyi.length) {
    lines.push(`*FYI (${fyi.length}):*`);
    // FYI is condensed — subjects only, up to 6
    const subjects = fyi.slice(0, 6).map((e) => shortSubject(e));
    lines.push(`• ${subjects.join(', ')}`);
    lines.push('');
  }

  return lines.join('\n').trim();
}

/**
 * Format a single item. Prefers a bill/order/flight-aware one-liner, else
 * falls back to "Sender re: subject".
 */
function formatItem(e) {
  let data = {};
  try { data = JSON.parse(e.extracted_data || '{}'); } catch (_) {}

  if (e.detected_type === 'bill' && (data.company || data.amount)) {
    const parts = [];
    if (data.company) parts.push(`${data.company}`);
    if (data.amount) parts.push(`${data.amount}`);
    if (data.due_date) parts.push(`due ${data.due_date}`);
    return `Invoice — ${parts.join(', ')}`;
  }
  if (e.detected_type === 'order' && (data.item || data.store)) {
    const parts = [data.item, data.store].filter(Boolean).join(' from ');
    return `Order — ${parts}${data.eta ? `, ETA ${data.eta}` : ''}`;
  }
  if (e.detected_type === 'flight' && (data.airline || data.flight_number)) {
    return `Flight — ${[data.airline, data.flight_number].filter(Boolean).join(' ')} ${[data.departure, data.arrival].filter(Boolean).join('→')}`.trim();
  }

  const who = cleanSender(e.sender);
  const subj = shortSubject(e);
  return `${who} re: ${subj}`;
}

function shortSubject(e) {
  const s = (e.subject || e.summary || 'Message').trim();
  return s.length > 60 ? s.slice(0, 57) + '…' : s;
}

function cleanSender(sender) {
  if (!sender) return 'Someone';
  const m = sender.match(/^\s*"?([^"<]+?)"?\s*</);
  return (m ? m[1] : sender).trim();
}

module.exports = { buildDigest, formatItem };
