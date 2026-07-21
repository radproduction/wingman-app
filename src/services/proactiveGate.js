'use strict';

/**
 * Central gating for all proactive (Wingman-initiated) features.
 *
 * Two dimensions decide whether a scheduled job fires for a given user:
 *
 *   1. proactiveness_level
 *        - 'low'      → Wingman never reaches out proactively; it only
 *                       responds when messaged. ALL scheduled jobs skipped.
 *        - 'moderate' → daily briefing + urgent alerts only
 *                       (morning briefing, end-of-day wrap, bill alerts).
 *        - 'high'     → every proactive feature (default).
 *
 *   2. enabled_skills (per-user toggles)
 *        - travel_assistant, bill_tracker, delivery_tracker,
 *          people_crm, followup_tracker
 *
 * A job is mapped to (a) the minimum proactiveness level it needs and
 * (b) an optional required skill. Jobs with no required skill are considered
 * "core" and only gated by proactiveness.
 */

const usersRepo = require('../db/users');

// job → { minLevel, skill? }
const JOB_RULES = {
  morning:      { minLevel: 'moderate' },
  wrap:         { minLevel: 'moderate' },
  meetingprep:  { minLevel: 'moderate' },
  meetingcomplete: { minLevel: 'moderate' },
  health:       { minLevel: 'moderate' },
  work:         { minLevel: 'moderate' },
  webmail:      { minLevel: 'moderate' },
  // The cross-domain "chief of staff" nudge — the most proactive thing Wingman
  // does, so only for users who've asked for that level of initiative.
  brain:        { minLevel: 'high' },
  taskreminder: { minLevel: 'high' },
  taskdue:      { minLevel: 'moderate' },
  bills:        { minLevel: 'moderate', skill: 'bill_tracker' },
  deliveries:   { minLevel: 'high', skill: 'delivery_tracker' },
  followups:    { minLevel: 'high', skill: 'followup_tracker' },
  travel:       { minLevel: 'high', skill: 'travel_assistant' },
};

const LEVEL_RANK = { low: 0, moderate: 1, high: 2 };

function levelRank(level) {
  return LEVEL_RANK[(level || 'high').toLowerCase()] ?? LEVEL_RANK.high;
}

/**
 * Should a given proactive `job` fire for `user`?
 * Unonboarded users never receive proactive messages.
 */
function allows(user, job) {
  if (!user) return false;
  if (!usersRepo.isOnboarded(user)) return false;

  const rule = JOB_RULES[job];
  if (!rule) return true; // unknown job → don't block

  // Proactiveness level check.
  if (levelRank(user.proactiveness_level) < levelRank(rule.minLevel)) return false;

  // Skill toggle check.
  if (rule.skill && !usersRepo.hasSkill(user, rule.skill)) return false;

  return true;
}

/**
 * Filter a list of users down to those eligible for `job`.
 */
function eligibleUsers(job, { users } = {}) {
  const list = users || usersRepo.listOnboarded();
  return list.filter((u) => allows(u, job));
}

module.exports = { allows, eligibleUsers, JOB_RULES };
