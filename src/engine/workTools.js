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
    name: 'log_work_event',
    description:
      'Record a clock-in or clock-out the user tells you about directly ("clock ' +
      'kar diya", "just clocked out", "I got in at 9"). Only when they say it — ' +
      'this does NOT clock them in on their company system, it only keeps ' +
      "Wingman's own picture straight, so say so if they seem to expect otherwise.",
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
