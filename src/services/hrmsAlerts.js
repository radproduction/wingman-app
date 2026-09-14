'use strict';

/**
 * NOW HRMS → Wingman event alerts (Phase 1).
 *
 * When something happens for an employee in NOW HRMS (a new project or task is
 * assigned, a leave is decided, a payslip is issued), NOW HRMS forwards the
 * event to Wingman's /work/company-notify webhook. Here we turn that event into
 * a short, friendly WhatsApp message and send it PROACTIVELY — so the employee
 * hears it on WhatsApp, not only inside the portal.
 *
 * NOW HRMS already builds a notification (title + message) for each of these, so
 * we lean on those and only prettify the ones worth a distinct voice. Unknown
 * types fall back to the title/message NOW HRMS sent, so a new notification kind
 * still reaches the user without a Wingman change.
 */

const wa = () => require('../whatsapp/client');

// Trim + collapse whitespace; empty → ''.
function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

/**
 * Turn a NOW HRMS event into a WhatsApp message. Returns null to SKIP (an event
 * we deliberately don't push, or one with nothing to say).
 *
 * event = {
 *   type, title, message,        // straight from NOW HRMS's notification
 *   due?, projectName?, taskTitle?, priority?   // optional extras if sent
 * }
 */
function formatAlert(event = {}) {
  const type = clean(event.type).toLowerCase();
  const title = clean(event.title);
  const message = clean(event.message);
  const due = clean(event.due);
  const dueBit = due ? ` — due _${due}_` : '';

  switch (type) {
    case 'project_assigned': {
      const name = clean(event.projectName) || title.replace(/^new project assigned:?\s*/i, '') || 'a new project';
      return `🆕 *New project assigned*\n${name}${dueBit}.${message && !/assigned/i.test(name) ? `\n${message}` : ''}`.trim();
    }
    case 'task_assigned': {
      const task = clean(event.taskTitle) || title.replace(/^new task assigned:?\s*/i, '') || 'a new task';
      return `✅ *New task assigned*\n${task}${dueBit}.`;
    }
    case 'leave_approved':
      return '🏖️ Your leave was *approved*.';
    case 'leave_rejected':
      return `❌ Your leave was *rejected*${message ? `\n${message}` : '.'}`;
    case 'payslip_issued':
      // Nice-to-have, not the Phase 1 focus, but free: pass NOW HRMS's own line.
      return `💰 ${title || 'Payslip update'}${message ? `\n${message}` : ''}`;
    default:
      // Any other notification kind: forward NOW HRMS's own wording so nothing
      // is silently dropped. Skip only if there's genuinely nothing to say.
      if (!title && !message) return null;
      return `🔔 ${title || 'Update'}${message ? `\n${message}` : ''}`;
  }
}

/**
 * Send the alert for one event to one user. Best-effort; never throws.
 * Returns { sent: boolean, skipped?: true }.
 */
async function handleEvent(user, event) {
  const text = formatAlert(event);
  if (!text) return { sent: false, skipped: true };
  try {
    if (!wa().ready()) return { sent: false, skipped: true };
    await wa().sendProactiveMessage(user, text, { logLabel: 'hrms' });
    return { sent: true };
  } catch (err) {
    console.warn('[hrmsAlerts] send failed:', err.message);
    return { sent: false };
  }
}

module.exports = { formatAlert, handleEvent };
