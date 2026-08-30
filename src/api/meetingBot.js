'use strict';

/**
 * Notetaker bot API. Two audiences:
 *
 *  1. The Wingman app / user (req.user via attachUserOptional):
 *       POST   /api/meetings/join            → send the bot to an event or URL
 *       GET    /api/meetings/bots            → list this user's bot sessions
 *       POST   /api/meetings/bots/:id/cancel → cancel a queued session
 *
 *  2. The browser worker on a separate host (shared BOT_WORKER_TOKEN + a
 *     per-session token). It never has a user session:
 *       GET    /api/bot/jobs                 → claim queued jobs
 *       PATCH  /api/bot/sessions/:id/status  → report join/record progress
 *       POST   /api/bot/sessions/:id/audio   → hand back the recording
 *
 * The worker path is inert until BOT_WORKER_TOKEN is set, so nothing here does
 * anything unexpected before Phase 2 is deployed.
 */

const express = require('express');
const router = express.Router();

const usersRepo = require('../db/users');
const meetingsRepo = require('../db/meetings');
const botsRepo = require('../db/meetingBots');
const calendarEvents = require('../db/calendarEvents');
const calendar = require('../services/calendar');
const dispatch = require('../services/meetingBotDispatch');
const meetingIngest = require('../services/meetingIngest');

function requireUser(req, res) {
  if (req.user) return req.user;
  res.status(401).json({ error: 'Not signed in' });
  return null;
}

// ── user-facing ──────────────────────────────────────────────────────

// Send the notetaker bot to a calendar event (by gcalEventId) or a raw meeting
// URL. Creates the session + a meeting record; the worker picks it up.
router.post('/meetings/join', express.json(), async (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const b = req.body || {};

  let session = null;
  if (b.gcalEventId) {
    const ev = calendarEvents.findByGcalId(u.id, b.gcalEventId);
    if (!ev) return res.status(404).json({ error: 'Event not found' });
    if (!ev.meeting_url) return res.status(400).json({ error: 'That event has no video link' });
    session = await dispatch.dispatchForEvent(u.id, ev);
  } else if (b.meetingUrl) {
    const link = calendar.extractMeetingLink({ location: String(b.meetingUrl), description: '' });
    if (!link.meetingUrl) return res.status(400).json({ error: 'That does not look like a Meet/Zoom/Teams link' });
    session = await dispatch.dispatchForUrl(u.id, {
      meetingUrl: link.meetingUrl,
      provider: link.meetingProvider,
      title: b.title || 'Meeting',
    });
  } else {
    return res.status(400).json({ error: 'Provide gcalEventId or meetingUrl' });
  }

  const ready = dispatch.enabled();
  res.json({
    session,
    queued: true,
    workerReady: ready,
    note: ready ? undefined : 'Queued. The bot worker is not deployed yet, so it will not join until then.',
  });
});

router.get('/meetings/bots', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  res.json({ sessions: botsRepo.listForUser(u.id, 50) });
});

// Turn auto-join on/off — when on, the scheduler sends the bot to every upcoming
// calendar meeting that has a video link.
router.post('/meetings/auto-join', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const enabled = !!(req.body && req.body.enabled);
  const prefs = u.preferences || {};
  prefs.autoJoinMeetings = enabled;
  usersRepo.update(u.id, { preferences: prefs });
  res.json({ autoJoinMeetings: enabled });
});

// Turn Drive recording save on/off for bot meetings. Off (default) = transcribe
// only, nothing stored → no Drive space used. Turn on once Drive has room.
router.post('/meetings/recording', express.json(), (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const enabled = !!(req.body && req.body.enabled);
  const prefs = u.preferences || {};
  prefs.saveMeetingRecording = enabled;
  usersRepo.update(u.id, { preferences: prefs });
  res.json({ saveMeetingRecording: enabled });
});

router.post('/meetings/bots/:id/cancel', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const s = botsRepo.getForUser(u.id, req.params.id);
  if (!s) return res.status(404).json({ error: 'Session not found' });
  botsRepo.update(s.id, { status: 'cancelled' });
  res.json({ ok: true });
});

// ── worker-facing ────────────────────────────────────────────────────

// Shared secret between backend and the browser worker. No token → 503 (feature
// off), so the routes are safe to leave mounted before the worker exists.
function botAuth(req, res, next) {
  const token = process.env.BOT_WORKER_TOKEN;
  if (!token) return res.status(503).json({ error: 'Bot worker not configured' });
  const got = String(req.headers['authorization'] || '').replace(/^Bearer\s+/i, '').trim();
  if (!got || got !== token) return res.status(401).json({ error: 'Bad worker token' });
  return next();
}

// Per-session token (issued in the job payload) — sent as x-bot-session so it
// never collides with the user auth middleware's x-session-token.
function sessionTokenOk(req, session) {
  const got = String(req.headers['x-bot-session'] || '').trim();
  return !!(session && got && got === session.worker_token);
}

// Claim queued jobs. Marks them 'dispatched'; a crashed worker's job is still
// re-listed next poll (scheduled/dispatched both qualify), giving a natural retry.
router.get('/bot/jobs', botAuth, (req, res) => {
  const jobs = botsRepo.listDispatchable(10);
  const out = [];
  for (const j of jobs) {
    botsRepo.update(j.id, { status: 'dispatched' });
    out.push({
      id: j.id,
      meetingUrl: j.meeting_url,
      provider: j.provider,
      botName: j.bot_name,
      sessionToken: j.worker_token,
      scheduledAt: j.scheduled_at,
    });
  }
  res.json({ jobs: out });
});

const STATUS_ALLOWED = new Set(['joining', 'waiting', 'recording', 'processing', 'failed', 'done', 'cancelled']);

router.patch('/bot/sessions/:id/status', botAuth, express.json(), (req, res) => {
  const s = botsRepo.getById(req.params.id);
  if (!s) return res.status(404).json({ error: 'No such session' });
  if (!sessionTokenOk(req, s)) return res.status(401).json({ error: 'Bad session token' });

  const b = req.body || {};
  const patch = {};
  if (b.status && STATUS_ALLOWED.has(b.status)) patch.status = b.status;
  if (b.error) patch.error = String(b.error).slice(0, 500);
  if (b.status === 'recording' && !s.started_at) patch.startedAt = new Date().toISOString();
  botsRepo.update(s.id, patch);
  res.json({ ok: true });
});

// The worker hands back the finished recording. We run it through the shared
// meeting pipeline (transcript → summary → Drive → email the user → tasks) and
// ping the user on WhatsApp that their notes are ready.
router.post('/bot/sessions/:id/audio', botAuth, express.raw({ type: () => true, limit: '120mb' }), async (req, res) => {
  const s = botsRepo.getById(req.params.id);
  if (!s) return res.status(404).json({ error: 'No such session' });
  if (!sessionTokenOk(req, s)) return res.status(401).json({ error: 'Bad session token' });

  const audio = req.body;
  if (!Buffer.isBuffer(audio) || !audio.length) return res.status(400).json({ error: 'No audio received' });

  const user = usersRepo.getById(s.user_id);
  const meeting = user && s.meeting_id ? meetingsRepo.getForUser(user.id, s.meeting_id) : null;
  if (!user || !meeting) {
    botsRepo.update(s.id, { status: 'failed', error: 'user or meeting missing' });
    return res.status(410).json({ error: 'Session target gone' });
  }

  botsRepo.update(s.id, { status: 'processing', endedAt: new Date().toISOString() });
  try {
    // Only save the audio to Drive when the user opted in — otherwise transcribe
    // only (no stored recording, no Drive space used). Default off, because the
    // client's Drive was full.
    const saveToDrive = !!(user.preferences && user.preferences.saveMeetingRecording);
    const out = await meetingIngest.processAudio(user, meeting, audio, req.headers['content-type'], {
      emailUser: true, createTasks: true, saveToDrive,
    });
    botsRepo.update(s.id, { status: 'done', recordingUrl: out.recordingUrl || null });
    try { await notifyReady(user, out.meeting, out.summary); } catch (_) { /* best-effort */ }
    res.json({ ok: true, meetingId: meeting.id });
  } catch (e) {
    console.warn('[bot] audio processing failed:', e.message);
    botsRepo.update(s.id, { status: 'failed', error: e.message });
    res.status(502).json({ error: 'processing failed' });
  }
});

async function notifyReady(user, meeting, summary) {
  const wa = require('../whatsapp/client');
  if (!wa.ready()) return;
  // Same briefing + action-item bullets the Recall path sends.
  const msg = meetingIngest.formatNotesMessage(meeting, summary != null ? summary : (meeting && meeting.summary));
  await wa.sendMessage(user.phone, msg);
}

module.exports = router;
