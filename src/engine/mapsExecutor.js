'use strict';

const maps = require('../services/maps');
const config = require('../config');
const usersRepo = require('../db/users');

/** Resolve "home"/"office" to a saved place, otherwise treat the text as an address. */
function resolvePlace(user, value) {
  const v = String(value || '').trim();
  const key = v.toLowerCase();
  if (key === 'home' || key === 'office') {
    const place = maps.savedPlace(user, key);
    if (!place) return { error: 'PLACE_NOT_SET', which: key };
    return { query: place.query, label: key, address: place.address };
  }
  return v ? { query: v, label: v, address: v } : { error: 'MISSING_PLACE' };
}

/** Execute a maps tool. Never throws — errors become {error}. */
async function executeMapsTool(user, toolUse) {
  if (!config.maps.enabled) {
    return { error: 'MAPS_NOT_CONFIGURED', detail: 'No Google Maps API key is set on the server yet.' };
  }

  const { name, input } = toolUse;
  try {
    switch (name) {
      case 'save_place': {
        const geo = await maps.savePlace(user.id, input.which, input.address);
        if (!geo) return { error: 'ADDRESS_NOT_FOUND', detail: `Could not find "${input.address}" on the map.` };
        return { saved: true, which: input.which, address: geo.address };
      }

      case 'get_travel_time': {
        const from = resolvePlace(user, input.from);
        const to = resolvePlace(user, input.to);
        if (from.error) return from;
        if (to.error) return to;

        const departAt = input.depart_at ? new Date(input.depart_at) : new Date();
        const r = await maps.directions(from.query, to.query, departAt);
        if (!r) return { error: 'NO_ROUTE', detail: 'No driving route found between those places.' };
        return {
          from: from.address || from.label,
          to: to.address || to.label,
          minutes: r.best.minutes,
          distance: r.best.distance,
          route: r.best.summary,
          traffic_delay_minutes: r.trafficDelayMinutes,
          alternatives: r.alternatives.map((a) => ({ route: a.summary, minutes: a.minutes })),
        };
      }

      case 'get_leave_time': {
        const from = resolvePlace(user, input.from || 'home');
        const to = resolvePlace(user, input.to);
        if (from.error) return from;
        if (to.error) return to;

        const r = await maps.leaveBy(from.query, to.query, input.arrive_by);
        if (!r) return { error: 'NO_ROUTE', detail: 'No driving route found between those places.' };
        return {
          from: from.address || from.label,
          to: to.address || to.label,
          leave_at: r.leaveAt,
          arrive_by: r.arriveBy,
          minutes: r.minutes,
          distance: r.distance,
          route: r.route,
          traffic_delay_minutes: r.trafficDelayMinutes,
          already_late: r.alreadyLate,
        };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = (err && err.message) || 'maps_operation_failed';
    if (msg === 'MAPS_NOT_CONFIGURED') return { error: 'MAPS_NOT_CONFIGURED' };
    if (msg === 'MAPS_REQUEST_DENIED') {
      return { error: 'MAPS_REQUEST_DENIED', detail: 'The Maps API key was rejected — it may be restricted or the Directions/Geocoding APIs are not enabled.' };
    }
    if (msg === 'MAPS_QUOTA_EXCEEDED') return { error: 'MAPS_QUOTA_EXCEEDED' };
    return { error: msg };
  }
}

/** Which of home/office the user still hasn't set (used to prompt them). */
function missingPlacesFor(userId) {
  const user = usersRepo.getById(userId);
  return user ? maps.missingPlaces(user) : [];
}

module.exports = { executeMapsTool, missingPlacesFor };
