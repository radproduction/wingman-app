'use strict';
/**
 * Offline engine checks with a SCRIPTED model (no API calls, nothing sent):
 *   - built-in sends are parked for a yes, then run once on approval
 *   - automated runs can never approve
 *   - the tool loop ends honestly when it runs out of rounds
 *   - last turn's tool results reach the next turn's prompt
 *   - built-in tool definitions are marked for prompt caching
 * Run:  node scripts/test-engine-offline.js
 */
const os = require('os');
const path = require('path');
const fs = require('fs');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-engine-'));
process.env.DATABASE_PATH = path.join(tmp, 't.db');
process.env.DISABLE_WHATSAPP = '1';
process.env.COMPOSIO_API_KEY = 'test';
process.env.COMPOSIO_AUTH_CONFIGS = '{"facebook":"ac_test"}';
process.env.APP_STUDY = '0';

const db = require('../src/db');
db.initSchema();

// ── stubs: model, Composio, Gmail ────────────────────────────────────
const claude = require('../src/llm/claude');
const calls = [];
let script = [];
claude.chatWithTools = async (messages, opts) => {
  calls.push({ messages: JSON.parse(JSON.stringify(messages)), opts });
  const next = script.shift();
  if (!next) throw new Error('script exhausted');
  return typeof next === 'function' ? next(messages, opts) : next;
};
claude.chat = async () => '';
claude.complete = async () => '';

const composio = require('../src/services/composio');
composio.toolsForUser = async () => [];
composio.listConnections = async () => [];

const googleAuth = require('../src/auth/googleAuth');
googleAuth.isEmailConnected = () => true;
googleAuth.isConnected = () => true;
const gmail = require('../src/services/gmail');
const sentMail = [];
gmail.sendMessage = async (user, msg) => { sentMail.push(msg); return { id: 'm1' }; };

const engine = require('../src/engine/conversation');
const users = require('../src/db/users');
const conversations = require('../src/db/conversations');

const toolUse = (name, input, id = `tu_${Math.random().toString(36).slice(2, 8)}`) => ({
  stop_reason: 'tool_use',
  content: [{ type: 'tool_use', id, name, input }],
});
const say = (text) => ({ stop_reason: 'end_turn', content: [{ type: 'text', text }] });
const sysText = (system) => (Array.isArray(system) ? system.map((b) => b.text).join('') : String(system));
const lastToolResult = (messages) => {
  const last = messages[messages.length - 1];
  const block = Array.isArray(last.content) ? last.content.find((b) => b.type === 'tool_result') : null;
  return block ? JSON.parse(block.content) : null;
};

let fails = 0;
const check = (name, ok, extra = '') => { console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ` — ${extra}` : ''}`); if (!ok) fails += 1; };

(async () => {
  const u = users.create({ phone: '923001112222' });
  users.update(u.id, { name: 'Aamir', onboarding_complete: 1, timezone: 'Asia/Karachi' });

  // ── 1. "email ali" → parked, not sent ──
  let parked = null;
  script = [
    toolUse('send_email', { to: 'ali@acme.com', subject: 'Hi', body: 'Hello Ali' }),
    (messages) => { parked = lastToolResult(messages); return say('Send it to ali@acme.com? (yes/no)'); },
  ];
  await engine.handleMessage({ text: 'ali ko email karo hello', phoneNumber: '923001112222', meta: { provider: 'cloud' } });
  check('send_email is parked for a yes', parked && parked.approval_required && parked.action_id && sentMail.length === 0);
  check('built-in tools marked for prompt caching', (() => {
    const { tools, cacheTools } = calls[0].opts;
    const marked = claude.markToolCache(tools, cacheTools).filter((t) => t.cache_control);
    return cacheTools > 20 && marked.length === 1 && !tools.some((t) => t.cache_control);
  })());

  // ── 2. "haan" → approve → sent exactly once ──
  let approveResult = null;
  script = [
    (messages, opts) => {
      check('pending action + id shown in the prompt', sysText(opts.system).includes(parked.action_id));
      check('last turn\'s tool results are in the prompt', sysText(opts.system).includes('WHAT YOUR TOOLS RETURNED') && sysText(opts.system).includes('send_email'));
      check('stable prompt part is cached, dynamic part is not', Array.isArray(opts.system) && opts.system[0].cache_control && !opts.system[1].cache_control && opts.system[0].text.length > 20000);
      return toolUse('approve_integration_action', { action_id: parked.action_id });
    },
    (messages) => { approveResult = lastToolResult(messages); return say('Done ✅ Sent to Ali.'); },
  ];
  await engine.handleMessage({ text: 'haan', phoneNumber: '923001112222', meta: { provider: 'cloud' } });
  check('approval runs the send once', approveResult && approveResult.done && sentMail.length === 1 && sentMail[0].to === 'ali@acme.com');

  // ── 3. approving again does nothing ──
  script = [toolUse('approve_integration_action', { action_id: parked.action_id }), (m) => { approveResult = lastToolResult(m); return say('ok'); }];
  await engine.handleMessage({ text: 'yes', phoneNumber: '923001112222', meta: { provider: 'cloud' } });
  check('a second yes cannot send twice', sentMail.length === 1 && approveResult && approveResult.error);

  // ── 4. automated run: parked, and cannot approve itself ──
  let autoPark = null; let autoApprove = null;
  script = [
    toolUse('send_email', { to: 'boss@acme.com', subject: 'Report', body: 'x' }),
    (m) => { autoPark = lastToolResult(m); return toolUse('approve_integration_action', { action_id: autoPark.action_id }); },
    (m) => { autoApprove = lastToolResult(m); return say('I have a report email ready for your yes.'); },
  ];
  await engine.runAutomatedInstruction(users.getById(u.id), 'email my boss the report');
  check('automated send is parked', autoPark && autoPark.approval_required);
  check('automated run cannot approve', autoApprove && autoApprove.error === 'NEEDS_USER_CONFIRMATION' && sentMail.length === 1);

  // ── 5. invalid recipient fails fast (no pointless yes) ──
  let bad = null;
  script = [toolUse('send_email', { to: 'ali', subject: 's', body: 'b' }), (m) => { bad = lastToolResult(m); return say('What is Ali\'s email?'); }];
  await engine.handleMessage({ text: 'email ali', phoneNumber: '923001112222', meta: { provider: 'cloud' } });
  check('invalid recipient rejected before parking', bad && bad.error === 'INVALID_RECIPIENT');

  // ── 6. out of rounds → honest final words, tools disabled ──
  script = [];
  for (let i = 0; i < 20; i += 1) script.push(toolUse('list_tasks', {}));
  let finalOpts = null;
  const origPush = script.push.bind(script);
  // the first non-tool call (tool_choice none) gets this answer
  claude.chatWithTools = async (messages, opts) => {
    calls.push({ messages, opts });
    if (opts.toolChoice && opts.toolChoice.type === 'none') { finalOpts = opts; return say('I checked your tasks but ran out of steps before finishing.'); }
    return script.shift();
  };
  const r = await engine.handleMessage({ text: 'sab kuch check karo', phoneNumber: '923001112222', meta: { provider: 'cloud' } });
  void origPush;
  check('loop cap no longer says "I\'ve handled that"', !/handled that/.test(r.reply) && /ran out of steps/.test(r.reply));
  check('final call is tool-free (tool_choice none)', finalOpts && finalOpts.toolChoice.type === 'none');

  // ── 7. tool log stored on the assistant row ──
  const lastAssistant = conversations.historyForUser(u.id, 2).filter((x) => x.role === 'assistant').pop();
  const meta = JSON.parse(lastAssistant.metadata || '{}');
  check('assistant row keeps a compact tool log', Array.isArray(meta.toolLog) && meta.toolLog.length > 0 && meta.toolLog.length <= 12);

  console.log(fails ? `\n${fails} FAILED` : '\nall passed');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
