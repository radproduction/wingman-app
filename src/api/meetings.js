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

function requireUser(req, res) {
  if (req.user) return req.user;
  res.status(401).json({ error: 'Not signed in' });
  return null;
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
