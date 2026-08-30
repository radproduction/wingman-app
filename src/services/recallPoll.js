'use strict';

/**
 * Polls in-flight Recall.ai bots and, when one is done, pulls its transcript
 * (or, failing that, its audio recording) and runs it through the meeting
 * pipeline — same summary/email/app/tasks the rest of the product uses. Runs on
 * a short cron (see scheduler.js). No public webhook needed, so it works even
 * before the domain/HTTPS is cut over.
 */

const recall = require('./recall');
const botsRepo = require('../db/meetingBots');
const usersRepo = require('../db/users');
const meetingsRepo = require('../db/meetings');
const meetingIngest = require('./meetingIngest');

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

  botsRepo.update(session.id, { status: 'processing', endedAt: new Date().toISOString() });

  // Prefer Recall's transcript (no size limits). Fall back to downloading the
  // audio and running our own Gemini/Whisper transcription.
  let transcript = '';
  try { transcript = await recall.getTranscript(session.recall_bot_id); }
  catch (e) { console.warn('[recallPoll] transcript fetch failed:', e.message); }

  let result = null;
  try {
    if (transcript && transcript.length > 20) {
      result = await meetingIngest.processTranscript(user, meeting, transcript, { emailUser: true, createTasks: true });
    } else {
      const rec = await recall.fetchRecording(bot);
      if (!rec || !rec.buffer || !rec.buffer.length) {
        botsRepo.update(session.id, { status: 'failed', error: 'no transcript or recording' });
        await pingCouldntCapture(user, meeting.title || 'your meeting');
        return false;
      }
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
