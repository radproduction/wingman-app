'use strict';

require('dotenv').config();

const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
  },

  database: {
    // Resolve relative to project root regardless of cwd
    path: path.resolve(
      __dirname,
      '..',
      process.env.DATABASE_PATH || './data/wingman.db'
    ),
  },

  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:3000',

  // Password protecting the browser-based WhatsApp pairing page (/admin/qr)
  adminPassword: process.env.ADMIN_PASSWORD || 'wingman',

  // Built dashboard (Vite) output served by Express in production
  clientDist: path.resolve(__dirname, '..', 'client', 'dist'),

  // Disable WhatsApp entirely (useful for API-only / screenshot demos)
  disableWhatsapp: process.env.DISABLE_WHATSAPP === '1',

  auth: {
    // How OTPs are delivered: 'whatsapp' (via Wingman's own number) with a dev
    // fallback that surfaces the code in the API response / logs when WhatsApp
    // is not connected. Never used in production once WhatsApp is live.
    otpTtlSeconds: parseInt(process.env.OTP_TTL_SECONDS, 10) || 300,
    sessionTtlDays: parseInt(process.env.SESSION_TTL_DAYS, 10) || 30,
    // When true, include the OTP code in the request-otp API response so the
    // web app can be tested without a live WhatsApp pairing. Defaults to true
    // in development, false in production.
    exposeOtpInDev: process.env.EXPOSE_OTP_IN_DEV
      ? process.env.EXPOSE_OTP_IN_DEV === '1'
      : (process.env.NODE_ENV !== 'production'),
  },

  // Wingman's OWN WhatsApp number (the assistant's number users message).
  // Purely informational (shown in the UI); pairing is done via /admin/qr.
  wingmanNumber: process.env.WINGMAN_NUMBER || '',

  // Contact email shown on the public Privacy Policy page (/privacy).
  privacyContactEmail: process.env.PRIVACY_CONTACT_EMAIL || 'wehearyou.studio@gmail.com',

  // WhatsApp Business Cloud API (official Meta API). When token + phoneNumberId
  // are set, Wingman uses this instead of whatsapp-web.js (no Chromium, real
  // phone numbers in webhooks, reliable on cloud hosts like Railway).
  whatsappCloud: {
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    // Shared secret we choose; must match the value entered in the Meta
    // webhook config so Meta's verification GET succeeds.
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'wingman_verify',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v25.0',
    // Approved AUTHENTICATION template used to deliver login OTPs to users who
    // are outside the 24h customer-service window (i.e. brand-new users).
    otpTemplate: process.env.OTP_TEMPLATE_NAME || 'wingman_login_otp',
    otpTemplateLang: process.env.OTP_TEMPLATE_LANG || 'en_US',
    // Deliver OTP via the approved AUTHENTICATION template. It reaches ANY user
    // (in or out of the 24h window) — required for new-user login — now that the
    // app is Live with billing configured. Set OTP_USE_TEMPLATE=0 to force text.
    otpUseTemplate: process.env.OTP_USE_TEMPLATE !== '0',
    get enabled() {
      return !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
    },
  },

  // Shopify OAuth app (Dev Dashboard). Merchants connect with one click;
  // Shopify hands back a per-store Admin API token we then store on the user.
  shopify: {
    clientId: process.env.SHOPIFY_CLIENT_ID || '',
    clientSecret: process.env.SHOPIFY_CLIENT_SECRET || '',
    scopes: process.env.SHOPIFY_SCOPES || 'read_orders,read_products,read_customers',
    apiVersion: process.env.SHOPIFY_API_VERSION || '2024-10',
    get enabled() {
      return !!(process.env.SHOPIFY_CLIENT_ID && process.env.SHOPIFY_CLIENT_SECRET);
    },
  },

  // Voice: OpenAI Whisper (speech->text) and TTS (text->speech).
  voice: {
    apiKey: process.env.OPENAI_API_KEY || '',
    sttModel: process.env.VOICE_STT_MODEL || 'whisper-1',
    // Latin script keeps Roman Urdu as Roman Urdu (see transcribe()).
    sttLanguage: process.env.VOICE_STT_LANGUAGE || 'en',
    ttsModel: process.env.VOICE_TTS_MODEL || 'gpt-4o-mini-tts',
    ttsVoice: process.env.VOICE_TTS_VOICE || 'nova',
    get enabled() { return !!process.env.OPENAI_API_KEY; },
  },

  maps: {
    apiKey: process.env.MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '',
    get enabled() { return !!(process.env.MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY); },
  },

  weather: {
    apiKey: process.env.WEATHER_API_KEY || '',
    defaultCity: process.env.WEATHER_DEFAULT_CITY || 'Dubai',
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3000/auth/google/callback',
  },

  whatsapp: {
    sessionPath: path.resolve(
      __dirname,
      '..',
      process.env.WHATSAPP_SESSION_PATH || './.wwebjs_auth'
    ),
  },
};

module.exports = config;
