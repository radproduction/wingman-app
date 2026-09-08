'use strict';

const { db, uuid } = require('./index');

/**
 * Audit trail of what Wingman DID for a user — tasks/goals created, emails and
 * notes sent, bills marked paid, etc. Powers "what have you done for me?" and the
 * trust story ("see everything your agent has done"). Every write is best-effort:
 * logging must NEVER break the action it records.
 */

function log(userId, { kind, summary, source = 'chat' } = {}) {
  if (!userId || !summary) return null;
  const id = uuid();
  try {
    db.prepare('INSERT INTO agent_actions (id, user_id, kind, summary, source) VALUES (?, ?, ?, ?, ?)')
      .run(id, userId, kind || 'action', String(summary).slice(0, 300), source || 'chat');
    return id;
  } catch (_) {
    return null;
  }
}

// Keys a mutating tool result carries when it actually DID something (vs a
// read-only list_/get_). Only these get audited.
const MUTATION_KEYS = ['created', 'updated', 'completed', 'moved', 'done', 'sent', 'deleted', 'dispatched', 'marked'];

/** Log a chat-tool call IF it mutated state. Returns null for reads/failures. */
function logToolAction(userId, toolName, result) {
  try {
    if (!result || typeof result !== 'object' || result.error) return null;
    if (!MUTATION_KEYS.some((k) => result[k])) return null;
    const summary = summarize(toolName, result);
    if (!summary) return null;
    return log(userId, { kind: `chat.${toolName}`, summary, source: 'chat' });
  } catch (_) {
    return null;
  }
}

function summarize(tool, r) {
  const title = (r.task && r.task.title) || (r.goal && r.goal.title) || r.title || '';
  switch (tool) {
    case 'create_task': return `Created task${title ? `: ${title}` : ''}`;
    case 'complete_task': return `Completed task${title ? `: ${title}` : ''}`;
    case 'move_task': return `Rescheduled task${title ? `: ${title}` : ''}`;
    case 'create_goal': return `Set goal${title ? `: ${title}` : ''}`;
    case 'update_goal_progress': return `Updated progress on goal${title ? `: ${title}` : ''}`;
    case 'complete_goal': return `${r.dropped ? 'Dropped' : 'Achieved'} goal${title ? `: ${title}` : ''}`;
    default: {
      const verb = MUTATION_KEYS.find((k) => r[k]) || 'did';
      return `${verb} via ${tool.replace(/_/g, ' ')}`;
    }
  }
}

function listForUser(userId, { sinceHours = 24, limit = 40 } = {}) {
  const since = new Date(Date.now() - sinceHours * 3600000).toISOString().replace('T', ' ').slice(0, 19);
  try {
    return db.prepare(
      'SELECT kind, summary, source, created_at FROM agent_actions WHERE user_id = ? AND created_at > ? ORDER BY created_at DESC LIMIT ?',
    ).all(userId, since, limit);
  } catch (_) {
    return [];
  }
}

module.exports = { log, logToolAction, listForUser };
