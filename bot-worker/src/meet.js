'use strict';

/**
 * Google Meet join flow for a guest (unauthenticated) bot.
 *
 * The bot lands on the Meet URL, turns its camera + mic OFF, types its name,
 * and clicks "Ask to join" — then waits in the lobby until the host admits it
 * (exactly the "admit the notetaker" step the user described). Once in the call
 * it stays until the meeting ends, then leaves.
 *
 * ⚠️ Meet's DOM has no stable API and changes over time. The selectors below use
 * several fallbacks and are the ONE thing that needs a quick tuning pass against
 * a real meeting on the host. Every step logs what it did so tuning is easy.
 *
 * NOTE: many corporate Meet meetings block anonymous guests entirely (they force
 * a Google sign-in). For those, the bot account must be signed in first — see
 * README ("Signed-in bot account"). Guest join works when the host allows
 * external participants.
 */

const clickFirst = async (page, selectors, { timeout = 4000 } = {}) => {
  for (const sel of selectors) {
    try {
      const loc = typeof sel === 'function' ? sel(page) : page.locator(sel);
      await loc.first().waitFor({ state: 'visible', timeout });
      await loc.first().click({ timeout: 3000 });
      return true;
    } catch (_) { /* try next */ }
  }
  return false;
};

/** Turn off cam + mic on the green room, best-effort (they may already be off). */
async function muteSelfAndCam(page) {
  // Meet uses aria-labels like "Turn off microphone (⌘ + d)".
  await clickFirst(page, [
    'button[aria-label*="Turn off microphone" i]',
    'div[role="button"][aria-label*="Turn off microphone" i]',
  ], { timeout: 3000 });
  await clickFirst(page, [
    'button[aria-label*="Turn off camera" i]',
    'div[role="button"][aria-label*="Turn off camera" i]',
  ], { timeout: 3000 });
}

/**
 * Join the meeting. Resolves once the bot is admitted and in the call.
 * Rejects if it never gets admitted within `admitTimeoutMs`.
 */
async function joinMeet(page, { url, botName, admitTimeoutMs = 300000, onStatus = () => {} }) {
  console.log('[meet] opening', url);
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });

  // Dismiss cookie / "dismiss" banners that sometimes cover the controls.
  await clickFirst(page, [
    'button:has-text("Dismiss")',
    'button:has-text("Got it")',
    'button[aria-label="Close"]',
  ], { timeout: 3000 });

  // Type the guest name if Meet asks "What's your name?".
  try {
    const nameField = page.locator('input[placeholder*="name" i], input[aria-label*="name" i]').first();
    await nameField.waitFor({ state: 'visible', timeout: 8000 });
    await nameField.fill(botName);
    console.log('[meet] entered guest name:', botName);
  } catch (_) {
    console.log('[meet] no guest name field (maybe signed in or different layout)');
  }

  await muteSelfAndCam(page);

  onStatus('waiting');
  const clicked = await clickFirst(page, [
    'button:has-text("Ask to join")',
    'button:has-text("Join now")',
    'span:has-text("Ask to join")',
    'span:has-text("Join now")',
    '[role="button"]:has-text("Ask to join")',
  ], { timeout: 8000 });
  if (!clicked) throw new Error('MEET_JOIN_BUTTON_NOT_FOUND');
  console.log('[meet] clicked join — waiting for host to admit…');

  // Admitted when an in-call control appears (Leave call / bottom bar / people).
  const admitted = await waitForInCall(page, admitTimeoutMs);
  if (!admitted) throw new Error('NOT_ADMITTED_TIMEOUT');
  console.log('[meet] admitted — in the call');
  return true;
}

/** Poll for an in-call indicator. */
async function waitForInCall(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const inCallSelectors = [
    'button[aria-label*="Leave call" i]',
    'button[aria-label*="Leave" i]',
    '[aria-label*="Leave call" i]',
    'button[aria-label*="Show everyone" i]',
  ];
  while (Date.now() < deadline) {
    for (const sel of inCallSelectors) {
      try {
        if (await page.locator(sel).first().isVisible()) return true;
      } catch (_) { /* ignore */ }
    }
    // "You can't join this call" / "denied" → give up early.
    try {
      const denied = await page.locator('text=/you can.?t join|was denied|removed you|no one responded/i').first().isVisible();
      if (denied) return false;
    } catch (_) { /* ignore */ }
    await page.waitForTimeout(2500);
  }
  return false;
}

/**
 * Resolve when the meeting ends: the bot is removed, everyone leaves, the call
 * ends, or the max duration is hit. Polls cheaply.
 */
async function waitForMeetingEnd(page, { maxMs, onAlive = () => {} }) {
  const deadline = Date.now() + maxMs;
  while (Date.now() < deadline) {
    // Ended screens.
    try {
      const ended = await page.locator('text=/you.?ve left the meeting|call ended|return to home screen|you were removed|meeting ended/i').first().isVisible();
      if (ended) { console.log('[meet] end screen detected'); return 'ended'; }
    } catch (_) { /* ignore */ }

    // Leave button gone for a sustained period → treat as ended.
    let leaveVisible = false;
    try { leaveVisible = await page.locator('button[aria-label*="Leave call" i]').first().isVisible(); } catch (_) {}
    if (!leaveVisible) {
      await page.waitForTimeout(3000);
      try { leaveVisible = await page.locator('button[aria-label*="Leave call" i]').first().isVisible(); } catch (_) {}
      if (!leaveVisible) { console.log('[meet] leave control gone — assuming ended'); return 'ended'; }
    }

    // Alone in the call (everyone else left) for a while → end.
    // (Participant count parsing is layout-dependent; left as a heartbeat.)
    onAlive();
    await page.waitForTimeout(5000);
  }
  console.log('[meet] max duration reached');
  return 'maxDuration';
}

async function leaveMeet(page) {
  await clickFirst(page, ['button[aria-label*="Leave call" i]', '[aria-label*="Leave call" i]'], { timeout: 3000 });
}

module.exports = { joinMeet, waitForMeetingEnd, leaveMeet };
