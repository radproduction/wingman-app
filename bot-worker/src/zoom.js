'use strict';

/**
 * Zoom web-client join (EXPERIMENTAL).
 *
 * Zoom pushes hard toward its desktop app and its web client layout changes
 * often; treat this as a starting point that needs tuning on a real Zoom link.
 * The shape mirrors meet.js so worker.js can treat them interchangeably.
 *
 * Strategy: rewrite a normal join link (zoom.us/j/<id>) to the web client
 * (zoom.us/wc/join/<id>), click "Join from your browser" if shown, type the
 * bot's name, mute, and join — then wait for the host to admit from the
 * waiting room.
 */

const clickFirst = async (page, selectors, { timeout = 4000 } = {}) => {
  for (const sel of selectors) {
    try {
      const loc = page.locator(sel).first();
      await loc.waitFor({ state: 'visible', timeout });
      await loc.click({ timeout: 3000 });
      return true;
    } catch (_) { /* next */ }
  }
  return false;
};

function toWebClientUrl(url) {
  // https://xxx.zoom.us/j/123?pwd=abc → https://xxx.zoom.us/wc/join/123?pwd=abc
  try {
    const m = url.match(/^(https:\/\/[^/]*zoom\.us)\/(?:j|w|my)\/([^/?]+)(\?.*)?$/i);
    if (m) return `${m[1]}/wc/join/${m[2]}${m[3] || ''}`;
  } catch (_) { /* ignore */ }
  return url;
}

async function joinZoom(page, { url, botName, admitTimeoutMs = 300000, onStatus = () => {} }) {
  const webUrl = toWebClientUrl(url);
  console.log('[zoom] opening', webUrl);
  await page.goto(webUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

  await clickFirst(page, [
    'a:has-text("Join from your browser")',
    'text=Join from Your Browser',
    'button:has-text("Join from your browser")',
  ], { timeout: 8000 });

  // Accept cookie / terms if present.
  await clickFirst(page, ['button:has-text("Accept")', 'button:has-text("I Agree")', 'button:has-text("Agree")'], { timeout: 3000 });

  // Name field (Zoom uses #input-for-name or an aria-labelled input).
  try {
    const nameField = page.locator('#input-for-name, input[placeholder*="name" i], input[aria-label*="name" i]').first();
    await nameField.waitFor({ state: 'visible', timeout: 10000 });
    await nameField.fill(botName);
    console.log('[zoom] entered name:', botName);
  } catch (_) {
    console.log('[zoom] no name field found');
  }

  onStatus('waiting');
  await clickFirst(page, ['button:has-text("Join")', '#joinBtn', 'button:has-text("Join Audio by Computer")'], { timeout: 8000 });

  // Mute mic once in.
  await clickFirst(page, ['button[aria-label*="Mute" i]', 'text=Mute'], { timeout: 5000 });

  const admitted = await waitForInCall(page, admitTimeoutMs);
  if (!admitted) throw new Error('NOT_ADMITTED_TIMEOUT');
  console.log('[zoom] admitted — in the call');
  return true;
}

async function waitForInCall(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const selectors = [
    'button[aria-label*="Leave" i]',
    'button:has-text("Leave")',
    'text=Participants',
    'button[aria-label*="mute my microphone" i]',
  ];
  while (Date.now() < deadline) {
    for (const sel of selectors) {
      try { if (await page.locator(sel).first().isVisible()) return true; } catch (_) {}
    }
    await page.waitForTimeout(2500);
  }
  return false;
}

async function waitForMeetingEnd(page, { maxMs }) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    try {
      const ended = await page.locator('text=/this meeting has been ended|you have left|meeting is ended/i').first().isVisible();
      if (ended) return 'ended';
    } catch (_) {}
    let leaveVisible = false;
    try { leaveVisible = await page.locator('button[aria-label*="Leave" i], button:has-text("Leave")').first().isVisible(); } catch (_) {}
    if (!leaveVisible) {
      await page.waitForTimeout(3000);
      try { leaveVisible = await page.locator('button[aria-label*="Leave" i], button:has-text("Leave")').first().isVisible(); } catch (_) {}
      if (!leaveVisible) return 'ended';
    }
    await page.waitForTimeout(5000);
  }
  return 'maxDuration';
}

async function leaveZoom(page) {
  await clickFirst(page, ['button[aria-label*="Leave" i]', 'button:has-text("Leave")'], { timeout: 3000 });
  await clickFirst(page, ['button:has-text("Leave Meeting")'], { timeout: 3000 });
}

module.exports = { joinZoom, waitForMeetingEnd, leaveZoom };
