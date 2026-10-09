'use strict';
/**
 * LIVE behaviour eval — the real model, fake data, nothing sent anywhere.
 *
 * Runs a handful of real conversations (English + Roman Urdu) through the same
 * engine WhatsApp uses, against a throwaway database, with every tool executor
 * replaced by a fake that only records what was called. Then checks behaviour:
 * did it use the right tool, did it park a send for a yes instead of asking
 * first, did it approve on "haan", did it answer in the user's language…
 *
 * Needs ANTHROPIC_API_KEY. On the droplet:
 *   docker exec wingman node scripts/eval-live.js
 * (uses /tmp for its DB — production data is never touched). Costs a few cents.
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-eval-'));
process.env.DATABASE_PATH = path.join(tmp, 'eval.db');
process.env.DISABLE_WHATSAPP = '1';
process.env.APP_STUDY = '0';
process.env.WHATSAPP_TOKEN = '';
process.env.WHATSAPP_PHONE_NUMBER_ID = '';
// The approval tools only exist when Composio is configured; fake a config so
// the gate is exercised, and stub every Composio call below.
process.env.COMPOSIO_API_KEY = process.env.COMPOSIO_API_KEY || 'eval';
if (!process.env.COMPOSIO_AUTH_CONFIGS) process.env.COMPOSIO_AUTH_CONFIGS = '{"facebook":"ac_eval"}';

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY is not set — this eval talks to the real model.');
  process.exit(2);
}

const db = require('../src/db');
db.initSchema();

// ── Fakes: record calls, return plausible data ────────────────────────
const called = [];
const record = (name, input) => called.push({ name, input });

const composio = require('../src/services/composio');
composio.toolsForUser = async () => [];
composio.listConnections = async () => [];

const googleAuth = require('../src/auth/googleAuth');
googleAuth.isEmailConnected = () => true;
googleAuth.isConnected = () => true;

const gmail = require('../src/services/gmail');
gmail.sendMessage = async (u, msg) => { record('[gmail.sendMessage]', msg); return { id: 'm1' }; };

function fake(modPath, fnName, impl) {
  const mod = require(modPath);
  mod[fnName] = async (user, toolUse) => { record(toolUse.name, toolUse.input); return impl(toolUse); };
}
const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
fake('../src/engine/calendarExecutor', 'executeCalendarTool', (t) => {
  if (t.name === 'get_events') return { events: [{ id: 'ev1', title: 'Design review with Sara', start: `${tomorrow}T11:00:00+05:00`, end: `${tomorrow}T12:00:00+05:00` }] };
  if (t.name === 'delete_event') return { deleted: true };
  return { ok: true, id: 'ev2' };
});
fake('../src/engine/taskExecutor', 'executeTaskTool', () => ({ ok: true, tasks: [] }));
fake('../src/engine/automationExecutor', 'executeAutomationTool', () => ({ ok: true, id: 'a1' }));
fake('../src/engine/memoryExecutor', 'executeMemoryTool', () => ({ ok: true }));
fake('../src/engine/recordsExecutor', 'executeRecordsTool', (t) => (t.name === 'list_bills'
  ? { bills: [{ name: 'K-Electric', amount: 'PKR 18,400', due: tomorrow, paid: false }] }
  : { results: [] }));

const engine = require('../src/engine/conversation');
const users = require('../src/db/users');

const PHONE = '923001234567';
const u = users.create({ phone: PHONE });
users.update(u.id, { name: 'Aamir Younus', onboarding_complete: 1, timezone: 'Asia/Karachi', runs_business: 1 });

async function turn(text) {
  called.length = 0;
  const { reply } = await engine.handleMessage({ text, phoneNumber: PHONE, meta: { provider: 'cloud' } });
  return { reply: reply || '', tools: called.map((c) => c.name), calls: called.slice() };
}

let fails = 0;
function check(name, ok, detail) {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`);
  if (!ok) { fails += 1; if (detail) console.log(`      ${detail}`); }
}
const urduScript = /[؀-ۿ]/;

(async () => {
  // 1. Calendar question → uses the tool, doesn't guess.
  let r = await turn("What's on my calendar tomorrow?");
  check('calendar question calls get_events', r.tools.includes('get_events'), `tools: ${r.tools.join(', ')} | reply: ${r.reply.slice(0, 160)}`);
  check('…and mentions the event', /design review|sara/i.test(r.reply), r.reply.slice(0, 200));

  // 2. Roman Urdu in → Roman Urdu out (Latin script).
  r = await turn('kal ke bills kya hain?');
  check('Roman Urdu question gets a Latin-script reply', !urduScript.test(r.reply) && r.reply.length > 0, r.reply.slice(0, 200));
  check('bills question uses the bills tool', r.tools.includes('list_bills') || r.tools.includes('search_user_data'), `tools: ${r.tools.join(', ')}`);

  // 3. Send email → tool is called (parked) in the SAME turn, one yes asked.
  r = await turn('Ali ko email bhej do ali@acme.com pe ke kal ki meeting 3 baje shift ho gayi hai');
  check('email request calls send_email right away (parked, not asked first)', r.tools.includes('send_email'), `tools: ${r.tools.join(', ')} | reply: ${r.reply.slice(0, 200)}`);
  check('nothing was actually sent yet', !r.tools.includes('[gmail.sendMessage]'));

  // 4. "haan" → approved and sent once.
  r = await turn('haan bhej do');
  const sends = r.tools.filter((t) => t === '[gmail.sendMessage]').length;
  check('"haan" approves and sends exactly once', sends === 1, `tools: ${r.tools.join(', ')} | reply: ${r.reply.slice(0, 200)}`);

  // 5. Standing instruction → automation, not a one-off task.
  r = await turn('every weekday at 9am send me my pending tasks');
  check('repeating request creates an automation', r.tools.includes('create_automation'), `tools: ${r.tools.join(', ')}`);

  // 6. A plain greeting needs no tools and stays short.
  r = await turn('hi');
  check('greeting uses no tools', r.tools.length === 0, `tools: ${r.tools.join(', ')}`);
  check('greeting is short', r.reply.length < 400, `${r.reply.length} chars`);

  // 7. Cancelling a meeting is gated too.
  r = await turn('cancel my design review tomorrow');
  check('cancel → delete_event is parked, not run', !r.calls.some((c) => c.name === 'delete_event') || /yes|haan|confirm|go ahead|\?/i.test(r.reply),
    `tools: ${r.tools.join(', ')} | reply: ${r.reply.slice(0, 200)}`);

  console.log(fails ? `\n${fails} check(s) failed` : '\nall behaviour checks passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
