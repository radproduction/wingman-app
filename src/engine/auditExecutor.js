'use strict';

const audit = require('../db/agentActions');
const t = require('../utils/time');

async function executeAuditTool(user, toolUse) {
  const { name, input } = toolUse;
  if (name !== 'list_recent_actions') return { error: `Unknown tool: ${name}` };
  const tz = user.timezone || 'Asia/Karachi';
  const hours = Math.min(Math.max(parseInt(input.hours, 10) || 24, 1), 24 * 30);
  const rows = audit.listForUser(user.id, { sinceHours: hours, limit: 40 });
  return {
    window_hours: hours,
    count: rows.length,
    actions: rows.map((a) => {
      // stored as sqlite UTC 'YYYY-MM-DD HH:MM:SS' → make it a parseable instant
      const iso = `${String(a.created_at).replace(' ', 'T')}Z`;
      return {
        summary: a.summary,
        on_its_own: a.source === 'proactive',
        when: `${t.dayLabel(iso, tz)} ${t.timeLabel(iso, tz)}`,
      };
    }),
  };
}

module.exports = { executeAuditTool };
