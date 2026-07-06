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
