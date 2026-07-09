'use strict';

const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const config = require('../config');
const conversations = require('../db/conversations');
const users = require('../db/users');
const engine = require('../engine/conversation');
const cloudApi = require('./cloudApi');

let client = null;
let isReady = false;
let latestQr = null;         // most recent QR string (null once authenticated)
let lastQrAt = null;         // timestamp of the latest QR

/**
 * Normalize a phone number / chat id into a WhatsApp chat id (xxxx@c.us).
 * Accepts:
 *   - "971501234567"      -> "971501234567@c.us"
 *   - "+971 50 123 4567"  -> "971501234567@c.us"
 *   - "971...@c.us"       -> unchanged
 */
function toChatId(phoneNumber) {
  if (!phoneNumber) throw new Error('phoneNumber is required');
  const raw = String(phoneNumber).trim();
  if (raw.includes('@')) return raw; // already a chat/group id
  const digits = raw.replace(/[^0-9]/g, '');
  return `${digits}@c.us`;
}

/**
 * Initialize the WhatsApp client with LocalAuth (persistent session).
 * Wires up qr / ready / message events.
 *
 * @returns {import('whatsapp-web.js').Client}
 */
function initWhatsApp() {
  // When the official Cloud API is configured, we do NOT launch Chromium at
  // all — incoming messages arrive via the /webhook endpoint and outgoing
  // messages go through the Graph API. This is the reliable cloud path.
  if (cloudApi.ready()) {
    console.log('[whatsapp] Using WhatsApp Cloud API (Graph API) — Chromium disabled.');
    return null;
  }

  if (client) return client;

  client = new Client({
    authStrategy: new LocalAuth({
      dataPath: config.whatsapp.sessionPath,
    }),
    // Pin the WhatsApp Web version to a known-good build. whatsapp-web.js
    // otherwise loads whatever web.whatsapp.com serves, which can drift out of
    // sync and cause "Couldn't link device" on pairing. Override via WA_WEB_VERSION.
    webVersionCache: {
      type: 'remote',
      remotePath: `https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/${process.env.WA_WEB_VERSION || '2.3000.1042641488-alpha'}.html`,
    },
    puppeteer: {
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process',            // launch Chromium in one process (low-memory containers)
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-extensions',
      ],
    },
  });

  // 1) QR event -> render in terminal AND cache for the web /admin/qr page
  client.on('qr', (qr) => {
    latestQr = qr;
    lastQrAt = Date.now();
    console.log('\n[whatsapp] Scan this QR code with your phone (WhatsApp > Linked Devices):\n');
    qrcode.generate(qr, { small: true });
  });

  client.on('authenticated', () => {
    latestQr = null; // consumed
    console.log('[whatsapp] Authenticated. Session saved locally.');
  });

  client.on('auth_failure', (msg) => {
    console.error('[whatsapp] Authentication failure:', msg);
  });

  // 2) Ready event
  client.on('ready', () => {
    isReady = true;
    latestQr = null;
    console.log('Wingman is online!');
  });

  client.on('disconnected', (reason) => {
    isReady = false;
    console.warn('[whatsapp] Client disconnected:', reason);
  });

  // 3) Message event -> hand off to the Claude conversation engine.
  //    The engine persists BOTH the inbound user message and the assistant
  //    reply, so we send the reply via sendRaw() to avoid double-logging.
  client.on('message', async (message) => {
    let registered = false;
    try {
      // Ignore status broadcasts, group chats, and our own messages
      if (message.from === 'status@broadcast') return;
      if (message.fromMe) return;
      if (message.from && message.from.endsWith('@g.us')) return; // groups

      // Resolve the REAL phone number. Newer WhatsApp uses opaque @lid ids in
      // message.from, so split('@')[0] gives a LID, not the phone. getContact()
      // resolves the actual number so registered users are matched correctly.
      let phoneNumber = (message.from || '').split('@')[0];
      try {
        const contact = await message.getContact();
        if (contact && contact.number) {
          phoneNumber = String(contact.number).replace(/[^0-9]/g, '');
        }
      } catch (_) { /* fall back to the raw id */ }

      // Separate-number gating: only registered + onboarded users get service.
      const user = users.getByPhone(phoneNumber);
      registered = user && users.isOnboarded(user);

      if (message.type && message.type !== 'chat') {
        // Non-text messages (media, etc.). Only acknowledge for registered
        // users; unknown numbers are bounced by the engine below.
        if (registered) {
          await sendRaw(message.from, "I can only read text messages for now \uD83D\uDE4F");
          return;
        }
      }

      console.log(`[whatsapp] << (${phoneNumber})${registered ? '' : ' [unregistered]'}: ${message.body}`);

      // Delegate to the intelligent engine. It responds ONLY to registered +
      // onboarded users; unknown numbers get a one-line bounce (ignored:true)
      // and nothing is logged as conversation history.
      const { reply, ignored } = await engine.handleMessage({
        text: message.body || '',
        phoneNumber,
        meta: {
          chatId: message.from,
          waMessageId: message.id ? message.id._serialized : null,
        },
      });

      // IMPORTANT: stay completely SILENT to unregistered/unknown senders so
      // Wingman never auto-replies to the owner's normal WhatsApp contacts.
      // Only registered + onboarded users (the account owner) get responses.
      if (ignored || !registered) {
        console.log(`[whatsapp] -- (${phoneNumber}) [ignored, silent]`);
        return;
      }

      // Send the engine's reply WITHOUT re-logging (engine already logged it).
      await sendRaw(message.from, reply);
      console.log(`[whatsapp] >> (${phoneNumber}): ${reply}`);
    } catch (err) {
      console.error('[whatsapp] Error handling message:', err);
      // Only apologize to a registered user; never message unknown contacts.
      if (registered) {
        try {
          await sendRaw(message.from, "Sorry, I hit a snag processing that \u2014 mind trying again? \uD83D\uDE05");
        } catch (_) {}
      }
    }
  });

  client.initialize();
  return client;
}

/**
 * Send a WhatsApp message to any number / chat id, and log it as outbound.
 *
 * @param {string} phoneNumber  E.164 digits or full chat id (xxxx@c.us)
 * @param {string} text         message body
 * @returns {Promise<Object>} the sent message
 */
async function sendMessage(phoneNumber, text) {
  // Cloud API path (official Graph API) — used in production.
  if (cloudApi.ready()) {
    const digits = String(phoneNumber).replace(/[^0-9]/g, '');
    const sent = await cloudApi.sendText(digits, text);
    conversations.logOutbound({
      waMessageId: sent && sent.messages && sent.messages[0] ? sent.messages[0].id : null,
      chatId: `${digits}@c.us`,
      phoneNumber: digits,
      content: text,
      mediaType: 'text',
    });
    console.log(`[whatsapp:cloud] >> (${digits}): ${text}`);
    return sent;
  }

  if (!client) throw new Error('WhatsApp client not initialized');
  if (!isReady) throw new Error('WhatsApp client not ready yet');

  const chatId = toChatId(phoneNumber);
  const sent = await client.sendMessage(chatId, text);

  conversations.logOutbound({
    waMessageId: sent && sent.id ? sent.id._serialized : null,
    chatId,
    phoneNumber: chatId.split('@')[0],
    content: text,
    mediaType: 'text',
  });

  console.log(`[whatsapp] >> (${chatId.split('@')[0]}): ${text}`);
  return sent;
}

/**
 * Deliver a login OTP. Over the Cloud API a plain text message only reaches
 * users inside the 24h window, so brand-new users would never get their code.
 * We therefore send it through the approved AUTHENTICATION template (works for
 * any user, any time). Falls back to plain text when the Cloud API isn't used.
 *
 * @param {string} phoneNumber  recipient digits (E.164 without '+')
 * @param {string} code         the 6-digit OTP
 * @returns {Promise<boolean>}  true if the send was accepted
 */
async function sendOtp(phoneNumber, code) {
  const digits = String(phoneNumber).replace(/[^0-9]/g, '');
  const text =
    `${code} is your Wingman verification code. ` +
    `It expires in 5 minutes. Do not share it with anyone.`;

  if (cloudApi.ready()) {
    // NOTE: the approved AUTHENTICATION template (config.whatsappCloud.otpTemplate)
    // is *accepted* by the API but delivery is unreliable while the Meta app is
    // unpublished (business-initiated template messages are suppressed). Plain
    // text delivers reliably to any user inside the 24h window, which is the
    // real login case. Switch back to the template once the app is Live.
    if (config.whatsappCloud.otpUseTemplate) {
      const components = [
        { type: 'body', parameters: [{ type: 'text', text: code }] },
        { type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: code }] },
      ];
      await cloudApi.sendTemplate(
        digits,
        config.whatsappCloud.otpTemplate,
        config.whatsappCloud.otpTemplateLang,
        components,
      );
      console.log(`[whatsapp:cloud] >> OTP template to ${digits}`);
      return true;
    }
    await cloudApi.sendText(digits, text);
    console.log(`[whatsapp:cloud] >> OTP text to ${digits}`);
    return true;
  }
  // whatsapp-web.js path (dev): plain text is fine.
  await sendMessage(digits, text);
  return true;
}

/**
 * Send a WhatsApp message WITHOUT logging it to the conversations table.
 * Used when the caller (e.g. the conversation engine) has already logged
 * the outbound message itself.
 */
async function sendRaw(phoneNumber, text) {
  if (cloudApi.ready()) {
    return cloudApi.sendText(String(phoneNumber).replace(/[^0-9]/g, ''), text);
  }
  if (!client) throw new Error('WhatsApp client not initialized');
  if (!isReady) throw new Error('WhatsApp client not ready yet');
  const chatId = toChatId(phoneNumber);
  return client.sendMessage(chatId, text);
}

/**
 * Request an 8-character pairing code for "Link with phone number instead".
 * `phone` is the number being linked (Wingman's own number), digits only,
 * international format (e.g. 923001234567). More reliable than QR when the
 * QR handshake fails with "couldn't link device".
 */
async function requestPairingCode(phone) {
  if (!client) throw new Error('WhatsApp client not initialized');
  const digits = String(phone || '').replace(/[^0-9]/g, '');
  if (digits.length < 8) throw new Error('valid international phone required (digits only)');
  // The client must be at the pairing screen (a QR must have been emitted).
  return client.requestPairingCode(digits);
}

function getClient() {
  return client;
}

function ready() {
  // Cloud API is always "ready" once configured (no pairing needed).
  if (cloudApi.ready()) return true;
  return isReady;
}

/** Latest QR string awaiting scan (or null if none / already authenticated). */
function getLatestQr() {
  return latestQr;
}

/** Connection status snapshot for the admin page. */
function status() {
  if (cloudApi.ready()) {
    return { ready: true, hasQr: false, lastQrAt: null, disabled: false, provider: 'cloud' };
  }
  return {
    ready: isReady,
    hasQr: !!latestQr,
    lastQrAt,
    disabled: process.env.DISABLE_WHATSAPP === '1',
    provider: 'web',
  };
}

module.exports = {
  initWhatsApp, sendMessage, sendRaw, sendOtp, getClient, ready, toChatId,
  getLatestQr, status, requestPairingCode,
};
