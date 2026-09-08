'use strict';

const goalsRepo = require('../db/goals');
const goalPlanner = require('../services/goalPlanner');

async function executeGoalTool(user, toolUse) {
  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'create_goal': {
        const title = String(input.title || '').trim();
        if (!title) return { error: 'TITLE_REQUIRED' };
        // Build the action plan with the LLM (best-effort — goal is created either way).
        const { steps, ideas } = await goalPlanner.plan({
          title, detail: input.detail || '', targetDate: input.target_date || null,
        });
        const planArr = steps.map((step) => ({ step, done: false }));
        const goal = goalsRepo.create(user.id, {
          title, detail: input.detail || null, plan: planArr, targetDate: input.target_date || null,
        });
        return {
          created: true,
          goal: { id: goal.id, title: goal.title, target_date: goal.target_date || null },
          plan: steps,
          ideas,
        };
      }

      case 'list_goals': {
        const rows = input.include_finished ? goalsRepo.listForUser(user.id) : goalsRepo.listActive(user.id);
        return {
          count: rows.length,
          goals: rows.map((g) => ({
            title: g.title,
            status: g.status,
            progress: g.progress || 0,
            target_date: g.target_date || null,
            steps_done: (g.plan || []).filter((s) => s.done).length,
            steps_total: (g.plan || []).length,
            next_step: ((g.plan || []).find((s) => !s.done) || {}).step || null,
          })),
        };
      }

      case 'update_goal_progress': {
        const goal = goalsRepo.findByTitle(user.id, input.goal || '');
        if (!goal) return { error: 'GOAL_NOT_FOUND' };
        let updated = goal;
        if (input.step) updated = goalsRepo.setStepDone(goal.id, String(input.step), true) || updated;
        if (Number.isFinite(Number(input.progress))) updated = goalsRepo.update(goal.id, { progress: Number(input.progress) }) || updated;
        return {
          updated: true,
          goal: {
            title: updated.title,
            progress: updated.progress || 0,
            next_step: ((updated.plan || []).find((s) => !s.done) || {}).step || null,
          },
        };
      }

      case 'complete_goal': {
        const goal = goalsRepo.findByTitle(user.id, input.goal || '');
        if (!goal) return { error: 'GOAL_NOT_FOUND' };
        const updated = goalsRepo.update(goal.id, {
          status: input.dropped ? 'dropped' : 'done',
          progress: input.dropped ? goal.progress : 100,
        });
        return { done: true, dropped: !!input.dropped, goal: { title: updated.title, status: updated.status } };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    return { error: (err && err.message) || 'goal_operation_failed' };
  }
}

module.exports = { executeGoalTool };
