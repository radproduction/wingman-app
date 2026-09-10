'use strict';

/**
 * Level 3 — Phase 3b: the AGENT drives the live browser itself.
 *
 * On top of a live session (liveBrowser), this runs an action loop: read the
 * page (URL, title, visible text, numbered interactive elements) → ask Claude for
 * the SINGLE next action (click / type / scroll / navigate / done / ask) → do it
 * on the real page → repeat. The user watches it all happen in the live-view
 * iframe and can take over any time.
 *
 * DOM-based (not screenshot-coordinate) so it's reliable and cheap: Claude reasons
 * over a text list of elements, the user sees the visuals live. Read/search tasks
 * (like a flight status lookup) run end to end; anything it can't do (CAPTCHA, a
 * login it doesn't have, a real purchase) it stops on and asks the user.
 */

const claude = require('../llm/claude');
const liveBrowser = require('./liveBrowser');

const runs = new Map(); // sessionId -> { status, goal, steps, result, error, done, userId, at }
const MAX_STEPS = 12;
const RUN_TTL_MS = 30 * 60 * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM = `You are a careful web agent driving a REAL browser to accomplish the user's goal. Each turn you get the current page (URL, title, visible text, and a numbered list of interactive elements) and you choose the SINGLE best next action.

Reply with ONLY a JSON object, nothing else:
{"thought":"<one short line on why>","action":"click"|"type"|"scroll"|"navigate"|"done"|"ask","index":<element number, for click/type>,"text":"<text to type; OR the final answer when action=done; OR the question when action=ask>","url":"<full url, for navigate>"}

Rules:
- Work step by step. To fill a form: "type" into a field, then in a LATER turn "type" the next field, then "click" the search/submit button.
- Use the numbered elements for click/type. Use "navigate" only to jump to a specific URL.
- "done": the goal is achieved — put the exact ANSWER the user wanted (e.g. the flight status/time) in "text", read from the page. Never invent it.
- "ask": you are genuinely blocked — a CAPTCHA, a login you don't have, or a real payment/purchase step — put a short question in "text" so the user can take over in the live view.
- Do NOT attempt to pay, purchase, or place an order. If the goal needs that, stop with "ask".
- Prefer the simplest path. If the page already shows the answer, use "done".`;

function parseAction(raw) {
  if (!raw) return null;
  const s = String(raw).replace(/```json|```/g, '');
  const a = s.indexOf('{');
  const b = s.lastIndexOf('}');
  if (a === -1 || b === -1) return null;
  try {
    const o = JSON.parse(s.slice(a, b + 1));
    if (!o || typeof o.action !== 'string') return null;
    return o;
  } catch (_) { return null; }
}

/** Read the page into a compact, serialisable state; tag elements for clicking. */
function readState(page) {
  return page.evaluate(() => {
    const nodes = Array.from(
      document.querySelectorAll('a, button, input, textarea, select, [role="button"], [role="link"], [role="tab"]'),
    );
    const els = [];
    let i = 0;
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      const visible = r.width > 2 && r.height > 2 && r.bottom > -50 && r.top < window.innerHeight + 600;
      if (!visible) continue;
      el.setAttribute('data-wm-idx', String(i));
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || '').toLowerCase();
      const label = (
        el.getAttribute('aria-label') ||
        el.placeholder ||
        (el.value && type !== 'password' ? el.value : '') ||
        el.innerText ||
        el.name ||
        el.title ||
        ''
      ).replace(/\s+/g, ' ').trim().slice(0, 90);
      els.push({ i, tag, type, label });
      i += 1;
      if (i >= 70) break;
    }
    const text = (document.body ? document.body.innerText : '').replace(/\n{3,}/g, '\n\n').trim().slice(0, 2500);
    return { url: location.href, title: document.title, elements: els, text };
  });
}

function buildPrompt(goal, state, steps) {
  const elLines = state.elements.map((e) => `[${e.i}] ${e.tag}${e.type ? `:${e.type}` : ''} ${e.label || '(no label)'}`).join('\n');
  const history = steps.length
    ? steps.map((s) => `- ${s.action}${s.index != null ? ` [${s.index}]` : ''}${s.detail ? `: ${s.detail}` : ''}`).join('\n')
    : '(none yet)';
  return [
    `GOAL: ${goal}`,
    ``,
    `CURRENT PAGE: ${state.title} — ${state.url}`,
    ``,
    `VISIBLE TEXT (truncated):\n${state.text || '(empty)'}`,
    ``,
    `INTERACTIVE ELEMENTS:\n${elLines || '(none found)'}`,
    ``,
    `ACTIONS SO FAR:\n${history}`,
    ``,
    `What is the single next action? Reply with only the JSON.`,
  ].join('\n');
}

async function execAction(page, act) {
  const sel = (i) => `[data-wm-idx="${i}"]`;
  try {
    if (act.action === 'navigate' && act.url) {
      const u = /^https?:\/\//i.test(act.url) ? act.url : `https://${act.url}`;
      await page.goto(u, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      return;
    }
    if (act.action === 'scroll') {
      await page.evaluate(() => window.scrollBy(0, Math.round(window.innerHeight * 0.8))).catch(() => {});
      return;
    }
    if (act.action === 'click' && act.index != null) {
      const el = await page.$(sel(act.index));
      if (el) {
        await el.evaluate((e) => e.scrollIntoView({ block: 'center' })).catch(() => {});
        await el.click({ delay: 20 }).catch(async () => {
          await page.evaluate((s) => { const x = document.querySelector(s); if (x) x.click(); }, sel(act.index)).catch(() => {});
        });
      }
      return;
    }
    if (act.action === 'type' && act.index != null) {
      const el = await page.$(sel(act.index));
      if (el) {
        await el.click({ clickCount: 3 }).catch(() => {});
        await el.type(String(act.text || ''), { delay: 25 }).catch(() => {});
        // If it's a search box, Enter often submits — harmless otherwise.
        await el.press('Enter').catch(() => {});
      }
      return;
    }
  } catch (_) { /* keep the loop alive; next snapshot reflects reality */ }
}

async function runLoop(sessionId) {
  const run = runs.get(sessionId);
  if (!run) return;
  const browser = liveBrowser.getBrowser(sessionId);
  if (!browser) { run.status = 'error'; run.error = 'session not available'; run.done = true; return; }

  try {
    for (let step = 0; step < MAX_STEPS; step++) {
      const pages = await browser.pages().catch(() => []);
      const page = pages[pages.length - 1] || pages[0];
      if (!page) { run.error = 'no page'; break; }

      await sleep(1000); // let the page settle after the last action
      let state;
      try { state = await readState(page); } catch (_) { state = null; }
      if (!state) { run.error = 'could not read the page'; break; }

      let raw;
      try { raw = await claude.complete(buildPrompt(run.goal, state, run.steps), { system: SYSTEM, maxTokens: 350 }); }
      catch (_) { run.error = 'could not think'; break; }

      const act = parseAction(raw);
      if (!act) { run.error = 'could not decide the next step'; break; }

      run.steps.push({ n: step + 1, action: act.action, index: act.index, detail: (act.thought || '').slice(0, 120) });
      runs.set(sessionId, run);

      if (act.action === 'done') { run.result = act.text || 'Done.'; run.status = 'done'; break; }
      if (act.action === 'ask') { run.result = act.text || 'I need you to take over for one step.'; run.status = 'waiting'; break; }

      await execAction(page, act);
    }
    if (run.status === 'running') {
      run.status = run.result ? 'done' : 'stopped';
      if (!run.result) run.result = 'I reached the step limit. You can take control in the live view to finish.';
    }
  } catch (e) {
    run.status = 'error';
    run.error = (e && e.message) || 'agent error';
  } finally {
    run.done = true;
    runs.set(sessionId, run);
  }
}

/** Start a live session and kick off the agent loop toward `goal`. */
async function startTask(userId, goal, url) {
  if (!liveBrowser.available()) return { ok: false, error: 'LIVE_BROWSER_NOT_CONFIGURED' };
  const startUrl = url && String(url).trim() ? url : 'https://www.google.com';
  const started = await liveBrowser.startLive(startUrl, { userId });
  if (!started.ok) return started;

  runs.set(started.sessionId, {
    status: 'running', goal, url: started.url, steps: [], result: null, error: null, done: false, userId, at: Date.now(),
  });
  // Fire-and-forget: the user watches via the live view and polls status.
  runLoop(started.sessionId).catch(() => {});

  // Opportunistic cleanup of old runs.
  const now = Date.now();
  for (const [id, r] of runs) if (now - r.at > RUN_TTL_MS) runs.delete(id);

  return { ok: true, sessionId: started.sessionId, liveViewUrl: started.liveViewUrl, url: started.url };
}

/** Poll the progress of a running/finished task. */
function getStatus(sessionId) {
  const r = runs.get(sessionId);
  if (!r) return { found: false };
  return { found: true, status: r.status, steps: r.steps, result: r.result, error: r.error, done: r.done, goal: r.goal };
}

module.exports = { startTask, getStatus };
