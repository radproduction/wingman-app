'use strict';

/**
 * NOW HRMS read snapshot (Phase 2).
 *
 * Pulls one employee's current state from NOW HRMS — clock status, hours,
 * open tasks, projects, leaves — so Wingman can answer questions ("aaj ke
 * tasks?", "kitni chhutti bachi?") and fold it into daily briefings.
 *
 * The employee is identified by the company email they linked on the Work clock
 * screen (work_employee_ref), which is exactly what NOW HRMS routes on. A short
 * per-user cache keeps repeated briefing/question reads off the network.
 */

const config = require('../config');

const CACHE_MS = 2 * 60 * 1000; // 2 min — fresh enough, and spares the HRMS
const cache = new Map(); // userId → { at, data }

/** Is this user connected to NOW HRMS (one-tap connector)? */
function connected(user) {
  return !!(
    user &&
    config.nowhrms.enabled &&
    user.work_action_url &&
    user.work_action_url === config.nowhrms.clockUrl &&
    user.work_employee_ref
  );
}

/** Raw fetch from NOW HRMS. Returns the snapshot object, or null on any problem. */
async function fetchData(user) {
  if (!connected(user)) return null;
  const url = `${config.nowhrms.dataUrl}?employee=${encodeURIComponent(user.work_employee_ref)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'X-Wingman-Secret': config.nowhrms.sharedSecret },
      signal: controller.signal,
    });
    if (!res.ok) {
      console.warn(`[nowHrmsData] ${res.status} for ${user.work_employee_ref}`);
      return null;
    }
    const body = await res.json();
    return body && body.ok ? body : null;
  } catch (e) {
    console.warn('[nowHrmsData] fetch failed:', e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Cached snapshot for a user. Returns null if not connected or unreachable. */
async function getData(user, { maxAgeMs = CACHE_MS, force = false } = {}) {
  if (!connected(user)) return null;
  const hit = cache.get(user.id);
  if (!force && hit && Date.now() - hit.at < maxAgeMs) return hit.data;
  const data = await fetchData(user);
  if (data) cache.set(user.id, { at: Date.now(), data });
  return data || (hit ? hit.data : null); // fall back to a slightly stale copy
}

function clearCache(userId) {
  if (userId) cache.delete(userId);
  else cache.clear();
}

/**
 * Split a snapshot's open tasks into overdue / due-today / upcoming by their due
 * date (Phase 4a). Date-only comparison — good enough for a "what's late" read.
 */
function taskDigest(data, now = new Date()) {
  const items = (data && data.tasks && data.tasks.items) || [];
  const todayKey = now.toISOString().slice(0, 10);
  const overdue = [];
  const dueToday = [];
  const upcoming = [];
  for (const task of items) {
    if (!task.due) { upcoming.push(task); continue; }
    const dueKey = String(task.due).slice(0, 10);
    if (dueKey < todayKey) overdue.push(task);
    else if (dueKey === todayKey) dueToday.push(task);
    else upcoming.push(task);
  }
  return { overdue, dueToday, upcoming };
}

// ── Manager team snapshot (Phase 4b) ──
const teamCache = new Map(); // userId → { at, data }

/**
 * Team status for a MANAGER (who's in/out/on break/on leave). Returns:
 *   the snapshot body on success,
 *   { forbidden: true } if the user isn't a manager (NOW HRMS says 403),
 *   null if not connected or unreachable.
 */
async function getTeamSnapshot(user, { maxAgeMs = 60000, force = false } = {}) {
  if (!connected(user)) return null;
  const hit = teamCache.get(user.id);
  if (!force && hit && Date.now() - hit.at < maxAgeMs) return hit.data;

  const url = `${config.nowhrms.teamUrl}?employee=${encodeURIComponent(user.work_employee_ref)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: { 'X-Wingman-Secret': config.nowhrms.sharedSecret },
      signal: controller.signal,
    });
    if (res.status === 403) return { forbidden: true };
    if (!res.ok) return null;
    const body = await res.json();
    if (body && body.ok) { teamCache.set(user.id, { at: Date.now(), data: body }); return body; }
    return null;
  } catch (e) {
    console.warn('[nowHrmsData] team fetch failed:', e.message);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * One short line for the daily briefing / wrap, or null when there's nothing
 * worth saying. Kept terse — the briefing stitches many of these together.
 * Leads with overdue / due-today tasks (Phase 4a) since those are what matter.
 */
async function briefingLine(user) {
  const d = await getData(user);
  if (!d) return null;

  const bits = [];
  if (d.clock && !d.clock.clocked_in) bits.push('not clocked in yet');
  const dg = taskDigest(d);
  if (dg.overdue.length) bits.push(`${dg.overdue.length} task${dg.overdue.length === 1 ? '' : 's'} overdue`);
  if (dg.dueToday.length) bits.push(`${dg.dueToday.length} due today`);
  const openTasks = d.tasks && d.tasks.open ? d.tasks.open : 0;
  if (!dg.overdue.length && !dg.dueToday.length && openTasks) {
    bits.push(`${openTasks} open task${openTasks === 1 ? '' : 's'}`);
  }
  if (d.leaves && d.leaves.pending) bits.push(`${d.leaves.pending} leave${d.leaves.pending === 1 ? '' : 's'} pending`);
  if (!bits.length) return null;
  return `🏢 NOW HRMS: ${bits.join(' · ')}.`;
}

module.exports = { connected, fetchData, getData, clearCache, taskDigest, getTeamSnapshot, briefingLine };
