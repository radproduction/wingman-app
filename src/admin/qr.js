'use strict';

/**
 * Browser-based WhatsApp pairing.
 *
 * Because whatsapp-web.js normally prints the QR to the server terminal, that
 * is useless once Wingman is deployed to a headless host (Railway). This router
 * exposes the same QR as an image in the browser so you can pair from your
 * phone: open /admin/qr?key=<ADMIN_PASSWORD>, scan with WhatsApp > Linked
 * Devices. The page polls /admin/qr.json and swaps to a success state once the
 * client reports "ready".
 */

const express = require('express');
const QRCode = require('qrcode');
const config = require('../config');
const wa = require('../whatsapp/client');

const router = express.Router();

function authorized(req) {
  const key = req.query.key || req.headers['x-admin-key'];
  return key && String(key) === String(config.adminPassword);
}

// JSON status + QR data URL (polled by the page)
router.get('/qr.json', async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  const st = wa.status();
  let qrDataUrl = null;
  const qr = wa.getLatestQr();
  if (qr && !st.ready) {
    try {
      qrDataUrl = await QRCode.toDataURL(qr, { margin: 1, width: 320 });
    } catch (_) { /* ignore */ }
  }
  res.json({ ...st, qr: qrDataUrl });
});

// Pairing code (alternative to QR): "Link with phone number instead".
//   GET /admin/pair?key=<ADMIN_PASSWORD>&phone=<international digits>
router.get('/pair', async (req, res) => {
  if (!authorized(req)) return res.status(401).json({ error: 'unauthorized' });
  const phone = String(req.query.phone || '').replace(/[^0-9]/g, '');
  if (!phone || phone.length < 8) {
    return res.status(400).json({ error: 'valid international phone required, e.g. phone=923001234567' });
  }
  const st = wa.status();
  if (st.ready) return res.json({ ok: true, alreadyLinked: true });
  try {
    const code = await wa.requestPairingCode(phone);
    res.json({ ok: true, phone, code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// The pairing page
router.get('/qr', (req, res) => {
  if (!authorized(req)) {
    return res
      .status(401)
      .type('html')
      .send(loginPage());
  }
  res.type('html').send(pairPage(String(req.query.key)));
});

function loginPage() {
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Wingman · Admin</title>
<style>${STYLE}</style></head>
<body><div class="card">
<img class="logo" src="/wingman.svg" alt="Wingman" onerror="this.style.display='none'"/>
<h1>Wingman Admin</h1>
<p class="muted">Enter the admin key to pair WhatsApp.</p>
<form onsubmit="location.href='/admin/qr?key='+encodeURIComponent(document.getElementById('k').value);return false;">
<input id="k" type="password" placeholder="Admin key" autofocus />
<button type="submit">Continue</button>
</form></div></body></html>`;
}

function pairPage(key) {
  const safeKey = JSON.stringify(key);
  return `<!doctype html><html><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Wingman · Pair WhatsApp</title>
<style>${STYLE}</style></head>
<body><div class="card">
<img class="logo" src="/wingman.svg" alt="Wingman" onerror="this.style.display='none'"/>
<h1>Pair WhatsApp</h1>
<p class="muted" id="hint">Open WhatsApp on your phone → <b>Linked Devices</b> → <b>Link a Device</b>, then scan below.</p>
<div id="stage">
  <div class="qrbox"><div class="spinner"></div></div>
</div>
<p class="status" id="status">Waiting for QR…</p>
</div>
<script>
const KEY = ${safeKey};
const stage = document.getElementById('stage');
const statusEl = document.getElementById('status');
const hintEl = document.getElementById('hint');
async function poll(){
  try{
    const r = await fetch('/admin/qr.json?key='+encodeURIComponent(KEY));
    if(r.status===401){ statusEl.textContent='Unauthorized. Check the admin key.'; return; }
    const d = await r.json();
    if(d.disabled){ statusEl.textContent='WhatsApp is disabled on this server (DISABLE_WHATSAPP=1).'; return; }
    if(d.ready){
      stage.innerHTML='<div class="ok">✓</div>';
      statusEl.textContent='Wingman is online! You can close this page.';
      hintEl.textContent='Your WhatsApp is linked. Message yourself or a contact to try it.';
      return; // stop polling
    }
    if(d.qr){
      stage.innerHTML='<div class="qrbox"><img src="'+d.qr+'" width="280" height="280" alt="QR"/></div>';
      statusEl.textContent='Scan this QR with WhatsApp. It refreshes automatically.';
    } else {
      statusEl.textContent='Preparing QR… (this can take ~10s on first boot)';
    }
  }catch(e){ statusEl.textContent='Connection error, retrying…'; }
  setTimeout(poll, 2500);
}
poll();
</script>
</body></html>`;
}

const STYLE = `
:root{--bg:#020633;--card:#0a1050;--accent:#8b8fff;--text:#fff;--muted:#8e9ab0;--ok:#66ff88}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:var(--bg);color:var(--text);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;padding:20px}
.card{background:var(--card);border:1px solid rgba(255,255,255,.08);border-radius:16px;padding:28px 24px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.4)}
.logo{width:56px;height:56px;border-radius:14px;margin-bottom:8px}
h1{font-size:22px;margin:6px 0 6px}
.muted{color:var(--muted);font-size:14px;line-height:1.5;margin:0 0 18px}
input{width:100%;padding:12px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:#020633;color:#fff;font-size:16px;margin-bottom:12px}
button{width:100%;padding:12px 14px;border:0;border-radius:10px;background:var(--accent);color:#020633;font-weight:700;font-size:16px;cursor:pointer}
.qrbox{background:#fff;border-radius:12px;width:300px;height:300px;display:flex;align-items:center;justify-content:center;margin:6px auto 4px}
.qrbox img{border-radius:6px}
.spinner{width:36px;height:36px;border:4px solid rgba(2,6,51,.2);border-top-color:#020633;border-radius:50%;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.ok{width:300px;height:180px;display:flex;align-items:center;justify-content:center;color:var(--ok);font-size:80px;margin:0 auto}
.status{color:var(--muted);font-size:13px;margin-top:12px;min-height:18px}
`;

module.exports = router;
