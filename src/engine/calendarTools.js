'use strict';

/**
 * Anthropic tool definitions for calendar operations. Claude decides when to
 * call these; the engine executes them against the calendar service.
 *
 * All datetimes are ISO 8601 with timezone offset (Claude is told the user's
 * timezone and current time in the system prompt so it can resolve relatives).
 */
const calendarTools = [
  {
    name: 'get_events',
    description:
      "Fetch the user's calendar events for a given range. Use for questions like " +
      "\"what's my schedule today/tomorrow/this week?\".",
    input_schema: {
      type: 'object',
      properties: {
        range: {
          type: 'string',
          enum: ['today', 'tomorrow', 'week'],
          description: 'Which range of events to fetch.',
        },
      },
      required: ['range'],
    },
  },
  {
    name: 'create_event',
    description:
      'Create a new calendar event. Use for "schedule a meeting with X at TIME on DATE" ' +
      'or "block TIME for focus time".',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Event title, e.g. "Meeting with Ali" or "Focus time".' },
        start_time: { type: 'string', description: 'Start datetime, ISO 8601 with offset, e.g. 2026-07-02T15:00:00+04:00.' },
        end_time: { type: 'string', description: 'End datetime, ISO 8601 with offset. If unspecified, default to 1 hour after start.' },
        description: { type: 'string', description: 'Optional details.' },
        location: { type: 'string', description: 'Optional location.' },
      },
      required: ['title', 'start_time', 'end_time'],
    },
  },
  {
    name: 'update_event',
    description:
      'Reschedule or edit an existing event. Use for "move my 3pm meeting to 4pm". ' +
      'First call get_events to find the event id if you do not have it.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The Google Calendar event id to update.' },
        title: { type: 'string' },
        start_time: { type: 'string', description: 'New start datetime, ISO 8601 with offset.' },
        end_time: { type: 'string', description: 'New end datetime, ISO 8601 with offset.' },
        description: { type: 'string' },
        location: { type: 'string' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'delete_event',
    description: 'Cancel/delete an event. Use for "cancel my 3pm meeting". Find the event id via get_events first.',
    input_schema: {
      type: 'object',
      properties: {
        event_id: { type: 'string', description: 'The Google Calendar event id to delete.' },
      },
      required: ['event_id'],
    },
  },
  {
    name: 'check_conflicts',
    description: 'Check whether a time slot is free. Use for "am I free at 3pm tomorrow?".',
    input_schema: {
      type: 'object',
      properties: {
        start_time: { type: 'string', description: 'Slot start, ISO 8601 with offset.' },
        end_time: { type: 'string', description: 'Slot end, ISO 8601 with offset.' },
      },
      required: ['start_time', 'end_time'],
    },
  },
];

module.exports = { calendarTools };
