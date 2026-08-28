'use strict';

/**
 * Google Meet join flow for a guest (unauthenticated) bot.
 *
 * The bot lands on the Meet URL, types its name, turns cam+mic off, and clicks
 * "Ask to join" — then waits in the lobby until the host admits it. Once in the
 * call it stays until the meeting ends, then leaves.
 *
 * Meet's DOM has no stable API and changes over time. Selectors use several
 * fallbacks; on failure the bot dumps every button's label + a screenshot to the
 * logs so the exact target can be pinned down. 1 vCPU hosts load Meet slowly, so
 * the waits are deliberately generous.
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

/** Turn off cam + mic on the green room, best-effort (may already be off). */
async function muteSelfAndCam(page) {
  await clickFirst(page, [
    'button[aria-label*="Turn off microphone" i]',
    'div[role="button"][aria-label*="Turn off microphone" i]',
    '[aria-label*="Turn off microphone" i]',
  ], { timeout: 3000 });
  await clickFirst(page, [
    'button[aria-label*="Turn off camera" i]',
    'div[role="button"][aria-label*="Turn off camera" i]',
    '[aria-label*="Turn off camera" i]',
  ], { timeout: 3000 });
}

/**
 * Find and click the join button. Meet labels it "Ask to join" (guest needing
 * admission) or "Join now" (open access). Tries role-based first (most robust),
 * then text, then a last-resort scan for any button whose text contains "join".
 */
async function clickJoin(page) {
  const strategies = [
    () => page.getByRole('button', { name: /ask to join/i }),
    () => page.getByRole('button', { name: /join now/i }),
    () => page.getByRole('button', { name: /^join$/i }),
    () => page.locator('button:has-text("Ask to join")'),
    () => page.locator('button:has-text("Join now")'),
    () => page.locator('[role="button"]:has-text("Ask to join")'),
    () => page.locator('[role="button"]:has-text("Join now")'),
  ];
  // Up to ~30s: the button can take a while to enable on a slow host.
  for (let attempt = 0; attempt < 6; attempt++) {
    for (const make of strategies) {
      try {
        const loc = make().first();
        if (await loc.isVisible()) {
          await loc.click({ timeout: 4000 });
          return true;
        }
      } catch (_) { /* next strategy */ }
    }
    // Last resort: any button/role=button whose visible text mentions "join".
    try {
      const handle = await page.evaluateHandle(() => {
        const els = [...document.querySelectorAll('button, [role="button"]')];
        return els.find((e) => /(?:ask to )?join(?: now)?/i.test((e.innerText || '').trim()) && e.offsetParent !== null) || null;
      });
      const el = handle.asElement();
      if (el) { await el.click(); return true; }
    } catch (_) { /* ignore */ }
    await page.waitForTimeout(2500);
  }
  return false;
}

/** On failure, log every button's text + aria-label (and a screenshot) so the
 *  real selector can be identified from the logs. */
async function dumpJoinDebug(page, tag) {
  try {
    const shot = `/tmp/meet-${tag}.png`;
    await page.screenshot({ path: shot });
    console.log('[meet][debug] screenshot →', shot, '(docker cp wingman-bot:' + shot + ' .)');
  } catch (e) { console.log('[meet][debug] screenshot failed:', e.message); }
  try {
    console.log('[meet][debug] url:', page.url());
    const txt = (await page.evaluate(() => (document.body && document.body.innerText) || '')).slice(0, 400).replace(/\n+/g, ' | ');
    console.log('[meet][debug] visible text:', txt);
  } catch (_) { /* ignore */ }
  try {
    const btns = await page.$$eval('button, [role="button"]', (els) =>
      els.map((e) => ({
        t: (e.innerText || '').trim().slice(0, 50),
        a: (e.getAttribute('aria-label') || '').slice(0, 50),
      })).filter((x) => x.t || x.a).slice(0, 50));
    console.log(`[meet][debug] ${btns.length} buttons on page:`);
    for (const b of btns) console.log(`   text="${b.t}" aria="${b.a}"`);
  } catch (e) { console.log('[meet][debug] button dump failed:', e.message); }
}

/** One pre-join pass: open the URL, enter the guest name, mute, click join. */
async function prepareAndKnock(page, url, botName) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  // Meet's pre-join UI is heavy JS — let it settle (longer on a 1 vCPU host).
  await page.waitForTimeout(5000);

  await clickFirst(page, [
    'button:has-text("Dismiss")',
    'button:has-text("Got it")',
    'button[aria-label="Close"]',
  ], { timeout: 3000 });

  // Guest name field — wait generously; it can render late.
  try {
    const nameField = page.locator('input[placeholder*="name" i], input[aria-label*="name" i]').first();
    await nameField.waitFor({ state: 'visible', timeout: 20000 });
    await nameField.fill(botName);
    console.log('[meet] entered guest name:', botName);
  } catch (_) {
    console.log('[meet] no guest name field (already signed in, or different layout)');
  }

  await muteSelfAndCam(page);
  return clickJoin(page);
}

/**
 * Join the meeting. Knocks up to `maxKnocks` times so a busy host has several
 * chances (and enough time) to admit. Resolves once admitted and in the call.
 */
async function joinMeet(page, { url, botName, admitTimeoutMs = 300000, onStatus = () => {}, maxKnocks = 3 }) {
  console.log('[meet] opening', url);
  // Each knock waits up to ~2 min for the host, then re-knocks.
  const perKnockMs = Math.min(admitTimeoutMs, 120000);

  for (let knock = 1; knock <= maxKnocks; knock++) {
    console.log(`[meet] join attempt ${knock}/${maxKnocks}`);
    const clicked = await prepareAndKnock(page, url, botName);
    if (!clicked) {
      await dumpJoinDebug(page, 'join');
      if (knock === maxKnocks) throw new Error('MEET_JOIN_BUTTON_NOT_FOUND');
      continue;
    }
    onStatus('waiting');
    console.log(`[meet] ✋ KNOCKING — host must click "Admit" for "${botName}" (waiting up to ${Math.round(perKnockMs / 1000)}s)`);
    // Show what the bot sees while knocking ("Asking to be let in…" = knock sent).
    try {
      const txt = (await page.evaluate(() => (document.body && document.body.innerText) || '')).slice(0, 220).replace(/\n+/g, ' | ');
      console.log('[meet][debug] knock-screen text:', txt);
    } catch (_) { /* ignore */ }

    const res = await waitForInCall(page, perKnockMs);
    if (res === 'admitted') { console.log('[meet] admitted — in the call'); return true; }
    console.log(`[meet] not admitted this round (${res})${knock < maxKnocks ? ' — knocking again…' : ''}`);
  }

  await dumpJoinDebug(page, 'admit');
  throw new Error('NOT_ADMITTED');
}

/** Poll for an in-call indicator. Returns 'admitted' | 'denied' | 'timeout'.
 *  Logs a heartbeat so the host knows the bot is still waiting to be let in. */
async function waitForInCall(page, timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  const inCallSelectors = [
    'button[aria-label*="Leave call" i]',
    '[aria-label*="Leave call" i]',
    'button[aria-label*="Show everyone" i]',
    'button[aria-label*="Chat with everyone" i]',
  ];
  let lastBeat = 0;
  while (Date.now() < deadline) {
    for (const sel of inCallSelectors) {
      try { if (await page.locator(sel).first().isVisible()) return 'admitted'; } catch (_) { /* ignore */ }
    }
    try {
      const denied = await page.locator('text=/you can.?t join|was denied|no one responded|removed you|returning to home/i').first().isVisible();
      if (denied) { console.log('[meet] host did not admit in time (Meet booted the knock)'); return 'denied'; }
    } catch (_) { /* ignore */ }

    if (Date.now() - lastBeat > 15000) {
      lastBeat = Date.now();
      console.log('[meet] …still waiting for the host to admit the bot…');
    }
    await page.waitForTimeout(2500);
  }
  return 'timeout';
}

/** Best-effort participant count (incl. the bot). Returns null if unknown. */
async function countParticipants(page) {
  try {
    return await page.evaluate(() => {
      const ids = document.querySelectorAll('[data-participant-id]');
      if (ids.length) {
        return new Set([...ids].map((n) => n.getAttribute('data-participant-id'))).size;
      }
      // Fallback: a count shown on the people/everyone control.
      const btn = document.querySelector('button[aria-label*="everyone" i], button[aria-label*="participant" i], button[aria-label*="people" i]');
      if (btn) {
        const m = ((btn.getAttribute('aria-label') || '') + ' ' + (btn.innerText || '')).match(/\d+/);
        if (m) return parseInt(m[0], 10);
      }
      return null;
    });
  } catch (_) {
    return null;
  }
}

/**
 * Resolve when the meeting ends: the bot is removed, everyone else leaves (bot
 * alone), the call ends, or the max duration is hit. Leaving when alone frees
 * the (serial) worker instead of recording an empty room for the full cap.
 */
async function waitForMeetingEnd(page, { maxMs, aloneMs = 90000 }) {
  const deadline = Date.now() + maxMs;
  let aloneSince = 0;
  while (Date.now() < deadline) {
    try {
      const ended = await page.locator('text=/you.?ve left the meeting|call ended|return to home screen|you were removed|meeting ended/i').first().isVisible();
      if (ended) { console.log('[meet] end screen detected'); return 'ended'; }
    } catch (_) { /* ignore */ }

    let leaveVisible = false;
    try { leaveVisible = await page.locator('button[aria-label*="Leave call" i]').first().isVisible(); } catch (_) {}
    if (!leaveVisible) {
      await page.waitForTimeout(3000);
      try { leaveVisible = await page.locator('button[aria-label*="Leave call" i]').first().isVisible(); } catch (_) {}
      if (!leaveVisible) { console.log('[meet] leave control gone — assuming ended'); return 'ended'; }
    }

    // Everyone else left (only the bot remains) → leave after a short grace, so
    // the bot never sits recording an empty call and blocking the next meeting.
    const n = await countParticipants(page);
    if (n != null && n <= 1) {
      if (!aloneSince) { aloneSince = Date.now(); console.log('[meet] alone in the call — will leave if no one returns'); }
      else if (Date.now() - aloneSince > aloneMs) { console.log('[meet] alone too long — leaving'); return 'alone'; }
    } else if (n != null) {
      aloneSince = 0;
    }

    await page.waitForTimeout(5000);
  }
  console.log('[meet] max duration reached');
  return 'maxDuration';
}

async function leaveMeet(page) {
  await clickFirst(page, ['button[aria-label*="Leave call" i]', '[aria-label*="Leave call" i]'], { timeout: 3000 });
}

module.exports = { joinMeet, waitForMeetingEnd, leaveMeet };
