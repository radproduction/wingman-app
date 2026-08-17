'use strict';

const gmail = require('./gmail');
const googleAuth = require('../auth/googleAuth');
const googleAccounts = require('../db/googleAccounts');

/**
 * Email a meeting summary to the attendees who have an address, and to the user
 * (so they keep a copy). Sends from the user's connected Gmail. Best-effort per
 * recipient — one failure never blocks the others.
 */

function validEmail(e) {
  return typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());
}

/** Plain-text email body built from the structured summary. */
function formatBody(meeting, summary) {
  const lines = [];
  lines.push(meeting.title || 'Meeting');
  if (meeting.meeting_at) {
    const d = new Date(meeting.meeting_at);
    if (!Number.isNaN(d.getTime())) lines.push(d.toLocaleString());
  }
  lines.push('');
  if (summary.overview) lines.push(summary.overview, '');

  const section = (heading, items, fmt) => {
    if (!items || !items.length) return;
    lines.push(heading);
    for (const it of items) lines.push(`  • ${fmt ? fmt(it) : it}`);
    lines.push('');
  };

  section('Decisions', summary.decisions);
  section('Action items', summary.actions, (a) => {
    const bits = [a.task];
    const meta = [a.owner, a.due].filter(Boolean).join(', ');
    if (meta) bits.push(`(${meta})`);
    if (a.priority && a.priority !== 'Medium') bits.push(`[${a.priority}]`);
    return bits.join(' ');
  });
  section('Discussion', summary.discussion);
  section('Open questions', summary.openQuestions);
  section('Follow-ups', summary.followUps);

  lines.push('— Sent by Wingman');
  return lines.join('\n');
}

/**
 * @returns {Promise<{ sent: string[], failed: string[], skipped: boolean, reason?: string }>}
 */
async function sendSummary(user, meeting, summary) {
  if (!googleAuth.isEmailConnected(user)) {
    return { sent: [], failed: [], skipped: true, reason: 'gmail_not_connected' };
  }

  const recipients = new Set();
  for (const a of meeting.attendees || []) {
    if (a && validEmail(a.email)) recipients.add(a.email.trim().toLowerCase());
  }
  // The user's own address, so they always keep a copy.
  const primary = googleAccounts.getPrimary(user.id);
  if (primary && validEmail(primary.email)) recipients.add(String(primary.email).trim().toLowerCase());

  const list = [...recipients];
  if (!list.length) return { sent: [], failed: [], skipped: true, reason: 'no_recipients' };

  const subject = `Notes: ${meeting.title || 'Meeting'}`;
  const body = formatBody(meeting, summary);

  const sent = [];
  const failed = [];
  for (const to of list) {
    try {
      await gmail.sendMessage(user, { to, subject, body });
      sent.push(to);
    } catch (_) {
      failed.push(to);
    }
  }
  return { sent, failed, skipped: false };
}

module.exports = { sendSummary, formatBody };
