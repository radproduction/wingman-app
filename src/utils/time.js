'use strict';

/**
 * Timezone-aware helpers built on Intl (no external deps).
 * A user's timezone is an IANA name like 'Asia/Dubai'.
 */

/** Get the current wall-clock parts in a timezone. */
function partsInTz(date, timeZone) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
  const parts = {};
  for (const p of fmt.formatToParts(date)) {
    if (p.type !== 'literal') parts[p.type] = p.value;
  }
  // Intl may return hour '24' at midnight in some environments
  if (parts.hour === '24') parts.hour = '00';
  return parts;
}

/** Compute the timezone offset (in minutes) for a given instant + zone. */
function tzOffsetMinutes(date, timeZone) {
  const p = partsInTz(date, timeZone);
  const asUTC = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour), Number(p.minute), Number(p.second)
  );
  return Math.round((asUTC - date.getTime()) / 60000);
}

/** Format an offset in minutes as "+04:00". */
function offsetString(offsetMin) {
  const rounded = Math.round(offsetMin);
  const sign = rounded >= 0 ? '+' : '-';
  const abs = Math.abs(rounded);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${sign}${hh}:${mm}`;
}

/**
 * ISO string for the start of "today" (local midnight) in a timezone,
 * expressed with the correct offset, e.g. 2026-07-02T00:00:00+04:00.
 * `dayOffset` shifts by whole days (0=today, 1=tomorrow, -1=yesterday).
 */
function startOfDayISO(timeZone, dayOffset = 0, now = new Date()) {
  const p = partsInTz(now, timeZone);
  const off = tzOffsetMinutes(now, timeZone);
  // Build a UTC instant for local midnight, then shift by dayOffset days
  let utcMidnight = Date.UTC(Number(p.year), Number(p.month) - 1, Number(p.day), 0, 0, 0) - off * 60000;
  utcMidnight += dayOffset * 24 * 3600 * 1000;
  const d = new Date(utcMidnight);
  // Recompute offset at that instant (handles DST) for the label
  const off2 = tzOffsetMinutes(d, timeZone);
  const local = new Date(d.getTime() + off2 * 60000);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, '0');
  const day = String(local.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}T00:00:00${offsetString(off2)}`;
}

/** Current hour (0-23) in a timezone. */
function hourInTz(timeZone, now = new Date()) {
  return Number(partsInTz(now, timeZone).hour);
}

/** Human day label e.g. "Thu, 2 July". */
function dayLabel(isoOrDate, timeZone) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone, weekday: 'short', day: 'numeric', month: 'long',
  }).format(d);
}

/** "HH:MM" in a timezone for a given instant. */
function timeLabel(isoOrDate, timeZone) {
  const d = typeof isoOrDate === 'string' ? new Date(isoOrDate) : isoOrDate;
  return new Intl.DateTimeFormat('en-GB', {
    timeZone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(d);
}

/** Whole-day difference between two ISO dates (b - a), rounded. */
function daysBetween(aISO, bISO) {
  const a = new Date(aISO).getTime();
  const b = new Date(bISO).getTime();
  return Math.round((b - a) / (24 * 3600 * 1000));
}

module.exports = {
  partsInTz, tzOffsetMinutes, offsetString,
  startOfDayISO, hourInTz, dayLabel, timeLabel, daysBetween,
};
