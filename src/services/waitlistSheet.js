'use strict';

const config = require('../config');

/**
 * Mirror every waitlist signup into a live Google Sheet.
 *
 * The boss wants a Google Sheet that fills itself as leads come in — email, IP
 * and country, appearing the moment someone signs up. Rather than a Google
 * service account + API key on our side (extra secrets to store and rotate), we
 * POST each row to a Google Apps Script "Web App" that is bound to the sheet and
 * simply appends/updates a row. Our side needs only the deployed Web App URL
 * (WAITLIST_SHEET_WEBHOOK_URL) and an optional shared secret the script checks.
 *
 * The Apps Script upserts BY EMAIL, so:
 *   - pushing the same signup twice (once on signup, once when its country
 *     resolves a few seconds later) updates the one row instead of duplicating;
 *   - the one-time backfill of existing rows is safe to re-run.
 *
 * Everything here is best-effort and never throws to the caller: a signup must
 * succeed (DB + team email) even if the sheet is misconfigured or unreachable.
 */

const TIMEOUT_MS = 10000;

function enabled() {
  return config.waitlist.sheetEnabled;
}

// Normalise a DB/handler row to exactly the fields the sheet cares about.
function shape(row) {
  return {
    email: row.email || '',
    ip: row.ip || '',
    country: row.country || '',
    created_at: row.created_at || new Date().toISOString(),
  };
}

/**
 * Send one or more rows to the sheet. Resolves { ok, count } on success or
 * { ok: false, error } on any failure — it never rejects, so callers can
 * fire-and-forget without a .catch().
 */
async function pushRows(rows) {
  const list = (Array.isArray(rows) ? rows : [rows]).filter((r) => r && r.email).map(shape);
  if (!enabled() || list.length === 0) return { ok: false, error: 'disabled_or_empty' };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(config.waitlist.sheetWebhookUrl, {
      method: 'POST',
      // Apps Script Web Apps accept text/plain without a CORS preflight; the body
      // is still JSON we parse on the other side.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ secret: config.waitlist.sheetSecret || undefined, rows: list }),
      signal: controller.signal,
      redirect: 'follow', // Apps Script 302-redirects to script.googleusercontent.com
    });
    clearTimeout(timer);
    if (!res.ok) return { ok: false, error: `http_${res.status}` };
    return { ok: true, count: list.length };
  } catch (err) {
    clearTimeout(timer);
    return { ok: false, error: err && err.name === 'AbortError' ? 'timeout' : (err.message || 'unreachable') };
  }
}

/** Convenience for the single-signup path. */
function pushRow(row) {
  return pushRows([row]);
}

/**
 * One-time (or repeatable) backfill: push EVERY stored waitlist row into the
 * sheet. Safe to run more than once — the Apps Script upserts by email.
 * Returns { ok, total, sent, error? }.
 */
async function syncAllFromDb() {
  if (!enabled()) return { ok: false, error: 'disabled', total: 0, sent: 0 };
  let rows = [];
  try {
    const { db } = require('../db');
    rows = db.prepare('SELECT email, ip, country, created_at FROM waitlist ORDER BY created_at ASC').all();
  } catch (e) {
    return { ok: false, error: `db_${e.message}`, total: 0, sent: 0 };
  }
  if (rows.length === 0) return { ok: true, total: 0, sent: 0 };
  const r = await pushRows(rows);
  return { ok: r.ok, total: rows.length, sent: r.ok ? rows.length : 0, error: r.error };
}

module.exports = { enabled, pushRow, pushRows, syncAllFromDb };
