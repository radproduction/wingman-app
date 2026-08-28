'use strict';

/**
 * Meetings API for the Wingman app. Every route is user-scoped via req.user
 * (attached by attachUserOptional). Notes → Claude summary + action items, with
 * optional email distribution to attendees + the user.
 */

const express = require('express');
const router = express.Router();

const meetingsRepo = require('../db/meetings');
const meetingNotes = require('../services/meetingNotes');
const meetingMailer = require('../services/meetingMailer');
const tasksRepo = require('../db/tasks');
const t = require('../utils/time');

function requireUser(req, res) {
  if (req.user) return req.user;
  res.status(401).json({ error: 'Not signed in' });
  return null;
}

// Action priority label → task priority number (1 = highest).
function priorityNum(p) {
  return p === 'High' ? 1 : p === 'Low' ? 5 : 3;
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/**
 * Turn an action item's free-text "due" ("Tomorrow at 3:00 PM", "Friday",
 * "Next week", "Today") into an ISO datetime in the user's timezone, so the task
 * gets a real reminder. Returns null when no date can be read (task has no due).
 */
function parseDueToISO(due, tz = 'Asia/Karachi', now = new Date()) {
  const s = String(due || '').trim().toLowerCase();
  if (!s || s.includes('no date')) return null;

  let dayOffset = null;
  if (s.includes('today')) dayOffset = 0;
  else if (s.includes('tomorrow')) dayOffset = 1;
  else if (s.includes('next week')) dayOffset = 7;
  else if (s.includes('this week')) dayOffset = 2;
  else {
    for (let i = 0; i < 7; i++) {
      if (s.includes(WEEKDAYS[i])) {
        const todayDow = now.getDay();
        let diff = (i - todayDow + 7) % 7;
        if (diff === 0) diff = 7; // "Friday" said on a Friday → next Friday
        dayOffset = diff;
        break;
      }
    }
  }
  if (dayOffset == null) return null;

  // Time of day (default 9:00 AM when none is stated).
  let hour = 9;
  let minute = 0;
  const ampm = s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/);
  if (ampm) {
    hour = parseInt(ampm[1], 10) % 12;
    if (ampm[3] === 'pm') hour += 12;
    minute = ampm[2] ? parseInt(ampm[2], 10) : 0;
  } else {
    const h24 = s.match(/\b(\d{1,2}):(\d{2})\b/);
    if (h24) { hour = parseInt(h24[1], 10); minute = parseInt(h24[2], 10); }
  }

  const startOfDay = t.startOfDayISO(tz, dayOffset, now); // YYYY-MM-DDT00:00:00±HH:MM
  const offset = startOfDay.slice(-6);
  const datePart = startOfDay.slice(0, 10);
  return `${datePart}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00${offset}`;
}

// ── list / get ──────────────────────────────────────────────────────
router.get('/meetings', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  res.json({ meetings: meetingsRepo.listForUser(u.id, 100) });
});

router.get('/meetings/:id', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const m = meetingsRepo.getForUser(u.id, req.params.id);
  if (!m) return res.status(404).json({ error: 'Meeting not found' });
  res.json({ meeting: m });
});

// ── create / update / delete ────────────────────────────────────────
router.post('/meetings', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const b = req.body || {};
  const m = meetingsRepo.create(u.id, {
    title: b.title,
    type: b.type,
    company: b.company,
    location: b.location,
    virtual: b.virtual,
    attendees: b.attendees,
    notes: b.notes,
    status: b.status,
    meetingAt: b.meetingAt || b.meeting_at,
  });
  res.json({ meeting: m });
});

router.patch('/meetings/:id', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const m = meetingsRepo.update(u.id, req.params.id, req.body || {});
  if (!m) return res.status(404).json({ error: 'Meeting not found' });
  res.json({ meeting: m });
});

router.delete('/meetings/:id', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  res.json({ ok: meetingsRepo.remove(u.id, req.params.id) });
});

// ── finalize: notes → summary + action items (optionally email) ─────
router.post('/meetings/:id/finalize', async (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const existing = meetingsRepo.getForUser(u.id, req.params.id);
  if (!existing) return res.status(404).json({ error: 'Meeting not found' });

  // Accept last-minute notes/attendees so the client can save + finalize in one call.
  const b = req.body || {};
  const patch = {};
  if (typeof b.notes === 'string') patch.notes = b.notes;
  if (Array.isArray(b.attendees)) patch.attendees = b.attendees;
  const base = Object.keys(patch).length ? meetingsRepo.update(u.id, existing.id, patch) : existing;

  let summary;
  try {
    summary = await meetingNotes.summarize({ title: base.title, attendees: base.attendees, notes: base.notes });
  } catch (_) {
    return res.status(502).json({ error: 'Could not generate the summary right now' });
  }
  meetingsRepo.update(u.id, base.id, { summary, status: 'summary-ready' });

  let email = null;
  if (b.send) {
    email = await meetingMailer.sendSummary(u, meetingsRepo.getForUser(u.id, base.id), summary);
    if (email && email.sent && email.sent.length) {
      meetingsRepo.update(u.id, base.id, { emailedAt: new Date().toISOString() });
    }
  }
  res.json({ meeting: meetingsRepo.getForUser(u.id, base.id), email });
});

// ── transcribe: audio recording → Whisper → notes → summary ─────────
const AUDIO_EXT = {
  'audio/webm': 'webm', 'audio/mp4': 'mp4', 'audio/mpeg': 'mp3',
  'audio/wav': 'wav', 'audio/ogg': 'ogg', 'audio/aac': 'mp4', 'video/mp4': 'mp4',
};
function extOfType(ct) {
  const base = String(ct || '').split(';')[0].trim().toLowerCase();
  return AUDIO_EXT[base] || 'webm';
}

router.post('/meetings/:id/transcribe', express.raw({ type: () => true, limit: '25mb' }), async (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const m = meetingsRepo.getForUser(u.id, req.params.id);
  if (!m) return res.status(404).json({ error: 'Meeting not found' });

  const gemini = require('../services/geminiTranscribe');
  const voice = require('../services/voice');
  if (!gemini.enabled() && !voice.enabled()) {
    return res.status(501).json({ error: 'Transcription is not available' });
  }

  const audio = req.body;
  if (!Buffer.isBuffer(audio) || !audio.length) return res.status(400).json({ error: 'No audio received' });
  const ct = req.headers['content-type'];

  // Primary: Gemini (handles mixed Roman Urdu + English). Fallback: Whisper.
  // Both errors are logged so a failure is diagnosable, not a silent 502.
  let transcript = null;
  if (gemini.enabled()) {
    try {
      transcript = await gemini.transcribe(audio, (ct || '').split(';')[0].trim());
    } catch (e) {
      console.warn('[meetings] gemini transcribe failed:', e.message);
    }
  }
  if (!transcript && voice.enabled()) {
    try {
      transcript = await voice.transcribe(audio, { filename: `meeting.${extOfType(ct)}` });
    } catch (e) {
      console.warn('[meetings] whisper transcribe failed:', e.message);
    }
  }
  if (!transcript) return res.status(502).json({ error: 'Could not transcribe the recording' });

  meetingsRepo.update(u.id, m.id, { notes: transcript });
  let summary;
  try {
    summary = await meetingNotes.summarize({ title: m.title, attendees: m.attendees, notes: transcript });
  } catch (e) {
    console.warn('[meetings] summarize failed:', e.message);
    return res.status(502).json({ error: 'Could not summarize the recording' });
  }
  meetingsRepo.update(u.id, m.id, { summary, status: 'summary-ready' });

  // Save the actual audio recording to the user's Google Drive (best-effort —
  // never fails the transcription). Only when Drive is connected.
  try {
    if (require('../auth/googleAuth').isConnected(u)) {
      const drive = require('../services/drive');
      const ext = extOfType(ct);
      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
      const up = await drive.uploadFile(u, {
        name: `${m.title || 'Meeting'} — ${stamp}.${ext}`,
        mimeType: (ct || 'audio/webm').split(';')[0].trim(),
        buffer: audio,
        folderName: 'Wingman Meetings',
      });
      if (up && up.link) meetingsRepo.update(u.id, m.id, { recordingUrl: up.link });
    }
  } catch (e) {
    console.warn('[meetings] drive recording save failed:', e.message);
  }

  res.json({ meeting: meetingsRepo.getForUser(u.id, m.id), transcript });
});

// ── create-tasks: turn the summary's action items into REAL tasks (+reminders) ─
router.post('/meetings/:id/create-tasks', (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const m = meetingsRepo.getForUser(u.id, req.params.id);
  if (!m) return res.status(404).json({ error: 'Meeting not found' });
  const actions = (m.summary && Array.isArray(m.summary.actions)) ? m.summary.actions : [];
  if (!actions.length) return res.json({ created: 0, tasks: [] });

  const tz = u.timezone || 'Asia/Karachi';
  // Don't double-create if this meeting's tasks were already made.
  const existing = new Set(
    tasksRepo.listForUser(u.id, { includeCompleted: true, limit: 500 }).map((x) => String(x.title || '').toLowerCase()),
  );
  const created = [];
  for (const a of actions) {
    const title = String(a.task || '').trim();
    if (!title || existing.has(title.toLowerCase())) continue;
    const dueDate = parseDueToISO(a.due, tz);
    const task = tasksRepo.create({ userId: u.id, title, source: 'meeting', priority: priorityNum(a.priority), dueDate });
    created.push({ id: task.id, title, due_date: dueDate });
    existing.add(title.toLowerCase());
  }
  meetingsRepo.update(u.id, m.id, { tasksCreated: true });
  res.json({ created: created.length, tasks: created });
});

// ── notify-attendees: send the summary to attendees' WhatsApp numbers ─────────
router.post('/meetings/:id/notify-attendees', async (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const m = meetingsRepo.getForUser(u.id, req.params.id);
  if (!m) return res.status(404).json({ error: 'Meeting not found' });
  if (!m.summary) return res.status(400).json({ error: 'No summary to send yet' });

  const wa = require('../whatsapp/client');
  if (!wa.ready()) return res.status(503).json({ error: 'WhatsApp is not connected' });

  // Build a compact summary message with action items.
  const lines = [`📋 *${m.title || 'Meeting'}*`];
  if (m.summary.overview) lines.push('', m.summary.overview);
  if (Array.isArray(m.summary.actions) && m.summary.actions.length) {
    lines.push('', '*Action items:*');
    for (const a of m.summary.actions) {
      const meta = [a.owner, a.due].filter(Boolean).join(', ');
      lines.push(`• ${a.task}${meta ? ` (${meta})` : ''}`);
    }
  }
  lines.push('', '— via Wingman');
  const body = lines.join('\n');

  const digits = (p) => String(p || '').replace(/[^0-9]/g, '');
  const targets = (m.attendees || []).filter((a) => a && digits(a.phone).length >= 8);
  if (!targets.length) return res.json({ sent: [], failed: [], skipped: 'no_attendee_phones' });

  const sent = [];
  const failed = [];
  for (const a of targets) {
    try {
      await wa.sendMessage(digits(a.phone), body);
      sent.push(a.name || digits(a.phone));
    } catch (err) {
      // WhatsApp only delivers to numbers that messaged the business in the last
      // 24h (unless a template is used), so a fresh attendee will fail here.
      failed.push({ name: a.name || digits(a.phone), reason: err.message });
    }
  }
  res.json({ sent, failed });
});

// ── send: email the stored summary ──────────────────────────────────
router.post('/meetings/:id/send', async (req, res) => {
  const u = requireUser(req, res);
  if (!u) return;
  const m = meetingsRepo.getForUser(u.id, req.params.id);
  if (!m) return res.status(404).json({ error: 'Meeting not found' });
  if (!m.summary) return res.status(400).json({ error: 'No summary to send yet' });

  const email = await meetingMailer.sendSummary(u, m, m.summary);
  if (email && email.sent && email.sent.length) {
    meetingsRepo.update(u.id, m.id, { emailedAt: new Date().toISOString() });
  }
  res.json({ email });
});

module.exports = router;
