'use strict';

/**
 * WhatsApp Business Cloud API (official Meta Graph API) integration.
 *
 * This replaces whatsapp-web.js when WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID
 * are configured. Benefits: no Chromium/Puppeteer, works on any cloud host,
 * and incoming messages carry the sender's REAL phone number (no @lid), so
 * users who register in the web app by phone are matched automatically.
 *
 * Docs: https://developers.facebook.com/docs/whatsapp/cloud-api
 */

const config = require('../config');

/** Is Cloud API configured (token + phone number id present)? */
function ready() {
  return config.whatsappCloud.enabled;
}

function endpoint() {
  const { apiVersion, phoneNumberId } = config.whatsappCloud;
  return `https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`;
}

function digitsOnly(to) {
  return String(to || '').replace(/[^0-9]/g, '');
}

/**
 * Send a plain text WhatsApp message. Works for any user who has messaged the
 * business number within the last 24h (Meta's customer-service window). For
 * business-initiated messages outside that window, use sendTemplate().
 *
 * @param {string} to    recipient phone (digits, international)
 * @param {string} text  message body
 */
async function sendText(to, text) {
  const body = {
    messaging_product: 'whatsapp',
    to: digitsOnly(to),
    type: 'text',
    text: { preview_url: false, body: String(text || '').slice(0, 4096) },
  };
  return post(body);
}

/**
 * Send a pre-approved template message (needed for business-initiated / first
 * contact / outside the 24h window — e.g. OTP or proactive briefings once the
 * corresponding templates are approved in the Meta dashboard).
 *
 * @param {string} to
 * @param {string} name        template name
 * @param {string} [lang]      language code (e.g. 'en_US')
 * @param {Array}  [components] template components (variables), optional
 */
async function sendTemplate(to, name, lang = 'en_US', components) {
  const template = { name, language: { code: lang } };
  if (components) template.components = components;
  const body = {
    messaging_product: 'whatsapp',
    to: digitsOnly(to),
    type: 'template',
    template,
  };
  return post(body);
}

/**
 * Download a media file (e.g. a voice note) the user sent us. WhatsApp gives a
 * media id; that resolves to a short-lived URL which itself needs the token.
 *
 * @param {string} mediaId
 * @returns {Promise<{buffer:Buffer, mimeType:string}>}
 */
async function downloadMedia(mediaId) {
  if (!ready()) throw new Error('WhatsApp Cloud API not configured');
  const token = config.whatsappCloud.token;
  const base = `https://graph.facebook.com/${config.whatsappCloud.apiVersion}`;

  const metaRes = await fetch(`${base}/${mediaId}`, { headers: { Authorization: `Bearer ${token}` } });
  const meta = await metaRes.json().catch(() => ({}));
  if (!metaRes.ok || !meta.url) {
    throw new Error(`media lookup failed: ${(meta.error && meta.error.message) || metaRes.status}`);
  }

  const fileRes = await fetch(meta.url, { headers: { Authorization: `Bearer ${token}` } });
  if (!fileRes.ok) throw new Error(`media download failed: HTTP ${fileRes.status}`);
  return {
    buffer: Buffer.from(await fileRes.arrayBuffer()),
    mimeType: meta.mime_type || 'audio/ogg',
  };
}

/** Upload a file to WhatsApp and get back a media id we can send. */
async function uploadMedia(buffer, { mimeType = 'audio/ogg', filename = 'reply.ogg' } = {}) {
  if (!ready()) throw new Error('WhatsApp Cloud API not configured');
  const form = new FormData();
  form.append('messaging_product', 'whatsapp');
  form.append('type', mimeType);
  form.append('file', new Blob([buffer], { type: mimeType }), filename);

  const res = await fetch(
    `https://graph.facebook.com/${config.whatsappCloud.apiVersion}/${config.whatsappCloud.phoneNumberId}/media`,
    { method: 'POST', headers: { Authorization: `Bearer ${config.whatsappCloud.token}` }, body: form },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.id) {
    throw new Error(`media upload failed: ${(data.error && data.error.message) || res.status}`);
  }
  return data.id;
}

/** Send an audio reply as a WhatsApp voice note. */
async function sendAudio(to, buffer, { mimeType = 'audio/ogg' } = {}) {
  const mediaId = await uploadMedia(buffer, { mimeType });
  return post({
    messaging_product: 'whatsapp',
    to: digitsOnly(to),
    type: 'audio',
    audio: { id: mediaId },
  });
}

async function post(body) {
  if (!ready()) throw new Error('WhatsApp Cloud API not configured');
  const res = await fetch(endpoint(), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.whatsappCloud.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && data.error && data.error.message) || `HTTP ${res.status}`;
    throw new Error(`WhatsApp Cloud send failed: ${msg}`);
  }
  return data;
}

/**
 * Parse an incoming webhook POST body into a flat list of normalized messages.
 * Only text messages carry a body; other types are surfaced with type set so
 * the handler can respond appropriately.
 *
 * @param {Object} body  the webhook JSON (req.body)
 * @returns {Array<{from:string, text:string, id:string, type:string, name?:string}>}
 */
function parseIncoming(body) {
  const out = [];
  if (!body || !Array.isArray(body.entry)) return out;
  for (const entry of body.entry) {
    for (const change of (entry.changes || [])) {
      const value = change.value || {};
      const contacts = value.contacts || [];
      const name = contacts[0] && contacts[0].profile && contacts[0].profile.name;
      for (const m of (value.messages || [])) {
        const base = { from: m.from, id: m.id, type: m.type, name };
        if (m.type === 'text') {
          out.push({ ...base, text: (m.text && m.text.body) || '' });
        } else if (m.type === 'interactive') {
          // Button / list replies
          const ir = m.interactive || {};
          const title = (ir.button_reply && ir.button_reply.title) ||
                        (ir.list_reply && ir.list_reply.title) || '';
          out.push({ ...base, text: title });
        } else if (m.type === 'audio' || m.type === 'voice') {
          // Voice note: carry the media id so the handler can fetch + transcribe it.
          const a = m.audio || m.voice || {};
          out.push({ ...base, audio: { id: a.id, mimeType: a.mime_type || 'audio/ogg', voice: !!a.voice }, text: '' });
        } else if (m.type === 'document') {
          const d = m.document || {};
          out.push({
            ...base,
            document: {
              id: d.id,
              mimeType: d.mime_type || 'application/octet-stream',
              filename: d.filename || 'attachment',
            },
            text: d.caption || '',
          });
        } else if (m.type === 'location') {
          // A shared location pin. Surface it as text (with the coordinates the
          // maps tools need) so the assistant can route to it like any address.
          const loc = m.location || {};
          const label = [loc.name, loc.address].filter(Boolean).join(', ');
          const coords = (loc.latitude != null && loc.longitude != null)
            ? `${loc.latitude},${loc.longitude}`
            : '';
          out.push({
            ...base,
            location: { latitude: loc.latitude, longitude: loc.longitude, name: loc.name || null, address: loc.address || null },
            text: `[Shared location]${label ? ` ${label}` : ''}${coords ? ` (coordinates: ${coords})` : ''}`,
          });
        } else {
          out.push({ ...base, text: '' });
        }
      }
    }
  }
  return out;
}

module.exports = { ready, sendText, sendTemplate, sendAudio, downloadMedia, uploadMedia, parseIncoming };
