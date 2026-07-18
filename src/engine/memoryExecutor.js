'use strict';

const memoryRepo = require('../db/userMemory');

/** Execute a memory tool. Never throws — errors become {error}. */
async function executeMemoryTool(user, toolUse) {
  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'remember_fact': {
        // Explicit facts outrank inferred ones and are never auto-evicted.
        const r = memoryRepo.add(user.id, {
          fact: input.fact,
          category: input.category || 'context',
          source: 'explicit',
        });
        if (!r.added && r.reason === 'duplicate') {
          return { remembered: true, already_known: true, fact: input.fact };
        }
        if (!r.added) return { error: 'INVALID_FACT', detail: 'That fact was empty or too short to store.' };
        return { remembered: true, fact: input.fact };
      }

      case 'forget_fact': {
        const r = memoryRepo.removeMatching(user.id, input.about || '');
        return r.removed
          ? { forgotten: true, count: r.removed }
          : { forgotten: false, detail: 'Nothing stored matched that.' };
      }

      case 'list_known_facts': {
        const facts = memoryRepo.listForUser(user.id);
        return {
          count: facts.length,
          facts: facts.map((f) => ({ fact: f.fact, category: f.category, source: f.source })),
        };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err && err.message) || 'memory_operation_failed' };
  }
}

module.exports = { executeMemoryTool };
