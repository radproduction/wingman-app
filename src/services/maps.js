'use strict';

const config = require('../config');
const usersRepo = require('../db/users');

/**
 * Google Maps Platform — Geocoding + Directions (with live traffic).
 *
 * Used to answer "how long is my commute right now?" and to work out when the
 * user needs to LEAVE to reach a meeting on time.
 */

function keyOrThrow() {
  const key = config.maps.apiKey;
  if (!key) throw new Error('MAPS_NOT_CONFIGURED');
  return key;
}

async function apiGet(path, params) {
  const url = new URL(`https://maps.googleapis.com/maps/api/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  url.searchParams.set('key', keyOrThrow());

  const res = await fetch(url);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Maps HTTP ${res.status}`);

  // Maps reports failures in the body, not the status code.
  const status = data.status;
  if (status === 'REQUEST_DENIED') throw new Error('MAPS_REQUEST_DENIED');
  if (status === 'OVER_QUERY_LIMIT') throw new Error('MAPS_QUOTA_EXCEEDED');
  if (status === 'ZERO_RESULTS' || status === 'NOT_FOUND') return { ...data, empty: true };
  if (status && status !== 'OK') throw new Error(`Maps: ${status}${data.error_message ? ` — ${data.error_message}` : ''}`);
  return data;
}

/** Turn a free-text address into coordinates + a tidy formatted address. */
async function geocode(address) {
  const data = await apiGet('geocode/json', { address });
  const hit = (data.results || [])[0];
  if (!hit) return null;
  const loc = hit.geometry && hit.geometry.location;
  return { address: hit.formatted_address, lat: loc.lat, lng: loc.lng };
}

function coordString(lat, lng) {
  return `${lat},${lng}`;
}

/** A saved place ("home" | "office" | "current") as an origin/destination string. */
function savedPlace(user, which) {
  if (which === 'home' && user.home_lat != null && user.home_lng != null) {
    return { label: 'home', query: coordString(user.home_lat, user.home_lng), address: user.home_address };
  }
  if (which === 'office' && user.office_lat != null && user.office_lng != null) {
    return { label: 'office', query: coordString(user.office_lat, user.office_lng), address: user.office_address };
  }
  // The user's current location — captured by the app (browser geolocation).
  // It's the LAST KNOWN position, not live, since a web app can't track in the
  // background; the caller decides how to phrase that.
  if (which === 'current' && user.current_lat != null && user.current_lng != null) {
    return {
      label: 'current',
      query: coordString(user.current_lat, user.current_lng),
      address: user.current_location_label || 'your current location',
      updatedAt: user.current_location_at || null,
    };
  }
  const raw = which === 'home' ? user.home_address : (which === 'office' ? user.office_address : null);
  return raw ? { label: which, query: raw, address: raw } : null;
}

/** Reverse-geocode coordinates into a short human label ("Clifton, Karachi"). */
async function reverseGeocode(lat, lng) {
  try {
    const data = await apiGet('geocode/json', { latlng: `${lat},${lng}` });
    const hit = (data.results || [])[0];
    if (!hit) return null;
    // Prefer a neighbourhood/locality over the full formatted address.
    const comp = hit.address_components || [];
    const pick = (type) => {
      const c = comp.find((x) => (x.types || []).includes(type));
      return c ? c.long_name : null;
    };
    const area = pick('sublocality') || pick('neighborhood') || pick('locality');
    const city = pick('locality') || pick('administrative_area_level_2');
    const label = [area, city && area !== city ? city : null].filter(Boolean).join(', ');
    return label || hit.formatted_address || null;
  } catch (_) {
    return null;
  }
}

/** Reverse-geocode to the FULL formatted address (for filling an address field). */
async function reverseGeocodeAddress(lat, lng) {
  try {
    const data = await apiGet('geocode/json', { latlng: `${lat},${lng}` });
    const hit = (data.results || [])[0];
    return hit ? hit.formatted_address : null;
  } catch (_) {
    return null;
  }
}

/** Store the user's current location (from the app), with a readable label. */
async function setCurrentLocation(userId, { lat, lng }) {
  const label = await reverseGeocode(lat, lng);
  usersRepo.update(userId, {
    current_lat: lat,
    current_lng: lng,
    current_location_at: new Date().toISOString(),
    current_location_label: label,
  });
  return { lat, lng, label };
}

function fmtMinutes(seconds) {
  return Math.max(1, Math.round((seconds || 0) / 60));
}

/**
 * Traffic-aware directions.
 *
 * @param {string} origin       address or "lat,lng"
 * @param {string} destination  address or "lat,lng"
 * @param {Date}   [departAt]   when they'd leave (defaults to now)
 */
async function directions(origin, destination, departAt = new Date()) {
  // Google wants departure_time in whole seconds; it must not be in the past.
  const departure = Math.max(Math.floor(departAt.getTime() / 1000), Math.floor(Date.now() / 1000));
  const data = await apiGet('directions/json', {
    origin,
    destination,
    mode: 'driving',
    departure_time: departure,
    traffic_model: 'best_guess',
    alternatives: 'true',
  });
  if (data.empty) return null;

  const routes = (data.routes || []).map((r) => {
    const leg = (r.legs || [])[0] || {};
    const withTraffic = leg.duration_in_traffic || leg.duration || {};
    return {
      summary: r.summary || '',
      distance: leg.distance ? leg.distance.text : null,
      minutes: fmtMinutes(withTraffic.value),
      minutesNoTraffic: leg.duration ? fmtMinutes(leg.duration.value) : null,
      startAddress: leg.start_address || null,
      endAddress: leg.end_address || null,
    };
  });
  if (!routes.length) return null;

  // Fastest route in current traffic wins.
  routes.sort((a, b) => a.minutes - b.minutes);
  const best = routes[0];
  const delay = best.minutesNoTraffic != null ? best.minutes - best.minutesNoTraffic : 0;
  return {
    best,
    alternatives: routes.slice(1, 3),
    trafficDelayMinutes: delay > 0 ? delay : 0,
    departAt: new Date(departure * 1000).toISOString(),
  };
}

/**
 * When must the user leave to arrive by `arriveBy`?
 * Uses traffic at the estimated departure time, then re-checks once with the
 * refined departure so the estimate accounts for traffic when they'd actually go.
 */
async function leaveBy(origin, destination, arriveBy) {
  const arrive = arriveBy instanceof Date ? arriveBy : new Date(arriveBy);
  let guess = await directions(origin, destination, new Date());
  if (!guess) return null;

  let departure = new Date(arrive.getTime() - guess.best.minutes * 60000);
  if (departure.getTime() > Date.now()) {
    const refined = await directions(origin, destination, departure);
    if (refined) {
      guess = refined;
      departure = new Date(arrive.getTime() - refined.best.minutes * 60000);
    }
  }
  return {
    leaveAt: departure.toISOString(),
    arriveBy: arrive.toISOString(),
    minutes: guess.best.minutes,
    distance: guess.best.distance,
    route: guess.best.summary,
    trafficDelayMinutes: guess.trafficDelayMinutes,
    alreadyLate: departure.getTime() < Date.now(),
  };
}

/** Geocode an address and persist it as the user's home or office. */
async function savePlace(userId, which, address) {
  // Geocoding is an ENHANCEMENT (coordinates for precise traffic/leave-by), not
  // a gatekeeper. The address is text the user typed — losing it because the
  // Maps key is down or a place is slightly non-standard is the wrong trade.
  // So we always store the text, and add coordinates when geocoding succeeds.
  let geo = null;
  try { geo = await geocode(address); }
  catch (err) {
    // A dead/denied key must not block saving; it only means no coordinates.
    if (err.message !== 'MAPS_REQUEST_DENIED' && err.message !== 'MAPS_NOT_CONFIGURED') throw err;
    console.warn('[maps] geocode unavailable, saving address text only:', err.message);
  }

  const finalAddress = (geo && geo.address) || address;
  const patch = which === 'home'
    ? { home_address: finalAddress, home_lat: geo ? geo.lat : null, home_lng: geo ? geo.lng : null }
    : { office_address: finalAddress, office_lat: geo ? geo.lat : null, office_lng: geo ? geo.lng : null };
  usersRepo.update(userId, patch);

  return { address: finalAddress, lat: geo ? geo.lat : null, lng: geo ? geo.lng : null, geocoded: !!geo };
}

/** Has the user told us where home / office are? */
function missingPlaces(user) {
  const missing = [];
  if (!user.home_address) missing.push('home');
  if (!user.office_address) missing.push('office');
  return missing;
}

module.exports = {
  geocode, reverseGeocode, reverseGeocodeAddress, directions, leaveBy, savePlace, savedPlace,
  setCurrentLocation, missingPlaces, fmtMinutes,
};
