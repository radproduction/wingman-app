'use strict';

/**
 * Automations — standing instructions Wingman carries out on schedule, on its
 * own. These are NOT to-do tasks. When the user says "every morning send me the
 * traffic to the office", that is an automation, not a reminder for them to do
 * something.
 */
const automationTools = [
  {
    name: 'create_automation',
    description:
      'Set up a STANDING INSTRUCTION that YOU (Wingman) will carry out automatically ' +
      'at a time, on your own. Use this whenever the user asks you to DO something ' +
      'for them repeatedly or at a future time — "every morning at 7 send me the ' +
      'traffic to the office", "each Friday email me the week\'s sales", "at 6pm ' +
      'clock me out", "remind me to take my medicine at 9pm daily".\n' +
      'This is NOT a to-do task (that is create_task, a reminder for the USER to ' +
      'act). An automation is something WINGMAN does. When in doubt: if you will ' +
      'do the work, it is an automation.\n' +
      'Write the `instruction` as a clear directive to your future self, with all ' +
      'the detail needed to act without asking (e.g. "get the driving time from ' +
      'the office to home with current traffic and send it").',
    input_schema: {
      type: 'object',
      properties: {
        instruction: {
          type: 'string',
          description: 'A complete directive to your future self — what to do, with any specifics (places, people, what to include).',
        },
        time: { type: 'string', description: 'Local time to run, 24h HH:MM (e.g. "07:00").' },
        kind: {
          type: 'string',
          enum: ['daily', 'weekdays', 'weekly', 'once'],
          description: 'daily = every day; weekdays = Mon–Fri; weekly = one weekday each week; once = a single time.',
        },
        weekday: {
          type: 'string',
          enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          description: 'For kind="weekly", which day.',
        },
        date: { type: 'string', description: 'For kind="once", the date as YYYY-MM-DD.' },
      },
      required: ['instruction', 'time', 'kind'],
    },
  },
  {
    name: 'list_automations',
    description:
      'List the standing instructions currently set up for the user. Use for ' +
      '"what have you got scheduled for me?", "what reminders do I have set up?".',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'cancel_automation',
    description:
      'Stop a standing instruction. Use for "stop the morning traffic updates", ' +
      '"cancel that daily reminder". Call list_automations first if you need the id.',
    input_schema: {
      type: 'object',
      properties: {
        automation_id: { type: 'string', description: 'The id of the automation to cancel (from list_automations).' },
      },
      required: ['automation_id'],
    },
  },
];

const automationToolNames = new Set(automationTools.map((t) => t.name));

module.exports = { automationTools, automationToolNames };
