'use strict';

const calendarService = require('../services/calendar');
const googleAuth = require('../auth/googleAuth');

/**
 * Execute a single Claude tool_use block against the calendar service.
 * Returns a plain-object result that will be sent back to Claude as the
 * tool_result content.
 *
 * @param {Object} user
 * @param {{name:string, input:Object}} toolUse
 * @returns {Promise<Object>}
 */
async function executeCalendarTool(user, toolUse) {
  if (!googleAuth.isConnected(user)) {
    return { error: 'CALENDAR_NOT_CONNECTED' };
  }

  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'get_events': {
        const { label, events } = await calendarService.getEvents(user.id, input.range || 'today');
        return {
          label,
          count: events.length,
          events: events.map((e) => ({
            id: e.gcalEventId,
            title: e.title,
            start: e.startTime,
            end: e.endTime,
            location: e.location,
          })),
        };
      }

      case 'create_event': {
        const ev = await calendarService.createEvent(user.id, {
          title: input.title,
          startTime: input.start_time,
          endTime: input.end_time,
          description: input.description || '',
          location: input.location || '',
          attendees: input.attendees || [],
        });
        return {
          created: true,
          id: ev.gcalEventId,
          title: ev.title,
          start: ev.startTime,
          end: ev.endTime,
          description: ev.description || '',
          attendees: ev.attendees || [],
          invites_emailed: (ev.attendees || []).length > 0,
        };
      }

      case 'update_event': {
        const ev = await calendarService.updateEvent(user.id, input.event_id, {
          title: input.title,
          startTime: input.start_time,
          endTime: input.end_time,
          description: input.description,
          location: input.location,
          attendees: input.attendees,
        });
        return {
          updated: true,
          id: ev.gcalEventId,
          title: ev.title,
          start: ev.startTime,
          end: ev.endTime,
          attendees: ev.attendees || [],
          guests_notified: true,
        };
      }

      case 'delete_event': {
        await calendarService.deleteEvent(user.id, input.event_id);
        return { deleted: true, id: input.event_id, guests_notified: true };
      }

      case 'check_conflicts': {
        const { free, conflicts } = await calendarService.checkConflicts(user.id, input.start_time, input.end_time);
        return { free, conflicts };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    if (err.message === 'CALENDAR_NOT_CONNECTED') {
      return { error: 'CALENDAR_NOT_CONNECTED' };
    }
    return { error: err.message || 'calendar_operation_failed' };
  }
}

module.exports = { executeCalendarTool };
