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

      case 'clock_action': {
        const r = await work.performClock(user.id, input.event);
        if (r.ok) {
          if (r.already) {
            return {
              done: true,
              event: r.event,
              detail: r.event === 'clock_in'
                ? 'They were already clocked in — the system accepted it, nothing changed.'
                : 'There was no open shift on our side, but the system accepted the clock-out.',
            };
          }
          return { done: true, event: r.event, at: r.at, worked: r.worked || undefined };
        }
        // Be precise about the failure — the user must never be left thinking
        // their timesheet was fixed when it wasn't.
        const reasons = {
          ACTION_NOT_CONFIGURED: 'Clocking from chat is not set up yet — it can be connected in Settings → Work clock.',
          TIMEOUT: 'Their attendance system did not respond in time. Nothing was clocked.',
          UNREACHABLE: 'Could not reach their attendance system. Nothing was clocked.',
          REJECTED: 'Their attendance system refused the request (the secret did not match). Nothing was clocked.',
          REDIRECTED: r.detail,
          UNSAFE_URL: r.detail,
          SECRET_UNREADABLE: 'The stored secret could not be read — it needs setting up again in Settings.',
          INVALID_EVENT: 'Expected clock_in or clock_out.',
        };
        return {
          error: r.error,
          detail: reasons[r.error] || r.detail || 'That did not go through, so nothing was clocked.',
          clocked: false,
        };
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

      case 'get_hrms_status': {
        const nowHrmsData = require('../services/nowHrmsData');
        if (!nowHrmsData.connected(user)) return { error: 'NOWHRMS_NOT_CONNECTED' };
        // force: a direct question deserves a live read, not a cached one.
        const d = await nowHrmsData.getData(user, { force: true });
        if (!d) return { error: 'NOWHRMS_UNREACHABLE', detail: 'Could not reach NOW HRMS just now.' };
        return {
          clocked_in: (d.clock && d.clock.clocked_in) || false,
          clocked_in_since: (d.clock && d.clock.since) || null,
          hours_today: (d.hours && d.hours.today) || 0,
          hours_week: (d.hours && d.hours.week) || 0,
          open_tasks: (d.tasks && d.tasks.open) || 0,
          tasks: ((d.tasks && d.tasks.items) || []).map((t) => ({
            title: t.title, status: t.status, priority: t.priority, due: t.due, project: t.project,
          })),
          projects: (d.projects || []).map((p) => ({ name: p.name, status: p.status, priority: p.priority })),
          leaves_pending: (d.leaves && d.leaves.pending) || 0,
          leaves: (d.leaves && d.leaves.items) || [],
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
