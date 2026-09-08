'use strict';

const auditTools = [
  {
    name: 'list_recent_actions',
    description:
      'Show the AUDIT TRAIL — what Wingman has actually done for the user (tasks/goals created, ' +
      'emails and meeting notes sent, bills marked paid, etc.), including proactive things it did on ' +
      'its own. Use for "what have you done for me?", "what did you do today?", "show my activity".',
    input_schema: {
      type: 'object',
      properties: {
        hours: { type: 'number', description: 'Look back this many hours (default 24; use 168 for a week).' },
      },
      required: [],
    },
  },
];

const auditToolNames = new Set(auditTools.map((t) => t.name));

module.exports = { auditTools, auditToolNames };
