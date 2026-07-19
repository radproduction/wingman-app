'use strict';

/**
 * Work clock tools. Sessions arrive from whatever the user connected (their
 * company's HRMS posting to a private URL) or from them simply saying so.
 */
const workTools = [
  {
    name: 'get_work_status',
    description:
      'Check whether the user is currently clocked in, how long they have been on ' +
      'the clock, and how many hours they have logged today. Use for "am I still ' +
      'clocked in?", "kitne ghante ho gaye?", "how long have I been at work?", or ' +
      'before commenting on their working day.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'clock_action',
    description:
      'ACTUALLY clock the user in or out on their company attendance system. Use ' +
      'when they ASK you to do it: "clock me out", "clock out kar do", "clock me ' +
      'in", "punch me out". This changes their real timesheet.\n' +
      'Do NOT use this when they are merely telling you what they already did ' +
      '("I clocked out at 6") — that is log_work_event.\n' +
      'If it returns ACTION_NOT_CONFIGURED, they have not connected the ' +
      'clock-out side yet; tell them it can be set up in Settings → Work clock, ' +
      'and do not claim anything was clocked.',
    input_schema: {
      type: 'object',
      properties: {
        event: { type: 'string', enum: ['clock_in', 'clock_out'], description: 'Which action to perform.' },
      },
      required: ['event'],
    },
  },
  {
    name: 'log_work_event',
    description:
      'Record a clock-in or clock-out the user TELLS you already happened ("clock ' +
      'kar diya tha", "I got in at 9", "just clocked out myself"). This only ' +
      "updates Wingman's own record — it does NOT touch their company system. " +
      'If they wanted you to actually do it, use clock_action instead.',
    input_schema: {
      type: 'object',
      properties: {
        event: { type: 'string', enum: ['clock_in', 'clock_out'], description: 'Which event.' },
        at: { type: 'string', description: 'ISO time if they said a specific one. Omit for now.' },
      },
      required: ['event'],
    },
  },
  {
    name: 'staying_late',
    description:
      'The user says they are staying at work past their usual hours ("aaj late ' +
      'baithunga", "staying till 9", "no I\'m still working"). Stops the ' +
      'clock-out reminder for the rest of this shift. Use this instead of arguing ' +
      'when they push back on a reminder you just sent.',
    input_schema: {
      type: 'object',
      properties: {
        until: { type: 'string', description: 'ISO time they said they will finish, if they gave one.' },
        hours: { type: 'number', description: 'How many more hours, if they said that instead.' },
      },
      required: [],
    },
  },
  {
    name: 'get_work_connect_link',
    description:
      'Get the private webhook URL for connecting an attendance / HRMS system. ' +
      'Use when the user asks to connect their clock-in software, or when ' +
      'get_work_status returns WORK_NOT_CONNECTED.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
];

const workToolNames = new Set(workTools.map((t) => t.name));

module.exports = { workTools, workToolNames };
