'use strict';

const usersRepo = require('../db/users');
const deliveriesRepo = require('../db/deliveries');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

function prettyStatus(s) {
  return (s || 'in_transit').replace(/_/g, ' ');
}

/**
 * Send a status-change alert for a single delivery (called by the scanner
 * when a delivery's status transitions).
 *   "📦 Update: Your [item] from [store] — [new status]. ETA: [date]"
 */
async function sendStatusAlert(user, delivery) {
  const eta = delivery.estimated_delivery ? ` ETA: ${delivery.estimated_delivery}` : '';
  const from = delivery.merchant ? ` from ${delivery.merchant}` : '';
  const text = `\ud83d\udce6 Update: Your ${delivery.item_name || 'order'}${from} \u2014 ${prettyStatus(delivery.status)}.${eta}`;
  try {
    if (wa().ready()) { await wa().sendMessage(user.phone, text); return true; }
    console.log('[deliveryAlerts] (WA not ready):', text);
  } catch (err) { console.warn('[deliveryAlerts] send failed:', err.message); }
  return false;
}

/**
 * Daily check: alert when a return window closes within 3 days.
 */
async function returnWindowCheck(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { alerts: [] };
  const tz = user.timezone || 'Asia/Karachi';
  const todayStart = t.startOfDayISO(tz, 0, now);
  const offset = todayStart.slice(-6);

  const alerts = [];
  for (const d of deliveriesRepo.listForUser(user.id)) {
    if (!d.return_window_ends) continue;
    const endISO = `${d.return_window_ends}T00:00:00${offset}`;
    const days = t.daysBetween(todayStart, endISO);
    if (days >= 0 && days <= 3) {
      alerts.push(`\u21a9\ufe0f Your return window for ${d.item_name || 'your order'} closes in ${days} day${days === 1 ? '' : 's'}.`);
    }
  }

  if (send && alerts.length) {
    try {
      if (wa().ready()) for (const a of alerts) await wa().sendMessage(user.phone, a);
    } catch (err) { console.warn('[deliveryAlerts] return alert failed:', err.message); }
  }
  return { alerts };
}

async function runDueUsers({ hour = 9, now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'deliveries')) continue;
    const tz = u.timezone || 'Asia/Karachi';
    if (t.hourInTz(tz, now) === hour) {
      results.push({ phone: u.phone, ...(await returnWindowCheck(u.id, { now })) });
    }
  }
  return results;
}

// ── Conversational helpers ───────────────────────────────────────────

function isDeliveryQuery(text) {
  const s = (text || '').toLowerCase();
  return /\b(where('?s| is)?\s+my\s+(order|package|delivery|parcel))\b/.test(s) ||
         /\b(any\s+deliveries|my\s+deliveries|track(ing)?\s+my|order status)\b/.test(s);
}

function buildDeliveriesReply(user) {
  const active = deliveriesRepo.listActive(user.id);
  if (!active.length) return 'No active deliveries right now. \ud83d\udce6';
  const lines = ['\ud83d\udce6 *Deliveries:*'];
  for (const d of active) {
    const parts = [d.item_name || 'Order'];
    if (d.merchant) parts.push(`from ${d.merchant}`);
    let line = `\u2022 ${parts.join(' ')} \u2014 ${prettyStatus(d.status)}`;
    if (d.carrier) line += ` via ${d.carrier}`;
    if (d.estimated_delivery) line += `, ETA ${d.estimated_delivery}`;
    lines.push(line);
  }
  return lines.join('\n');
}

module.exports = {
  sendStatusAlert, returnWindowCheck, runDueUsers,
  isDeliveryQuery, buildDeliveriesReply,
};
