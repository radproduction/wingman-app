'use strict';

/**
 * Polls in-flight Recall.ai bots and, when one is done, pulls its transcript
 * (or, failing that, its audio recording) and runs it through the meeting
 * pipeline — same summary/email/app/tasks the rest of the product uses. Runs on
 * a short cron (see scheduler.js). No public webhook needed, so it works even
 * before the domain/HTTPS is cut over.
 */

const crypto = require('crypto');
const { db } = require('../db');
const recall = require('./recall');
const botsRepo = require('../db/meetingBots');
const usersRepo = require('../db/users');
const meetingsRepo = require('../db/meetings');
const meetingIngest = require('./meetingIngest');

/**
 * One real meeting can spawn SEVERAL bot sessions: a duplicate calendar invite
 * with its own Meet link, auto-join plus a manual "Join with Wingman", or a
 * re-dispatch after an earlier attempt failed. Each session would otherwise
 * email + WhatsApp the user the SAME notes (and the two AI summaries differ in
 * wording, so the plain send-dedup can't catch them). Reserve a per-user,
 * per-meeting-title slot here so only the FIRST session to reach real content
 * delivers notes; the rest are skipped. Race-safe via the wa_send_dedup PRIMARY
 * KEY. The row is purged within ~an hour (scheduler cleanup), so a genuinely
 * separate later meeting with the same title (e.g. a daily recurring one) is
 * never suppressed. Empty title → key on the meeting id (never cross-merge).
 */
function reserveMeetingNotes(phone, meeting) {
  try {
    const last10 = String(phone || '').replace(/\D/g, '').slice(-10);
    const title = String((meeting && meeting.title) || '').trim().toLowerCase().replace(/\s+/g, ' ');
    const basis = title || `mid:${meeting && meeting.id}`;
    const hash = crypto.createHash('sha1').update(basis).digest('hex').slice(0, 16);
    const info = db.prepare('INSERT OR IGNORE INTO wa_send_dedup (key) VALUES (?)').run(`notes:${last10}:${hash}`);
    return info.changes === 1; // 1 → first session (deliver); 0 → already delivered → skip
  } catch (_) {
    return true; // never block a legitimate delivery on a guard error
  }
}

// Recall status → our coarse session status.
const STATUS_MAP = {
  joining_call: 'joining',
  in_waiting_room: 'waiting',
  in_call_not_recording: 'recording',
  in_call_recording: 'recording',
  recording_permission_allowed: 'recording',
  call_ended: 'processing',
};

async function runOnce() {
  if (!recall.enabled()) return { checked: 0, finished: 0 };
  const active = botsRepo.listRecallActive();
  let finished = 0;
  for (const s of active) {
    try {
      const bot = await recall.getBot(s.recall_bot_id);
      const status = recall.botStatus(bot);

      if (recall.isDone(status)) {
        if (await finish(s, bot)) finished += 1;
      } else if (recall.isFatal(status)) {
        botsRepo.update(s.id, { status: 'failed', error: `recall: ${status}` });
      } else {
        const mapped = STATUS_MAP[status];
        if (mapped && mapped !== s.status) botsRepo.update(s.id, { status: mapped });
      }
    } catch (e) {
      console.warn('[recallPoll]', s.id, e.message);
    }
  }
  return { checked: active.length, finished };
}

/** Minutes since a sqlite timestamp ('YYYY-MM-DD HH:MM:SS', UTC) or ISO string. */
function ageMinutes(ts) {
  if (!ts) return 0;
  let s = String(ts).trim();
  if (!/[TZ]/.test(s)) s = `${s.replace(' ', 'T')}Z`;
  const ms = Date.parse(s);
  return Number.isNaN(ms) ? 0 : (Date.now() - ms) / 60000;
}

/**
 * Tell the user, on WhatsApp, that the bot joined but got nothing usable — so a
 * silent failure never leaves them wondering where their notes are. Best-effort.
 */
async function pingCouldntCapture(user, title) {
  try {
    const wa = require('../whatsapp/client');
    if (!wa.ready()) return;
    await wa.sendMessage(
      user.phone,
      `⚠️ I joined *${title}* but couldn't capture any usable audio, so there are no notes this time.\n\n`
      + `This usually means the notetaker wasn't admitted into the call (tap *Admit* when "…Wingman" knocks), `
      + `or there wasn't enough conversation to record. Please try again.`,
    );
  } catch (_) { /* best-effort */ }
}

/** Turn a finished Recall bot into notes + summary + email + tasks. */
async function finish(session, bot) {
  const user = usersRepo.getById(session.user_id);
  const meeting = user && session.meeting_id ? meetingsRepo.getForUser(user.id, session.meeting_id) : null;
  if (!user || !meeting) {
    botsRepo.update(session.id, { status: 'failed', error: 'user or meeting missing' });
    return false;
  }

  // Gather whatever Recall has ready. It finishes PROCESSING the recording a bit
  // AFTER the call ends, so on the first poll(s) these can be empty — that's
  // expected, not a failure.
  let transcript = '';
  try { transcript = await recall.getTranscript(session.recall_bot_id); }
  catch (e) { console.warn('[recallPoll] transcript fetch failed:', e.message); }
  const haveTranscript = !!(transcript && transcript.length > 20);

  let rec = null;
  if (!haveTranscript) {
    try { rec = await recall.fetchRecording(bot); }
    catch (e) { console.warn('[recallPoll] recording fetch failed:', e.message); }
  }
  const haveRecording = !!(rec && rec.buffer && rec.buffer.length);

  // Nothing ready yet → WAIT and retry next poll instead of giving up early.
  // (The old code finalised at call_ended before the media existed, so real
  // meetings came back "couldn't capture".) Give up only after it's been too long.
  if (!haveTranscript && !haveRecording) {
    if (ageMinutes(session.created_at) < 25) {
      botsRepo.update(session.id, { status: 'processing' });
      return false;
    }
    botsRepo.update(session.id, { status: 'failed', error: 'no transcript or recording (timed out)' });
    await pingCouldntCapture(user, meeting.title || 'your meeting');
    return false;
  }

  // We have real content. If ANOTHER session already delivered notes for this
  // same meeting (duplicate invite / auto-join + manual / re-dispatch), stop
  // here so the user isn't emailed + messaged the same notes twice.
  if (!reserveMeetingNotes(user.phone, meeting)) {
    console.log(`[recallPoll] notes for "${meeting.title || 'meeting'}" already delivered to ${user.phone} — skipping duplicate session ${session.id}`);
    botsRepo.update(session.id, { status: 'done' });
    return true;
  }

  botsRepo.update(session.id, { status: 'processing', endedAt: new Date().toISOString() });

  let result = null;
  try {
    if (haveTranscript) {
      result = await meetingIngest.processTranscript(user, meeting, transcript, { emailUser: true, createTasks: true });
    } else {
      const saveToDrive = !!(user.preferences && user.preferences.saveMeetingRecording);
      result = await meetingIngest.processAudio(user, meeting, rec.buffer, rec.mime, { emailUser: true, createTasks: true, saveToDrive });
    }
  } catch (e) {
    console.warn('[recallPoll] processing failed:', e.message);
    botsRepo.update(session.id, { status: 'failed', error: e.message.slice(0, 400) });
    return false;
  }

  // The bot joined but captured nothing usable (not admitted / silent / corrupt
  // audio). Don't email invented notes — tell the user honestly.
  if (result && result.empty) {
    botsRepo.update(session.id, { status: 'failed', error: 'no usable audio/transcript' });
    await pingCouldntCapture(user, meeting.title || 'your meeting');
    return true;
  }

  botsRepo.update(session.id, { status: 'done' });
  // Ping the user on WhatsApp with the actual briefing + action items (not just a
  // "notes ready" line), so they get the gist without opening the email.
  try {
    const wa = require('../whatsapp/client');
    if (wa.ready()) {
      const msg = meetingIngest.formatNotesMessage((result && result.meeting) || meeting, result && result.summary);
      await wa.sendMessage(user.phone, msg);
    }
  } catch (_) { /* best-effort */ }
  return true;
}

module.exports = { runOnce, finish };
