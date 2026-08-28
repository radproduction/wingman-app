'use strict';

/**
 * Wingman notetaker bot worker.
 *
 * Loop: poll the backend for queued meetings → for each, launch a browser tab,
 * join the call, wait to be admitted, record the audio to the PulseAudio sink,
 * and when the meeting ends hand the recording back to the backend (which runs
 * transcription → summary → email → app update → tasks).
 *
 * Meetings are processed SERIALLY: there is one default audio sink, so one
 * recording at a time. To run concurrent meetings you need per-session Pulse
 * sinks + more RAM — see README ("Scaling").
 */

const os = require('os');
const path = require('path');
const { chromium } = require('playwright');
const api = require('./api');
const recorderMod = require('./recorder');
const meet = require('./meet');
const zoom = require('./zoom');

const POLL_MS = Number(process.env.POLL_INTERVAL_MS || 20000);
const MAX_MEETING_MIN = Number(process.env.MAX_MEETING_MIN || 150);
const ADMIT_TIMEOUT_MS = Number(process.env.ADMIT_TIMEOUT_MS || 300000);
const STORAGE_STATE = process.env.STORAGE_STATE || undefined; // signed-in Google session, optional
const RUN_ONCE = process.env.RUN_ONCE === '1';

const UA = process.env.BOT_USER_AGENT ||
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

let browser = null;

async function getBrowser() {
  if (browser && browser.isConnected()) return browser;
  browser = await chromium.launch({
    headless: false, // real Chrome under Xvfb — Meet/Zoom behave far better than headless
    args: [
      '--no-sandbox', '--disable-setuid-sandbox',
      '--use-fake-ui-for-media-stream',       // auto-accept the mic/cam permission prompt
      '--disable-blink-features=AutomationControlled',
      '--autoplay-policy=no-user-gesture-required',
      '--disable-dev-shm-usage',
      '--window-size=1280,720',
    ],
  });
  return browser;
}

async function handleJob(job) {
  const { id, meetingUrl, provider, botName, sessionToken } = job;
  console.log(`\n=== job ${id} (${provider || '?'}) ${meetingUrl} ===`);
  const b = await getBrowser();
  const context = await b.newContext({
    permissions: ['microphone', 'camera'],
    storageState: STORAGE_STATE,
    viewport: { width: 1280, height: 720 },
    userAgent: UA,
  });
  const page = await context.newPage();
  const outPath = path.join(os.tmpdir(), `wm_rec_${id}.ogg`);
  const recorder = new recorderMod.Recorder(outPath);
  let recording = false;

  try {
    await api.reportStatus(id, sessionToken, 'joining');

    const driver = provider === 'zoom' ? zoom : meet;
    const joinFn = provider === 'zoom' ? zoom.joinZoom : meet.joinMeet;
    const leaveFn = provider === 'zoom' ? zoom.leaveZoom : meet.leaveMeet;

    await joinFn(page, {
      url: meetingUrl,
      botName: botName || 'Wingman Notetaker',
      admitTimeoutMs: ADMIT_TIMEOUT_MS,
      onStatus: (s) => api.reportStatus(id, sessionToken, s),
    });

    // Admitted → start capturing.
    recorder.start();
    recording = true;
    await api.reportStatus(id, sessionToken, 'recording');

    await driver.waitForMeetingEnd(page, { maxMs: MAX_MEETING_MIN * 60000 });

    // Meeting done → stop + upload.
    const buffer = await recorder.stop();
    recording = false;
    try { await leaveFn(page); } catch (_) { /* ignore */ }

    if (!buffer || buffer.length < 2000) {
      throw new Error('EMPTY_RECORDING');
    }
    console.log(`[worker] uploading ${(buffer.length / 1024).toFixed(0)} KB…`);
    await api.uploadAudio(id, sessionToken, buffer, recorder.mime);
    console.log(`[worker] job ${id} done`);
  } catch (e) {
    console.warn(`[worker] job ${id} failed:`, e.message);
    if (recording) { try { await recorder.stop(); } catch (_) {} }
    await api.reportStatus(id, sessionToken, 'failed', e.message);
  } finally {
    try { await context.close(); } catch (_) {}
  }
}

async function tick() {
  let jobs = [];
  try {
    jobs = await api.claimJobs();
  } catch (e) {
    console.warn('[worker] poll failed:', e.message);
    return;
  }
  if (!jobs.length) return;
  console.log(`[worker] claimed ${jobs.length} job(s)`);
  for (const job of jobs) {
    await handleJob(job); // serial — one audio sink
  }
}

async function main() {
  console.log('[worker] Wingman notetaker worker starting');
  console.log('[worker] backend:', api.BACKEND_URL, '| poll every', POLL_MS, 'ms', RUN_ONCE ? '(RUN_ONCE)' : '');

  if (RUN_ONCE) { await tick(); await shutdown(0); return; }

  // Loop forever, sleeping between polls.
  // eslint-disable-next-line no-constant-condition
  while (true) {
    await tick();
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

async function shutdown(code = 0) {
  try { if (browser) await browser.close(); } catch (_) {}
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));

main().catch((e) => { console.error('[worker] fatal:', e); shutdown(1); });
