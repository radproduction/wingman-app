'use strict';

/**
 * ONE-TIME login helper. Signs the bot into a Google account and saves the
 * session to google-state.json, which the worker then loads (STORAGE_STATE) so
 * it joins meetings as a signed-in user — anonymous knocks get blocked by
 * Google's automation detection, signed-in ones don't.
 *
 * Run this on a machine WITH a screen (your PC), NOT the droplet:
 *
 *   cd bot-worker
 *   npm install
 *   node login.js
 *
 * A Chrome window opens. Log into the BOT's Google account (name it
 * "Wingman Notetaker" so it shows nicely in calls). When you're fully signed in
 * (you can see Gmail / your account), come back to this terminal and press ENTER.
 * It writes google-state.json next to this file.
 */

const { chromium } = require('playwright');
const readline = require('readline');

(async () => {
  const browser = await chromium.launch({
    headless: false,
    channel: 'chrome', // real installed Chrome — Google rarely blocks sign-in here
    ignoreDefaultArgs: ['--enable-automation'],
    args: ['--disable-blink-features=AutomationControlled', '--start-maximized'],
  });
  const context = await browser.newContext({ viewport: null });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
  });
  const page = await context.newPage();
  await page.goto('https://accounts.google.com/');

  console.log('\n──────────────────────────────────────────────────────────');
  console.log(' Chrome khul gaya. BOT ke Google account me LOG IN karo.');
  console.log(' (Account ka naam "Wingman Notetaker" rakhna behtar hai.)');
  console.log('');
  console.log(' Jab poori tarah sign-in ho jao (Gmail/account dikhe),');
  console.log(' is terminal me wapas aa kar ENTER dabao.');
  console.log('──────────────────────────────────────────────────────────\n');

  await new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question('Sign-in complete? Press ENTER to save… ', () => { rl.close(); resolve(); });
  });

  await context.storageState({ path: 'google-state.json' });
  console.log('\n✅ Saved google-state.json (isay droplet pe le jana hai — steps neeche).');
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error('login helper failed:', e); process.exit(1); });
