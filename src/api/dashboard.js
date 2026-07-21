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
    gmail_connected: require('../auth/googleAuth').isEmailConnected(u),
    calendar_connected: require('../auth/googleAuth').isConnected(u),
    wingman_number: config.wingmanNumber || null,
    whatsapp_connected: whatsappConnected,
    mock: false,
  });
});

// ── /api/calendar?range=today|tomorrow|week ─────────────────────────
router.get('/calendar', async (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('calendarEvents');
  // Best-effort live sync from Google over a broad window so the dashboard
  // reflects real events — including ones just created via WhatsApp. Falls
  // back to whatever is cached if Google is unreachable / not connected.
  if (u && require('../auth/googleAuth').isConnected(u)) {
    try {
      const calSvc = require('../services/calendar');
      const from = new Date(Date.now() - 7 * 86400000).toISOString();
      const to = new Date(Date.now() + 45 * 86400000).toISOString();
      await calSvc.getEvents(u.id, { from, to });
    } catch (_) { /* keep cached events */ }
  }
  const { data, mock: isMock } = safe(() => {
    if (!u || !repo || !repo.listForUser) return null;
    if (!require('../auth/googleAuth').isConnected(u)) return [];
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
    if (!require('../auth/googleAuth').isEmailConnected(u)) return [];
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
router.get('/tasks', async (req, res) => {
  const u = resolveUser(req);
  const repo = requireRepo('tasks');
  if (u) {
    try { await require('../services/googleTasks').syncUser(u.id); } catch (_) { /* keep local copy */ }
  }
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
router.get('/dashboard', async (req, res) => {
  const u = resolveUser(req);
  if (u) {
    try { await require('../services/googleTasks').syncUser(u.id); } catch (_) { /* keep cached tasks */ }
  }

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
    if (u && repo && repo.complete) {
      repo.complete(req.params.id);
      require('../services/googleTasks').mirrorTaskCompletion(req.params.id).catch(() => {});
    }
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
  'news_topics', 'news_city', 'news_country', 'voice_replies', 'voice_name', 'assistant_name',
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

// ── Health ───────────────────────────────────────────────────────────
//   Apple Health / Health Connect are on-device only, so instead of an OAuth
//   flow each user gets a private URL that a phone automation posts readings to.
router.get('/health/connect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const health = require('../services/health');
  const healthRepo = require('../db/healthData');
  res.json({
    ingest_url: `${config.publicBaseUrl}/health/ingest/${health.tokenFor(req.user.id)}`,
    connected: healthRepo.hasAnyData(req.user.id),
    metrics: Object.entries(healthRepo.METRICS).map(([k, v]) => ({ metric: k, label: v.label, unit: v.unit })),
  });
});

/**
 * Google Health — the one-click path (Android, Pixel Watch, Fitbit, Wear OS).
 * Returns the consent URL rather than redirecting, so the SPA can open it.
 */
router.get('/health/google', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const googleAuth = require('../auth/googleAuth');
  const phone = String(req.user.phone || '').replace(/[^0-9]/g, '');
  res.json({
    connected: googleAuth.isHealthConnected(req.user),
    last_synced_at: req.user.google_health_synced_at || null,
    connect_url: `${config.publicBaseUrl}/auth/google/health?phone=${encodeURIComponent(phone)}`,
  });
});

/** Pull now, so the user isn't left staring at an empty screen after connecting. */
router.post('/health/google/sync', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  try {
    const r = await require('../services/googleHealth').syncUser(req.user.id, { days: 14 });
    if (r.errors && r.errors.includes('NOT_CONNECTED')) {
      return res.status(400).json({ error: 'Google Health is not connected yet.' });
    }
    res.json({ ok: true, saved: r.saved, skipped: r.skipped, errors: r.errors });
  } catch (err) {
    console.error('[health] google sync failed:', err.message);
    res.status(500).json({ error: 'Could not sync from Google Health.' });
  }
});

/** Every wearable brand, with where this user stands on each. */
router.get('/health/wearables', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  res.json({ providers: require('../services/wearables').statusFor(req.user) });
});

router.post('/health/wearables/:provider/sync', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const r = await require('../services/wearables').syncOne(req.user.id, req.params.provider, { days: 14 });
  if (r.error) return res.status(400).json({ error: r.error });
  res.json({ ok: true, saved: r.saved });
});

router.post('/health/wearables/:provider/disconnect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  require('../services/wearables').disconnect(req.user.id, req.params.provider);
  res.json({ ok: true });
});

router.post('/health/google/disconnect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  require('../auth/googleAuth').disconnectHealth(req.user.id);
  res.json({ ok: true, connected: false });
});

/** Rotate the link (old one stops working immediately). */
router.post('/health/reset-link', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const health = require('../services/health');
  health.revokeToken(req.user.id);
  res.json({ ingest_url: `${config.publicBaseUrl}/health/ingest/${health.tokenFor(req.user.id)}` });
});

// ── Work clock (attendance / HRMS webhook) ───────────────────────────
//   The user's attendance system posts clock-in / clock-out to a private URL,
//   so Wingman can catch a forgotten clock-out. Same shape as health: a token
//   in the URL, because the sending system has no session of its own.
router.get('/work/connect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const work = require('../services/work');
  const sessionsRepo = require('../db/workSessions');
  res.json({
    webhook_url: `${config.publicBaseUrl}/work/event/${work.tokenFor(req.user.id)}`,
    connected: sessionsRepo.hasAnyData(req.user.id),
    status: work.status(req.user.id),
    // Outbound side: configured or not, and where to — never the secret.
    action_configured: work.hasAction(req.user),
    action_url: req.user.work_action_url || null,
    employee_ref: req.user.work_employee_ref || null,
  });
});

/**
 * Configure the other direction: where Wingman should POST when the user says
 * "clock me out". The secret is encrypted at rest and never returned.
 */
router.post('/work/action', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const work = require('../services/work');
  const b = req.body || {};

  if (b.disconnect) {
    work.clearAction(req.user.id);
    return res.json({ ok: true, configured: false });
  }

  const r = await work.setAction(req.user.id, {
    url: b.url,
    secret: b.secret,
    employeeRef: b.employee_ref || null,
  });
  if (!r.ok) return res.status(400).json({ error: r.error });
  res.json({ ok: true, configured: true, url: r.url });
});

/** Fire a real clock event to check the endpoint actually works. */
router.post('/work/action/test', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const work = require('../services/work');
  const event = req.body && req.body.event === 'clock_in' ? 'clock_in' : 'clock_out';
  const r = await work.performClock(req.user.id, event);
  if (!r.ok) return res.status(400).json({ error: r.detail || r.error, code: r.error });
  res.json({ ok: true, event: r.event, at: r.at });
});

/** Rotate the link (old one stops working immediately). */
router.post('/work/reset-link', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const work = require('../services/work');
  work.revokeToken(req.user.id);
  res.json({ webhook_url: `${config.publicBaseUrl}/work/event/${work.tokenFor(req.user.id)}` });
});

// ── Webmail (IMAP/SMTP business email) ───────────────────────────────
//   Credentials are verified against the real servers BEFORE being stored, and
//   the password is encrypted at rest — it is never returned by any endpoint.
router.post('/webmail/connect', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const b = req.body || {};
  const address = String(b.address || '').trim().toLowerCase();
  const password = String(b.password || '');
  if (!address || !password) return res.status(400).json({ error: 'Email address and password are required.' });

  const webmail = require('../services/webmail');
  const secrets = require('../utils/secrets');
  if (!secrets.available()) {
    return res.status(503).json({ error: 'Secure storage is not configured on the server, so we cannot save mail credentials yet.' });
  }

  const guess = webmail.detectSettings(address) || {};
  const cfg = {
    address,
    password,
    imapHost: String(b.imap_host || guess.imapHost || '').trim(),
    imapPort: Number(b.imap_port || guess.imapPort || 993),
    smtpHost: String(b.smtp_host || guess.smtpHost || '').trim(),
    smtpPort: Number(b.smtp_port || guess.smtpPort || 465),
    fromName: String(b.from_name || '').trim() || null,
  };
  if (!cfg.imapHost || !cfg.smtpHost) {
    return res.status(400).json({ error: 'Could not work out the mail server for that address — please enter the IMAP and SMTP hosts.' });
  }

  let capability;
  try {
    capability = await webmail.testConnection(cfg);
  } catch (err) {
    const raw = String(err.message || '');
    // Log the real thing: the generic fallback below tells the user to "check
    // the details" for faults that have nothing to do with what they typed.
    console.error('[webmail] connect failed:', raw);

    const map = {
      WEBMAIL_AUTH_FAILED: 'The email address or password was rejected. If your provider uses 2-factor login, create an app password and use that.',
      WEBMAIL_HOST_NOT_FOUND: `Could not reach the mail server. Check the ${raw.startsWith('IMAP') ? 'IMAP' : 'SMTP'} host.`,
      WEBMAIL_CONNECTION_FAILED: 'The mail server did not respond. Check the host and port.',
    };
    const code = raw.split(':')[1] || raw;
    if (map[code]) return res.status(400).json({ error: map[code] });

    // Unmapped: show what the mail server actually said, rather than implying
    // the user mistyped something.
    const detail = raw.replace(/^IMAP:|^SMTP:/, '').trim();
    return res.status(400).json({
      error: `Could not connect to that mailbox — the mail server said: ${detail || 'no reason given'}`,
    });
  }

  webmail.saveForUser(req.user.id, cfg);
  res.json({
    connected: true,
    address,
    imap_host: cfg.imapHost,
    smtp_host: cfg.smtpHost,
    can_send: capability.canSend,
    // Said plainly so nobody discovers mid-reply that sending was never possible.
    send_note: capability.canSend
      ? null
      : 'Reading works. Sending is blocked by this server\'s host, so replies cannot go out from this address yet.',
  });
});

router.post('/webmail/disconnect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  require('../services/webmail').disconnect(req.user.id);
  res.json({ connected: false });
});

/** Suggested IMAP/SMTP settings for an address, so the form can pre-fill. */
router.get('/webmail/detect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const d = require('../services/webmail').detectSettings(req.query.address);
  if (!d) return res.status(400).json({ error: 'Enter a full email address.' });
  res.json(d);
});

// ── POST /api/places — save home / office (geocoded) ─────────────────
//   Goes through Maps so we store real coordinates, which is what the traffic
//   and leave-by calculations need. A bad address is rejected up front.
router.post('/places', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const which = String((req.body || {}).which || '').toLowerCase();
  const address = String((req.body || {}).address || '').trim();
  if (which !== 'home' && which !== 'office') {
    return res.status(400).json({ error: 'which must be "home" or "office".' });
  }
  if (!address) return res.status(400).json({ error: 'An address is required.' });

  try {
    const maps = require('../services/maps');
    const geo = await maps.savePlace(req.user.id, which, address);
    if (!geo) return res.status(400).json({ error: `Could not save "${address}". Please try again.` });
    res.json({
      saved: true,
      which,
      address: geo.address,
      geocoded: geo.geocoded,
      // Saved either way; only precise traffic timing needs the coordinates.
      note: geo.geocoded ? null : 'Saved. Traffic timing for this place is limited until the map lookup is working.',
    });
  } catch (err) {
    const msg = (err && err.message) || '';
    // Collapsing every failure into "could not look up that address" blamed the
    // user's typing for what is usually a key or billing problem on our side.
    console.error('[places] lookup failed:', msg);

    if (msg === 'MAPS_NOT_CONFIGURED') {
      return res.status(503).json({ error: 'Traffic features are not switched on yet — no Maps API key is configured.' });
    }
    if (msg === 'MAPS_REQUEST_DENIED') {
      return res.status(503).json({
        error: 'Google rejected the map lookup. The Maps API key is missing, restricted, or the Geocoding API is not enabled for it.',
      });
    }
    if (msg === 'MAPS_QUOTA_EXCEEDED') {
      return res.status(503).json({ error: "Google's map quota is used up for now — try again later." });
    }
    res.status(400).json({ error: `Could not look up that address (${msg || 'unknown error'}).` });
  }
});

// ── Google accounts (multi-account) ──────────────────────────────────
//   The PRIMARY account is mirrored into the legacy users.*_token columns so
//   every existing feature keeps working; this keeps that mirror correct after
//   a disconnect or a primary switch.
function syncPrimaryToLegacy(userId) {
  const accountsRepo = require('../db/googleAccounts');
  const next = accountsRepo.getPrimary(userId);
  if (next) {
    usersRepo.update(userId, { calendar_token: next.token, gmail_token: next.token });
  } else {
    usersRepo.update(userId, { calendar_token: null, gmail_token: null });
  }
  return next || null;
}

/** GET /api/google/accounts — linked accounts, backfilling any missing email. */
router.get('/google/accounts', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const accountsRepo = require('../db/googleAccounts');
  let accounts = accountsRepo.listForUser(req.user.id);

  // Accounts linked before the identity scope existed have no email yet — try
  // to resolve it once so the UI can label them properly.
  for (const a of accounts) {
    if (a.email) continue;
    try {
      const googleAuth = require('../auth/googleAuth');
      const client = googleAuth.getAuthorizedClient(req.user, 'gmail', a);
      const email = await googleAuth.fetchAccountEmail(client);
      if (email) accountsRepo.setEmail(a.id, email);
    } catch (_) { /* leave unlabelled */ }
  }
  accounts = accountsRepo.listForUser(req.user.id);

  res.json({
    accounts: accounts.map((a) => ({
      id: a.id,
      email: a.email,
      is_primary: !!a.is_primary,
      connected_at: a.created_at,
    })),
  });
});

/** POST /api/google/accounts/:id/disconnect — unlink one account. */
router.post('/google/accounts/:id/disconnect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const accountsRepo = require('../db/googleAccounts');
  const cleanup = require('../services/googleDisconnectCleanup');
  const account = accountsRepo.getById(req.params.id);
  if (!account || account.user_id !== req.user.id) return res.status(404).json({ error: 'Account not found.' });
  const result = accountsRepo.remove(req.user.id, req.params.id);
  if (!result.removed) return res.status(404).json({ error: 'Account not found.' });
  syncPrimaryToLegacy(req.user.id);
  const accounts = accountsRepo.listForUser(req.user.id);
  const cleanupResult = accounts.length
    ? cleanup.cleanupAccount(req.user.id, account)
    : cleanup.cleanupAllGoogleData(req.user.id);
  if (accounts.length) cleanup.resyncPrimaryData(req.user.id).catch(() => {});
  res.json({
    cleanup: cleanupResult,
    accounts: accounts.map((a) => ({ id: a.id, email: a.email, is_primary: !!a.is_primary, connected_at: a.created_at })),
  });
});

/** POST /api/google/accounts/:id/primary — choose which account sends/creates. */
router.post('/google/accounts/:id/primary', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const accountsRepo = require('../db/googleAccounts');
  const cleanup = require('../services/googleDisconnectCleanup');
  if (!accountsRepo.getById(req.params.id)) return res.status(404).json({ error: 'Account not found.' });
  accountsRepo.setPrimary(req.user.id, req.params.id);
  syncPrimaryToLegacy(req.user.id);
  const cleanupResult = cleanup.cleanupAllGoogleData(req.user.id);
  cleanup.resyncPrimaryData(req.user.id).catch(() => {});
  const accounts = accountsRepo.listForUser(req.user.id);
  res.json({
    cleanup: cleanupResult,
    accounts: accounts.map((a) => ({ id: a.id, email: a.email, is_primary: !!a.is_primary, connected_at: a.created_at })),
  });
});

// ── POST /api/shopify/connect — link a store (auth required) ─────────
//   Verifies the domain + Admin API token against Shopify before saving, so a
//   bad credential is rejected up front rather than failing later in chat.
router.post('/shopify/connect', async (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  const body = req.body || {};
  const domain = String(body.domain || '').trim();
  const token = String(body.token || '').trim();
  if (!domain || !token) {
    return res.status(400).json({ error: 'Store domain and Admin API token are required.' });
  }
  try {
    const shopify = require('../services/shopify');
    const info = await shopify.testConnection(domain, token);
    usersRepo.update(req.user.id, { shopify_domain: info.domain, shopify_token: token });
    res.json({ connected: true, shop: info.shop, domain: info.domain, currency: info.currency });
  } catch (err) {
    const map = {
      SHOPIFY_AUTH_FAILED: 'Could not connect — check the Admin API access token.',
      SHOPIFY_NOT_FOUND: 'Store not found — check the domain (e.g. mystore.myshopify.com).',
    };
    res.status(400).json({ error: map[err.message] || 'Could not reach that store. Please check the details and try again.' });
  }
});

// ── POST /api/shopify/disconnect ─────────────────────────────────────
router.post('/shopify/disconnect', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'Authentication required.' });
  usersRepo.update(req.user.id, { shopify_domain: null, shopify_token: null });
  res.json({ connected: false });
});

function safeParse(s, fallback) {
  try { return JSON.parse(s); } catch (_) { return fallback; }
}

module.exports = router;
