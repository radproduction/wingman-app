'use strict';

const automationsRepo = require('../db/automations');
const usersRepo = require('../db/users');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

/**
 * Fires standing instructions at their time and lets the AI carry them out.
 *
 * The scheduler ticks every 15 minutes; each automation runs at most once per
 * local day (deduped on last_run_date), and 'once' automations deactivate after
 * they fire.
 */

/** Local day of week (0=Sun) for an instant in a timezone. */
function localWeekday(timeZone, now) {
  const label = new Intl.DateTimeFormat('en-US', { timeZone, weekday: 'short' }).format(now);
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(label);
}

/** Is this automation due to fire right now? */
function isDue(a, now, windowMin = 15) {
  const tz = a.timezone || 'Asia/Karachi';
  const dayKey = t.dateKeyInTz(tz, now);
  if (a.last_run_date === dayKey) return false;          // already ran today
  if (!t.isDueAt(tz, a.time, now, windowMin)) return false;

  switch (a.kind) {
    case 'daily': return true;
    case 'weekdays': { const d = localWeekday(tz, now); return d >= 1 && d <= 5; }
    case 'weekly': return localWeekday(tz, now) === Number(a.weekday);
    case 'once': return a.run_date === dayKey;
    default: return false;
  }
}

/** Fire one automation: run it through the AI and send the result. */
async function fire(a, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(a.user_id);
  if (!user) { automationsRepo.deactivate(a.id); return { sent: null, skipped: 'no_user' }; }
  if (!usersRepo.isOnboarded(user)) return { sent: null, skipped: 'not_onboarded' };

  const tz = a.timezone || user.timezone || 'Asia/Karachi';
  const dayKey = t.dateKeyInTz(tz, now);

  // Mark BEFORE running so a slow/failed run can't double-fire on the next tick.
  automationsRepo.markRun(a.id, dayKey);
  if (a.kind === 'once') automationsRepo.deactivate(a.id);

  let message = null;
  try {
    message = await require('../engine/conversation').runAutomatedInstruction(user, a.instruction);
  } catch (err) {
    console.warn('[automations] execution failed for', a.id, err.message);
    return { sent: null, skipped: 'exec_error' };
  }
  if (!message) return { sent: null, skipped: 'nothing_to_send' };

  if (send && wa().ready()) {
    try { await wa().sendProactiveMessage(user, message, { now, logLabel: 'automation' }); }
    catch (err) { console.warn('[automations] send failed:', err.message); }
  } else if (send) {
    console.log('[automations] (WA not ready) would send to', user.phone);
  }
  return { sent: message };
}

/** Minutes-past-midnight → "HH:MM" (24h, wraps within a day). */
function minutesToHHMM(mins) {
  const m = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/**
 * Keep behaviour-anchored automations in sync with what they track. Right now the
 * only anchor is 'usual_finish' — the time is recomputed as (learned finish −
 * lead_minutes) so a "traffic update before I usually leave" reminder self-adjusts
 * as the user's real finishing time drifts, with no need to re-ask.
 *
 * Deliberately conservative and safe to run every tick:
 *   - fixed-time automations (anchor null) are NEVER touched;
 *   - if there isn't enough clock data yet, the current time is left as-is;
 *   - it only writes when the time actually changed.
 */
async function retuneAnchored({ now = new Date() } = {}) {
  const sessions = require('../db/workSessions');
  const anchored = automationsRepo.listAnchored();
  let changed = 0;
  for (const a of anchored) {
    try {
      if (a.anchor !== 'usual_finish') continue;
      const user = usersRepo.getById(a.user_id);
      if (!user) continue;
      const tz = a.timezone || user.timezone || 'Asia/Karachi';
      const weekday = a.kind === 'weekly' && a.weekday != null ? Number(a.weekday) : null;
      const end = sessions.typicalEndMinutes(a.user_id, { timezone: tz, weekday });
      if (end == null) continue;                       // not enough data — leave as-is
      const lead = a.lead_minutes == null ? 20 : Number(a.lead_minutes);
      const target = minutesToHHMM(end - lead);
      if (target !== a.time) {
        automationsRepo.updateTime(a.id, target);
        changed++;
        console.log(`[automations] retuned ${a.id}: ${a.time} → ${target} (usual finish ${minutesToHHMM(end)} − ${lead}m)`);
      }
    } catch (err) {
      console.warn('[automations] retune failed for', a.id, err.message);
    }
  }
  if (changed) console.log('[automations] retuned', changed, 'anchored automation(s)');
  return { changed };
}

/** Sweep all active automations and fire those that are due. */
async function runDueUsers({ now = new Date(), windowMin = 15, send = true } = {}) {
  const all = automationsRepo.listAllActive();
  const results = [];
  for (const a of all) {
    try {
      if (!isDue(a, now, windowMin)) continue;
      const r = await fire(a, { now, send });
      if (r.sent) results.push({ id: a.id, userId: a.user_id });
    } catch (err) {
      console.warn('[automations] failed for', a.id, err.message);
    }
  }
  if (results.length) console.log('[automations] fired', results.length);
  return results;
}

module.exports = { isDue, fire, runDueUsers, retuneAnchored, localWeekday };
