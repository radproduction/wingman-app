'use strict';

/**
 * Thin client for the Wingman backend's bot API. All calls carry the shared
 * BOT_WORKER_TOKEN; per-session calls also carry the session token issued in the
 * job payload.
 */

const BACKEND_URL = (process.env.BACKEND_URL || '').replace(/\/+$/, '');
const WORKER_TOKEN = process.env.BOT_WORKER_TOKEN || '';

if (!BACKEND_URL) console.warn('[api] BACKEND_URL is not set');
if (!WORKER_TOKEN) console.warn('[api] BOT_WORKER_TOKEN is not set');

function authHeaders(sessionToken) {
  const h = { authorization: `Bearer ${WORKER_TOKEN}` };
  if (sessionToken) h['x-bot-session'] = sessionToken;
  return h;
}

/** Claim any queued jobs. Returns an array (possibly empty). */
async function claimJobs() {
  const res = await fetch(`${BACKEND_URL}/api/bot/jobs`, { headers: authHeaders() });
  if (res.status === 503) return []; // worker disabled backend-side
  if (!res.ok) throw new Error(`claimJobs ${res.status}`);
  const body = await res.json();
  return Array.isArray(body.jobs) ? body.jobs : [];
}

/** Report a lifecycle status change (joining/waiting/recording/failed/…). */
async function reportStatus(sessionId, sessionToken, status, error) {
  try {
    await fetch(`${BACKEND_URL}/api/bot/sessions/${sessionId}/status`, {
      method: 'PATCH',
      headers: { ...authHeaders(sessionToken), 'content-type': 'application/json' },
      body: JSON.stringify({ status, error }),
    });
  } catch (e) {
    console.warn('[api] reportStatus failed:', e.message);
  }
}

/** Upload the finished recording. `buffer` is the raw audio bytes. */
async function uploadAudio(sessionId, sessionToken, buffer, mime) {
  const res = await fetch(`${BACKEND_URL}/api/bot/sessions/${sessionId}/audio`, {
    method: 'POST',
    headers: { ...authHeaders(sessionToken), 'content-type': mime || 'audio/ogg' },
    body: buffer,
  });
  if (!res.ok) throw new Error(`uploadAudio ${res.status}`);
  return res.json();
}

module.exports = { claimJobs, reportStatus, uploadAudio, BACKEND_URL };
