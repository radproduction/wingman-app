'use strict';

const automationsRepo = require('../db/automations');

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

function describe(a) {
  const when = a.kind === 'daily' ? 'every day'
    : a.kind === 'weekdays' ? 'every weekday'
      : a.kind === 'weekly' ? `every ${WEEKDAYS[a.weekday] || 'week'}`
        : a.run_date ? `on ${a.run_date}` : 'once';
  return `${a.instruction} — ${when} at ${a.time}`;
}

/** Execute an automation tool. Never throws — errors become {error}. */
async function executeAutomationTool(user, toolUse) {
  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'create_automation': {
        const time = /^\d{1,2}:\d{2}$/.test(String(input.time || '')) ? input.time : null;
        if (!time) return { error: 'INVALID_TIME', detail: 'Give the time as HH:MM, e.g. 07:00.' };

        const kind = ['daily', 'weekdays', 'weekly', 'once'].includes(input.kind) ? input.kind : 'daily';
        const weekday = kind === 'weekly' ? WEEKDAYS.indexOf(String(input.weekday || '').toLowerCase()) : null;
        if (kind === 'weekly' && (weekday == null || weekday < 0)) {
          return { error: 'MISSING_WEEKDAY', detail: 'For a weekly automation, say which day.' };
        }
        const runDate = kind === 'once'
          ? (/^\d{4}-\d{2}-\d{2}$/.test(String(input.date || '')) ? input.date : null)
          : null;
        if (kind === 'once' && !runDate) return { error: 'MISSING_DATE', detail: 'For a one-off, give the date as YYYY-MM-DD.' };

        const a = automationsRepo.create(user.id, {
          instruction: input.instruction,
          time,
          kind,
          weekday: weekday != null && weekday >= 0 ? weekday : null,
          runDate,
          timezone: user.timezone || 'Asia/Karachi',
        });
        return { created: true, id: a.id, summary: describe(a) };
      }

      case 'list_automations': {
        const list = automationsRepo.listForUser(user.id);
        return {
          count: list.length,
          automations: list.map((a) => ({ id: a.id, summary: describe(a) })),
        };
      }

      case 'cancel_automation': {
        const ok = automationsRepo.cancelForUser(user.id, input.automation_id);
        return ok ? { cancelled: true } : { error: 'NOT_FOUND', detail: 'No such automation for this user.' };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err && err.message) || 'automation_operation_failed' };
  }
}

module.exports = { executeAutomationTool, describe };
