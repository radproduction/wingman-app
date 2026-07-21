'use strict';

const tasksRepo = require('../db/tasks');
const googleTasks = require('../services/googleTasks');
const t = require('../utils/time');

async function executeTaskTool(user, toolUse) {
  const { name, input } = toolUse;
  const tz = user.timezone || 'Asia/Karachi';

  try {
    switch (name) {
      case 'list_tasks': {
        if (googleTasks.isConnected(user)) {
          try { await googleTasks.syncUser(user.id); } catch (_) { /* keep cached tasks */ }
        }
        const limit = Math.min(Math.max(parseInt(input.limit, 10) || 20, 1), 50);
        const rows = input.only_overdue
          ? tasksRepo.listOverdue(user.id, new Date().toISOString()).slice(0, limit)
          : tasksRepo.listForUser(user.id, {
            includeCompleted: !!input.include_completed,
            limit,
          });
        return {
          google_tasks_connected: googleTasks.isConnected(user),
          count: rows.length,
          tasks: rows.map((task) => ({
            id: task.id,
            title: task.title,
            due_date: task.due_date || null,
            due_label: task.due_date ? `${t.dayLabel(task.due_date, tz)} ${t.timeLabel(task.due_date, tz)}` : null,
            completed: !!task.completed,
            source: task.source || 'manual',
          })),
        };
      }

      case 'create_task': {
        const created = tasksRepo.create({
          userId: user.id,
          title: input.title,
          source: 'whatsapp',
          priority: Number.isFinite(Number(input.priority)) ? Number(input.priority) : 3,
          dueDate: input.due_date || null,
        });
        let sync = { synced: false, reason: 'NOT_CONNECTED' };
        try { sync = await googleTasks.mirrorNewLocalTask(created.id); } catch (err) {
          sync = { synced: false, reason: err.message || 'SYNC_FAILED' };
        }
        return {
          created: true,
          task: {
            id: created.id,
            title: created.title,
            due_date: created.due_date || null,
            due_label: created.due_date ? `${t.dayLabel(created.due_date, tz)} ${t.timeLabel(created.due_date, tz)}` : null,
          },
          google_tasks_connected: googleTasks.isConnected(user),
          synced_to_google_tasks: !!sync.synced,
          sync_reason: sync.reason || null,
        };
      }

      case 'complete_task': {
        const task = tasksRepo.findByTitle(user.id, input.query || '');
        if (!task) return { error: 'TASK_NOT_FOUND' };
        tasksRepo.complete(task.id);
        let sync = { synced: false, reason: 'NOT_CONNECTED' };
        try { sync = await googleTasks.mirrorTaskCompletion(task.id); } catch (err) {
          sync = { synced: false, reason: err.message || 'SYNC_FAILED' };
        }
        return {
          completed: true,
          task: {
            id: task.id,
            title: task.title,
          },
          synced_to_google_tasks: !!sync.synced,
          sync_reason: sync.reason || null,
        };
      }

      case 'move_task': {
        const task = tasksRepo.findByTitle(user.id, input.query || '');
        if (!task) return { error: 'TASK_NOT_FOUND' };
        const updated = tasksRepo.updateDueDate(task.id, input.due_date || null);
        let sync = { synced: false, reason: 'NOT_CONNECTED' };
        try { sync = await googleTasks.mirrorTaskUpdate(task.id); } catch (err) {
          sync = { synced: false, reason: err.message || 'SYNC_FAILED' };
        }
        return {
          moved: true,
          task: {
            id: updated.id,
            title: updated.title,
            due_date: updated.due_date || null,
            due_label: updated.due_date ? `${t.dayLabel(updated.due_date, tz)} ${t.timeLabel(updated.due_date, tz)}` : null,
          },
          synced_to_google_tasks: !!sync.synced,
          sync_reason: sync.reason || null,
        };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err && err.message) || 'task_operation_failed' };
  }
}

module.exports = { executeTaskTool };
