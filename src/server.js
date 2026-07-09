'use strict';

const express = require('express');
const cors = require('cors');
const config = require('./config');
const { initSchema } = require('./db');
const conversations = require('./db/conversations');
const wa = require('./whatsapp/client');
const cloudApi = require('./whatsapp/cloudApi');
const engine = require('./engine/conversation');
const authRoutes = require('./auth/routes');
const otpAuthRoutes = require('./api/authRoutes');
const { attachUserOptional } = require('./api/middleware/auth');
const dashboardApi = require('./api/dashboard');
const adminQr = require('./admin/qr');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Google OAuth routes (/auth/google, /auth/google/callback)
app.use('/', authRoutes);

// Phone + OTP auth (unauthenticated: request/verify OTP, logout, me)
app.use('/api/auth', otpAuthRoutes);

// Soft auth: attach req.user when a valid session token is present, but let
// unauthenticated requests through so the rich mock dataset still serves
// investor screenshots in dev. Handlers scope to req.user when available.
app.use('/api', attachUserOptional);

// Dashboard JSON API for the mobile PWA (/api/*)
app.use('/api', dashboardApi);

// Browser-based WhatsApp pairing (/admin/qr, /admin/qr.json)
app.use('/admin', adminQr);

// ─── Health / status ────────────────────────────────────────────────
const hasClientBuild = fs.existsSync(path.join(config.clientDist, 'index.html'));

function statusPayload() {
  return {
    name: 'Wingman',
    status: 'running',
    whatsappReady: wa.ready(),
    messagesLogged: conversations.countAll(),
  };
}

app.get('/health', (req, res) => {
  res.json({ ok: true, whatsappReady: wa.ready() });
});

// ─── WhatsApp Cloud API webhook ─────────────────────────────────────
//   GET  → Meta verification handshake (hub.challenge)
//   POST → incoming messages: parse, run the engine, reply via Cloud API.
//   Meta requires a fast 200; we ack immediately and process async.
app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === config.whatsappCloud.verifyToken) {
    console.log('[webhook] verified by Meta');
    return res.status(200).send(challenge);
  }
  return res.sendStatus(403);
});

app.post('/webhook', (req, res) => {
  res.sendStatus(200); // ack immediately (Meta retries on non-200)
  (async () => {
    try {
      // Log delivery statuses (sent/delivered/read/failed) so we can see WHY a
      // template/OTP message does or doesn't arrive at the recipient.
      const entries = Array.isArray(req.body && req.body.entry) ? req.body.entry : [];
      for (const e of entries) {
        for (const ch of (e.changes || [])) {
          for (const s of ((ch.value && ch.value.statuses) || [])) {
            const err = (s.errors && s.errors[0]) || null;
            const detail = err && err.error_data && err.error_data.details ? ` / ${err.error_data.details}` : '';
            console.log(
              `[webhook:status] ${s.status} -> ${s.recipient_id}` +
              (err ? ` — ERROR ${err.code}: ${err.title || err.message}${detail}` : '')
            );
          }
        }
      }

      const messages = cloudApi.parseIncoming(req.body);
      for (const m of messages) {
        const phoneNumber = String(m.from || '').replace(/[^0-9]/g, '');
        if (!phoneNumber) continue;

        if (m.type !== 'text' || !m.text) {
          // Non-text: only reply to registered users; ignore others silently.
          continue;
        }

        console.log(`[webhook] << (${phoneNumber}): ${m.text}`);
        const { reply, ignored } = await engine.handleMessage({
          text: m.text,
          phoneNumber,
          meta: { waMessageId: m.id, provider: 'cloud', name: m.name },
        });

        // Stay silent to unregistered/unknown senders (no auto-reply spam).
        if (ignored || !reply) {
          console.log(`[webhook] -- (${phoneNumber}) [ignored, silent]`);
          continue;
        }
        await cloudApi.sendText(phoneNumber, reply);
        console.log(`[webhook] >> (${phoneNumber}): ${reply}`);
      }
    } catch (err) {
      console.error('[webhook] processing error:', err.message);
    }
  })();
});

// JSON status is always available at /api/status; when there is no built
// dashboard, the root URL also returns JSON status (dev/API-only mode).
app.get('/api/status', (req, res) => res.json(statusPayload()));
if (!hasClientBuild) {
  app.get('/', (req, res) => res.json(statusPayload()));
}

// ─── Serve the built dashboard (production) ─────────────────────────
//   In production the Vite build is emitted to client/dist and served by
//   this same Express process, so one URL hosts API + dashboard + /admin/qr.
if (hasClientBuild) {
  app.use(express.static(config.clientDist));
  console.log('[server] Serving built dashboard from', config.clientDist);
} else {
  console.log('[server] No client build found (client/dist). Dashboard served by Vite in dev.');
}

// ─── Recent conversation log (debug) ────────────────────────────────
app.get('/conversations', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 50;
  res.json(conversations.recent(limit));
});

// ─── Send a WhatsApp message via API (utility) ──────────────────────
//   POST /send  { "to": "9715xxxxxxx", "text": "Hello from Wingman" }
app.post('/send', async (req, res) => {
  const { to, text } = req.body || {};
  if (!to || !text) {
    return res.status(400).json({ error: 'Both "to" and "text" are required' });
  }
  try {
    await wa.sendMessage(to, text);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Manual proactive triggers (testing) ──────────────────────────
//   POST /trigger/:job/:userId  where job = morning|wrap|bills|deliveries|followups|taskreminder|travel|meetingprep
app.post('/trigger/:job/:userId', async (req, res) => {
  const { job, userId } = req.params;
  try {
    let out;
    switch (job) {
      case 'morning': out = await require('./services/morningBriefing').sendForUser(userId); break;
      case 'wrap': out = await require('./services/endOfDayWrap').sendForUser(userId); break;
      case 'bills': out = await require('./services/billAlerts').alertForUser(userId); break;
      case 'deliveries': out = await require('./services/deliveryAlerts').returnWindowCheck(userId); break;
      case 'followups': out = await require('./services/followupTracker').checkOverdue(userId); break;
      case 'taskreminder': out = await require('./engine/taskIntents').sendDailyReminder(userId); break;
      case 'travel': out = await require('./services/travelAssistant').alertForUser(userId); break;
      case 'meetingprep': out = await require('./services/meetingPrep').prepForUser(userId); break;
      default: return res.status(400).json({ error: 'unknown job' });
    }
    res.json({ ok: true, job, out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Recent briefings for a user (debug)
app.get('/briefings/:userId', (req, res) => {
  res.json(require('./db/briefings').listForUser(req.params.userId));
});

// ─── Privacy Policy (required to publish the Meta app / Google OAuth) ──
//   Served as plain server-rendered HTML so Meta/Google crawlers can read it
//   without running JS. Registered before the SPA fallback.
app.get(['/privacy', '/privacy-policy'], (req, res) => {
  res.type('html').send(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Wingman — Privacy Policy</title>
<style>
  body{margin:0;background:#020633;color:#e8e9f3;font:16px/1.7 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif}
  .wrap{max-width:760px;margin:0 auto;padding:40px 22px 80px}
  h1{font-size:28px;margin:0 0 4px}h2{font-size:20px;margin:34px 0 10px;color:#b7baff}
  a{color:#8b8fff}.muted{color:#9aa0c7;font-size:14px}
  ul{padding-left:20px}li{margin:6px 0}
  .card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:18px 20px;margin-top:18px}
</style></head><body><div class="wrap">
<h1>Wingman — Privacy Policy</h1>
<p class="muted">Last updated: 9 July 2026</p>

<p>Wingman is a personal AI assistant ("Wingman", "we", "us") that you interact with over WhatsApp and a companion web app. This policy explains what information we collect, how we use it, and the choices you have.</p>

<h2>1. Information We Collect</h2>
<ul>
  <li><b>Account details</b> — your name, WhatsApp phone number, timezone and working hours you provide during sign-up.</li>
  <li><b>Messages</b> — the WhatsApp messages you exchange with Wingman, so the assistant can understand and respond.</li>
  <li><b>Google data (only if you connect it)</b> — with your explicit consent, we access your Google <b>Gmail</b> and <b>Google Calendar</b> to read, summarise, draft, send email and manage events on your behalf.</li>
  <li><b>Usage data</b> — basic technical logs needed to operate and secure the service.</li>
</ul>

<h2>2. How We Use Your Information</h2>
<ul>
  <li>To provide the assistant's features: calendar, email, tasks, reminders, bills, deliveries, travel and briefings.</li>
  <li>To send you your login verification codes and the notifications you ask for.</li>
  <li>To operate, maintain and improve the reliability and security of the service.</li>
</ul>
<p>We do <b>not</b> sell your personal data, and we do <b>not</b> use your Google data for advertising.</p>

<h2>3. Google User Data</h2>
<p>Wingman's use of information received from Google APIs adheres to the
<a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener">Google API Services User Data Policy</a>, including the Limited Use requirements. Google data is used only to provide user-facing features you request, is never sold, and is not used for advertising or transferred to others except as needed to provide the service, comply with law, or with your consent. You can disconnect Google access at any time from Settings.</p>

<h2>4. Third-Party Services</h2>
<ul>
  <li><b>Meta / WhatsApp</b> — message delivery over the WhatsApp Business Platform.</li>
  <li><b>Google</b> — Gmail and Calendar access when you connect your account.</li>
  <li><b>Anthropic (Claude)</b> — to generate the assistant's responses. Message content is processed to produce replies and is not used to train models.</li>
</ul>

<h2>5. Data Retention &amp; Deletion</h2>
<p>We keep your data only as long as your account is active or as needed to provide the service. You can request deletion of your account and associated data at any time by contacting us (below) or by messaging "delete my data" to Wingman on WhatsApp. Disconnecting Google removes our stored Google tokens.</p>

<h2>6. Security</h2>
<p>We use industry-standard measures to protect your data in transit and at rest. Access tokens are stored securely and are never shared publicly.</p>

<h2>7. Children</h2>
<p>Wingman is not intended for anyone under 16. We do not knowingly collect data from children.</p>

<h2>8. Changes</h2>
<p>We may update this policy from time to time. Material changes will be reflected by the "Last updated" date above.</p>

<div class="card">
<h2 style="margin-top:0">9. Contact</h2>
<p>Questions or data requests? Reach us at:<br>
<b>Email:</b> <a href="mailto:${config.privacyContactEmail}">${config.privacyContactEmail}</a><br>
<b>WhatsApp:</b> +${(config.wingmanNumber || '').replace(/[^0-9]/g, '')}</p>
</div>

</div></body></html>`);
});

// ─── SPA fallback (production) ───────────────────────────────
//   Any GET that is not an API / admin / auth / static-asset route serves
//   the dashboard shell so client-side routing (e.g. /tasks) works on reload.
//   Registered LAST, and written as middleware to stay Express-5 compatible.
if (hasClientBuild) {
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    const p = req.path;
    if (
      p.startsWith('/api') ||
      p.startsWith('/admin') ||
      p.startsWith('/auth') ||
      p === '/health' ||
      p.startsWith('/conversations') ||
      p.startsWith('/send') ||
      p.startsWith('/trigger') ||
      p.startsWith('/briefings') ||
      p.startsWith('/webhook') ||
      p.startsWith('/assets') ||
      p.includes('.') // static files (js/css/svg/png/webmanifest…)
    ) {
      return next();
    }
    res.sendFile(path.join(config.clientDist, 'index.html'));
  });
}

// ─── Crash guards ───────────────────────────────────────────────────
//   whatsapp-web.js / LocalAuth can throw async errors on LOGOUT (e.g. an
//   EBUSY file lock while cleaning the session on Windows). Those must not
//   take down the whole server (API + dashboard + schedulers).
process.on('unhandledRejection', (reason) => {
  console.error('[server] unhandledRejection (ignored):', reason && reason.message ? reason.message : reason);
});
process.on('uncaughtException', (err) => {
  console.error('[server] uncaughtException (ignored):', err && err.message ? err.message : err);
});

// ─── Bootstrap ──────────────────────────────────────────────────────
function start() {
  // 1) Initialize database schema
  initSchema();

  // 2) Initialize WhatsApp client (prints QR to terminal + serves it at /admin/qr)
  if (config.disableWhatsapp) {
    console.log('[server] DISABLE_WHATSAPP=1 — skipping WhatsApp init (API/dashboard only).');
  } else {
    wa.initWhatsApp();
  }

  // 2b) Start the email scanner cron (every 15 minutes)
  try {
    require('./services/emailScanner').startCron();
  } catch (e) {
    console.warn('[server] could not start email scanner cron:', e.message);
  }

  // 2c) Start the central proactive scheduler (briefings, wraps, alerts)
  try {
    require('./services/scheduler').init();
  } catch (e) {
    console.warn('[server] could not start scheduler:', e.message);
  }

  // 3) Start HTTP server
  app.listen(config.port, () => {
    console.log(`[server] Wingman HTTP API listening on port ${config.port}`);
  });
}

start();

module.exports = app;
