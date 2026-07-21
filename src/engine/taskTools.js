'use strict';

const taskTools = [
  {
    name: 'list_tasks',
    description:
      "List the user's tasks, including ones synced from Google Tasks. Use for " +
      '"what are my tasks?", "show my Google Tasks", "anything overdue?", or ' +
      '"what do I need to do today?".',
    input_schema: {
      type: 'object',
      properties: {
        include_completed: { type: 'boolean', description: 'Include completed tasks too.' },
        only_overdue: { type: 'boolean', description: 'Return only overdue tasks.' },
        limit: { type: 'number', description: 'Maximum tasks to return (default 20).' },
      },
      required: [],
    },
  },
  {
    name: 'create_task',
    description:
      'Create a new task or reminder for the user. Use when they ask you to remember, ' +
      'remind, add a task, or create a Google Task. If Google Tasks is connected, ' +
      'the task will be synced there too.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Short imperative task title, e.g. "Call Ali".' },
        due_date: { type: 'string', description: 'Optional ISO 8601 datetime with timezone offset.' },
        priority: { type: 'number', description: '1 (high) to 5 (low). Default 3.' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description:
      'Mark a task as completed. Use when the user says something is done or asks you to complete a task.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Task title or distinctive phrase to match.' },
      },
      required: ['query'],
    },
  },
  {
    name: 'move_task',
    description:
      'Move or reschedule a task to a new due time. Use when the user wants a reminder/task shifted.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Task title or distinctive phrase to match.' },
        due_date: { type: 'string', description: 'New ISO 8601 datetime with timezone offset.' },
      },
      required: ['query', 'due_date'],
    },
  },
];

const taskToolNames = new Set(taskTools.map((t) => t.name));

module.exports = { taskTools, taskToolNames };
