'use strict';

/**
 * Dashboard JSON API for the Wingman mobile PWA.
 *
 * Every endpoint tries to read live data for the resolved user from SQLite;
 * if the user has no rows yet (e.g. Google not connected), it falls back to a
 * rich mock dataset so every page looks fully populated for demos/screenshots.
 *
 * User resolution: ?userId=... or the first user in the DB, else the demo user.
 */

const express = require('express');
const router = express.Router();

const mock = require('./mockData');
const usersRepo = require('../db/users');
const config = require('../config');

// ── helpers ──────────────────────────────────────────────────────────
function resolveUser(req) {
  // 1) Authenticated user (attached by the auth middleware) always wins.
  if (req.user) return req.user;
  // 2) Explicit ?userId= (used by internal/debug tooling).
  const { userId } = req.query;
  if (userId) {
    const u = usersRepo.getById(userId);
    if (u) return u;
  }
  // 3) No authenticated user → null. We intentionally do NOT fall back to the
  //    first user (that would leak one user's data to anonymous requests).
  //    Unauthenticated requests get the mock dataset instead.
  return null;
}

/**
 * Resolve a repo read to { data, mock }.
 * `allowMock` is true only for UNauthenticated requests — a real logged-in user
 * always sees their own live data (empty arrays included), never dummy data.
 */
function safe(fn, fallback, allowMock) {
  try {
    const v = fn();
    if (v == null) return allowMock ? { data: fallback, mock: true } : { data: Array.isArray(fallback) ? [] : null, mock: false };
    if (Array.isArray(v) && v.length === 0) return allowMock ? { data: fallback, mock: true } : { data: [], mock: false };
    return { data: v, mock: false };
  } catch (_) {
    return allowMock ? { data: fallback, mock: true } : { data: Array.isArray(fallback) ? [] : null, mock: false };
  }
}

function requireRepo(name) {
  try { return require(`../db/${name}`); } catch (_) { return null; }
}

// ── /api/me ──────────────────────────────────────────────────────────
router.get('/me', (req, res) => {
  const u = resolveUser(req);
  if (!u) return res.json({ ...mock.user, wingman_number: config.wingmanNumber || null, whatsapp_connected: false, mock: true });
  // "Connected" = the user has actually exchanged a message with Wingman on
  // WhatsApp (so the card reassures them the link is live).
  const convo = requireRepo('conversations');
  const whatsappConnected = !!(convo && convo.historyForUser(u.id, 1).length);
  res.json({
    id: u.id,
    phone: u.phone,
    name: u.name || null,
    timezone: u.timezone || 'Asia/Karachi',
    work_hours_start: u.work_hours_start,
    work_hours_end: u.work_hours_end,
    language: u.language,
    onboarding_complete: !!u.onboarding_complete,
    briefing_time: u.briefing_time,
    debrief_time: u.debrief_time,
    proactiveness_level: u.proactiveness_level,
    enabled_skills: u.enabled_skills,
    tone: u.tone,
    communication_style: u.communication_style,
    health_connected: !!u.health_connected,
    gmail_connected: !!u.gmail_token,
    calendar_connected: !!u.calendar_token,
    wingman_number: config.wingmanNumber || null,
    whatsapp_connected: whatsappConnected,
    mock: false,
  });
});

// ── /api/calendar?range=today|tomorrow|week ─────────────────────────
router.get('/calendar', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('calendarEvents');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.calendar, !u);
  const norm = data.map((e) => ({
    id: e.id,
    title: e.title,
    location: e.location || null,
    start_time: e.start_time,
    end_time: e.end_time,
    attendees: Array.isArray(e.attendees) ? e.attendees
      : (typeof e.attendees === 'string' ? safeParse(e.attendees, []) : []),
    status: e.status || 'confirmed',
    has_conflict: !!e.has_conflict,
  }));
  res.json({ events: norm, mock: isMock });
});

// ── /api/emails ─────────────────────────────────────────────────────
router.get('/emails', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('emailItems');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id, 100);
  }, mock.emails, !u);
  const norm = data.map((e) => ({
    id: e.id,
    sender: e.sender,
    subject: e.subject,
    category: e.category || 'fyi',
    summary: e.summary,
    action_needed: !!e.action_needed,
    replied: !!e.replied,
    detected_type: e.detected_type || 'general',
    draft_reply: e.draft_reply || null,
    created_at: e.created_at,
  }));
  res.json({ emails: norm, mock: isMock });
});

// ── /api/tasks ──────────────────────────────────────────────────────
router.get('/tasks', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('tasks');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id, { includeCompleted: true, limit: 200 });
  }, mock.tasks, !u);
  const norm = data.map((t) => ({
    id: t.id,
    title: t.title,
    source: t.source || 'manual',
    priority: t.priority != null ? t.priority : 3,
    due_date: t.due_date || null,
    completed: !!t.completed,
    recurring: t.recurring || null,
  }));
  res.json({ tasks: norm, mock: isMock });
});

// ── /api/bills ──────────────────────────────────────────────────────
router.get('/bills', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('bills');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.bills, !u);
  const norm = data.map((b) => ({
    id: b.id, name: b.name, amount: b.amount, currency: b.currency || 'PKR',
    due_date: b.due_date, status: b.status || 'pending', recurring: !!b.recurring,
  }));
  res.json({ bills: norm, mock: isMock });
});

// ── /api/deliveries ─────────────────────────────────────────────────
router.get('/deliveries', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('deliveries');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.deliveries, !u);
  const norm = data.map((d) => ({
    id: d.id, item_name: d.item_name, merchant: d.merchant, carrier: d.carrier,
    tracking_number: d.tracking_number, status: d.status || 'in_transit',
    estimated_delivery: d.estimated_delivery || null, delivered_at: d.delivered_at || null,
    return_window_ends: d.return_window_ends || null,
  }));
  res.json({ deliveries: norm, mock: isMock });
});

// ── /api/travel ─────────────────────────────────────────────────────
router.get('/travel', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('travel');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.travel, !u);
  const norm = data.map((t) => ({
    id: t.id, trip_name: t.trip_name, type: t.type, provider: t.provider,
    confirmation_code: t.confirmation_code, origin: t.origin, destination: t.destination,
    depart_time: t.depart_time, arrive_time: t.arrive_time, return_time: t.return_time || null,
    status: t.status || 'confirmed', price: t.price, currency: t.currency || 'PKR',
    hotel_name: t.hotel_name || null, hotel_checkin: t.hotel_checkin || null, hotel_checkout: t.hotel_checkout || null,
  }));
  res.json({ trips: norm, mock: isMock });
});

// ── /api/health ─────────────────────────────────────────────────────
router.get(['/health-data', '/health'], (req, res) => {
  const u = resolveUser(req);
  // Live health ingestion is a later sprint. Logged-in users see an empty
  // (not connected) state; only unauthenticated demo requests see the sample.
  if (!u) return res.json({ health: mock.health, mock: true });
  res.json({ health: { sleep_hours: null, hrv: null, steps: null }, mock: false });
});

// ── /api/contacts ───────────────────────────────────────────────────
router.get('/contacts', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('contacts');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.contacts, !u);
  const norm = data.map((c) => ({
    id: c.id, name: c.name, email: c.email, company: c.company || null,
    relationship: c.relationship || null, interaction_count: c.interaction_count || 0,
    strength: c.strength || 'occasional', last_contacted_at: c.last_contacted_at || null,
    notes: c.notes || c.last_summary || null,
  }));
  res.json({ contacts: norm, mock: isMock });
});

// ── /api/followups ──────────────────────────────────────────────────
router.get('/followups', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('followups');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.followups, !u);
  res.json({ followups: data, mock: isMock });
});

// ── /api/briefings ──────────────────────────────────────────────────
router.get('/briefings', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('briefings');
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    return repo.listForUser(u.id);
  }, mock.briefings, !u);
  res.json({ briefings: data, mock: isMock });
});

// ── /api/dashboard (aggregate for Home) ─────────────────────────────
router.get('/dashboard', (req, res) => {
  const u = resolveUser(req);

  function pull(name, key, fallback) {
    const repo = requireRepo(name);
    const { data } = safe(() => {
      if (!u || !repo || !repo.listForUser) return null;
      const args = name === 'emailItems' ? [u.id, 100] : [u.id];
      return repo.listForUser(...args);
    }, fallback, !u);
    return data;
  }

  const calendar = pull('calendarEvents', 'events', mock.calendar);
  const emails = pull('emailItems', 'emails', mock.emails);
  const tasks = pull('tasks', 'tasks', mock.tasks);
  const bills = pull('bills', 'bills', mock.bills);
  const deliveries = pull('deliveries', 'deliveries', mock.deliveries);
  const travel = pull('travel', 'trips', mock.travel);

  const now = Date.now();
  const isToday = (d) => {
    if (!d) return false;
    const dt = new Date(d);
    const n = new Date();
    return dt.getFullYear() === n.getFullYear() && dt.getMonth() === n.getMonth() && dt.getDate() === n.getDate();
  };

  const todaysEvents = calendar
    .filter((e) => isToday(e.start_time))
    .sort((a, b) => new Date(a.start_time) - new Date(b.start_time));
  const nextEvent = todaysEvents.find((e) => new Date(e.start_time).getTime() >= now) || todaysEvents[0] || null;

  const urgentCount = emails.filter((e) => e.category === 'urgent').length;
  const needReplyCount = emails.filter((e) => e.category === 'needs_reply').length;

  const tasksDue = tasks.filter((t) => !t.completed);
  const tasksDone = tasks.filter((t) => t.completed).length;

  const pendingBills = bills
    .filter((b) => b.status !== 'paid')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));
  const nextBill = pendingBills[0] || null;

  const activeDeliveries = deliveries.filter((d) => d.status !== 'delivered');
  const nextTrip = (travel || [])
    .slice()
    .sort((a, b) => new Date(a.depart_time) - new Date(b.depart_time))[0] || null;

  res.json({
    user: { name: u ? (u.name || null) : mock.user.name, timezone: u ? (u.timezone || 'Asia/Karachi') : mock.user.timezone },
    calendar: { count: todaysEvents.length, next: nextEvent ? { title: nextEvent.title, start_time: nextEvent.start_time } : null },
    email: { urgent: urgentCount, need_reply: needReplyCount, total_unread: emails.length },
    tasks: { due: tasksDue.length, done: tasksDone, total: tasks.length },
    bills: { next: nextBill, count: pendingBills.length },
    deliveries: { count: activeDeliveries.length, next: activeDeliveries[0] || null },
    travel: { next: nextTrip },
    health: u ? { sleep_hours: null, hrv: null, steps: null } : { sleep_hours: mock.health.sleep_hours, hrv: mock.health.hrv, steps: mock.health.steps },
  });
});

// ── Mutations (used by swipe gestures; work on live data, no-op on mock) ──
router.post('/tasks/:id/complete', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('tasks');
  try {
    if (u && repo && repo.complete) repo.complete(req.params.id);
  } catch (_) { /* ignore for mock */ }
  res.json({ ok: true, id: req.params.id, completed: true });
});

router.post('/bills/:id/pay', (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('bills');
  try {
    if (u && repo && repo.markPaid) repo.markPaid(req.params.id);
  } catch (_) { /* ignore for mock */ }
  res.json({ ok: true, id: req.params.id, status: 'paid' });
});

// ── PATCH /api/me — update profile / settings (auth required) ─────────
//   Accepts a whitelisted subset of user fields (name, timezone, work hours,
//   briefing/debrief times, proactiveness_level, enabled_skills, tone,
//   communication_style, language). Requires an authenticated session.
const SETTINGS_FIELDS = [
  'name', 'timezone', 'work_hours_start', 'work_hours_end', 'language',
  'briefing_time', 'debrief_time', 'proactiveness_level', 'enabled_skills',
  'tone', 'communication_style',
];

router.patch(['/me', '/settings'], (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const body = req.body || {};
  const patch = {};
  for (const k of SETTINGS_FIELDS) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  if (Object.keys(patch).length === 0) {
    return res.status(400).json({ error: 'No updatable fields provided.' });
  }
  const updated = usersRepo.update(req.user.id, patch);
  res.json({ user: usersRepo.toPublic(updated) });
});

// ── POST /api/onboarding/complete — finish the wizard (auth required) ─
//   Optionally accepts the full settings payload to persist in one shot.
router.post('/onboarding/complete', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const body = req.body || {};
  const patch = {};
  for (const k of SETTINGS_FIELDS) {
    if (body[k] !== undefined) patch[k] = body[k];
  }
  patch.onboarding_complete = 1;
  const updated = usersRepo.update(req.user.id, patch);
  res.json({ user: usersRepo.toPublic(updated) });
});

function safeParse(s, fallback) {
  try { return JSON.parse(s); } catch (_) { return fallback; }
}

module.exports = router;
