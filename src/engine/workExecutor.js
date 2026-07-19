'use strict';

const work = require('../services/work');
const sessionsRepo = require('../db/workSessions');
const config = require('../config');

/** Execute a work-clock tool. Never throws — errors become {error}. */
async function executeWorkTool(user, toolUse) {
  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'get_work_connect_link': {
        const token = work.tokenFor(user.id);
        return {
          webhook_url: `${config.publicBaseUrl}/work/event/${token}`,
          how: 'In the attendance system, POST to this URL when the user clocks in or out, with JSON body {"event":"clock_in"} or {"event":"clock_out"}. An optional "at" (ISO time) is used if present, otherwise the time of the request.',
          also: 'If the system cannot send webhooks, Zapier or Make can bridge it — or the user can just tell Wingman when they clock in.',
          keep_private: 'Anyone with this URL can post clock events for this user, so it should not be shared.',
        };
      }

      case 'get_work_status': {
        const s = work.status(user.id);
        if (!s.connected) return { error: 'WORK_NOT_CONNECTED' };
        return s;
      }

      case 'log_work_event': {
        const r = work.handleEvent(user.id, { event: input.event, at: input.at }, { source: 'told_to_wingman' });
        if (!r.ok) return { error: 'INVALID_EVENT', detail: 'Expected clock_in or clock_out.' };
        if (r.event === 'clock_in') {
          return r.duplicate
            ? { recorded: false, detail: 'They were already clocked in — nothing changed.' }
            : { recorded: true, event: 'clock_in', note: 'Recorded in Wingman only — this does not clock them in on their company system.' };
        }
        if (r.noSession) return { recorded: false, detail: 'There was no open session to close.' };
        return {
          recorded: true,
          event: 'clock_out',
          worked: work.fmtDuration(r.hours),
          note: 'Recorded in Wingman only — this does not clock them out on their company system.',
        };
      }

      case 'staying_late': {
        const open = sessionsRepo.currentOpen(user.id);
        if (!open) return { ok: false, detail: 'They are not clocked in right now.' };
        const r = work.stayLate(user.id, {
          untilISO: input.until || null,
          hours: input.hours || work.DEFAULT_SNOOZE_HOURS,
        });
        return r.ok
          ? { ok: true, detail: 'Clock-out reminders are off for the rest of this shift.' }
          : { ok: false, detail: 'Nothing to snooze.' };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err && err.message) || 'work_operation_failed' };
  }
}

module.exports = { executeWorkTool };
