'use strict';

const usersRepo = require('../db/users');
const conversationsRepo = require('../db/conversations');
const claude = require('../llm/claude');
const { buildSystemPrompt } = require('./systemPrompt');
const { calendarTools } = require('./calendarTools');
const { executeCalendarTool } = require('./calendarExecutor');
const { taskTools, taskToolNames } = require('./taskTools');
const { executeTaskTool } = require('./taskExecutor');
const { goalTools, goalToolNames } = require('./goalTools');
const { executeGoalTool } = require('./goalExecutor');
const { auditTools, auditToolNames } = require('./auditTools');
const { executeAuditTool } = require('./auditExecutor');
const { vaultTools, vaultToolNames } = require('./vaultTools');
const { executeVaultTool } = require('./vaultExecutor');
const { browserTools, browserToolNames } = require('./browserTools');
const { executeBrowserTool } = require('./browserExecutor');
const { gmailTools, gmailToolNames } = require('./gmailTools');
const { executeGmailTool } = require('./gmailExecutor');
const { driveTools, driveToolNames } = require('./driveTools');
const { executeDriveTool } = require('./driveExecutor');
const { shopifyTools, shopifyToolNames } = require('./shopifyTools');
const { newsTools, newsToolNames } = require('./newsTools');
const { memoryTools, memoryToolNames } = require('./memoryTools');
const { mapsTools, mapsToolNames } = require('./mapsTools');
const { webmailTools, webmailToolNames } = require('./webmailTools');
const { voiceTools, voiceToolNames } = require('./voiceTools');
const { healthTools, healthToolNames } = require('./healthTools');
const { executeHealthTool } = require('./healthExecutor');
const { workTools, workToolNames } = require('./workTools');
const { executeWorkTool } = require('./workExecutor');
const { automationTools, automationToolNames } = require('./automationTools');
const { executeAutomationTool } = require('./automationExecutor');
const { agentTools, agentToolNames } = require('./agentTools');
const { executeAgentTool } = require('./agentExecutor');
const { executeVoiceTool } = require('./voiceExecutor');
const { executeWebmailTool } = require('./webmailExecutor');
const { executeMapsTool } = require('./mapsExecutor');
const { executeMemoryTool } = require('./memoryExecutor');
const { executeNewsTool } = require('./newsExecutor');
const { executeShopifyTool } = require('./shopifyExecutor');
const { integrationToolsForUser } = require('./integrationTools');
const { executeIntegrationTool, pendingActionsBlock } = require('./integrationExecutor');
const { imageToolNames, imageToolsAvailable } = require('./imageTools');
const { executeImageTool, recentImagesBlock } = require('./imageExecutor');
const { brainTools, brainToolNames } = require('./brainTools');
const { recordsTools, recordsToolNames } = require('./recordsTools');
const { executeRecordsTool } = require('./recordsExecutor');
const { executeBrainTool, rulesBlock } = require('./brainExecutor');
const appStudy = require('../services/appStudy');
const config = require('../config');

/**
 * Handle an inbound WhatsApp message end-to-end.
 *
 * @param {Object} params
 * @param {string} params.text
 * @param {string} params.phoneNumber
 * @param {Object} [params.meta]
 * @returns {Promise<{reply:string, user:Object}>}
 */
async function handleMessage({ text, phoneNumber, meta = {} }) {
  let user = usersRepo.getByPhone(phoneNumber);

  if (!user || !usersRepo.isOnboarded(user)) {
    return {
      reply:
        "Hi! I'm Wingman, a personal AI assistant. I only chat with registered users. " +
        `Set up your account here to get started: ${config.publicBaseUrl} 🚀`,
      user: user || null,
      ignored: true,
    };
  }

  conversationsRepo.logMessage({
    userId: user.id,
    role: 'user',
    content: text,
    metadata: { direction: 'inbound', phoneNumber, ...meta },
  });

  // Every message goes to the assistant. There are deliberately NO keyword
  // shortcuts here any more: matching words like "link"+"drive" or "bills"+"any"
  // hijacked real requests ("…add it in the drive and send me the link") and
  // never worked in Roman Urdu. Bills, deliveries, trips, contacts, the inbox
  // digest and the Google connect link are all tools/context the assistant
  // chooses to use (engine/recordsTools.js, connectLinkBlock).
  const reply = await runConversation(user, text);

  conversationsRepo.logMessage({
    userId: user.id,
    role: 'assistant',
    content: reply,
    metadata: { direction: 'outbound', phoneNumber },
  });

  return { reply, user };
}

async function runOnboarding(user, text, isNew) {
  const prefs = user.preferences || {};
  const ob = prefs.onboarding || { step: 'ask_name', complete: false };

  if (isNew && ob.step === 'ask_name' && !ob.greeted) {
    ob.greeted = true;
    prefs.onboarding = ob;
    usersRepo.update(user.id, { preferences: prefs });
    return `Hey! I'm Wingman - your AI chief of staff. What should I call you? 🙌`;
  }

  switch (ob.step) {
    case 'ask_name': {
      const name = cleanName(text);
      ob.step = 'ask_timezone';
      prefs.onboarding = ob;
      usersRepo.update(user.id, { name, preferences: prefs });
      return `Nice to meet you, ${name.split(/\s+/)[0]}! 🌟\n\nWhat timezone are you in? (e.g. Asia/Karachi, Asia/Dubai)`;
    }

    case 'ask_timezone': {
      const tz = text.trim();
      ob.step = 'ask_hours';
      prefs.onboarding = ob;
      usersRepo.update(user.id, { timezone: tz, preferences: prefs });
      return `Got it - ${tz}. ⏰\n\nLast thing: what are your work hours? (e.g. 9am to 6pm)`;
    }

    case 'ask_hours': {
      const { start, end } = parseWorkHours(text);
      ob.step = 'complete';
      ob.complete = true;
      prefs.onboarding = ob;
      usersRepo.update(user.id, {
        work_hours_start: start,
        work_hours_end: end,
        preferences: prefs,
      });
      const firstName = (user.name || 'there').split(/\s+/)[0];
      return `Perfect, you're all set ${firstName}! ✅\n\nI'll keep an eye on your day and reach out when it matters. You can ask me to manage tasks, check bills, track deliveries, and more.\n\nTry me: "what can you do?" 🚀`;
    }

    default:
      ob.step = 'complete';
      ob.complete = true;
      prefs.onboarding = ob;
      usersRepo.update(user.id, { preferences: prefs });
      return runConversation(usersRepo.getById(user.id), text);
  }
}

/**
 * Give the assistant the user's real Google connect link, so it can hand it
 * over however they ask ("google connect karo", "mera drive jor do") or when a
 * Google tool says it isn't connected — instead of telling them to type a magic
 * phrase.
 */
function connectLinkBlock(user) {
  if (!user || !user.phone) return '';
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(user.phone)}`;
  return `\n\n--- GOOGLE CONNECT LINK ---\nOne link connects Gmail, Calendar, Drive and Tasks together: ${url}\nSend it (just the link with one short line) when they ask to connect or reconnect any of those in any wording, or when a Google tool returns a NOT_CONNECTED / SCOPE_MISSING error. Never tell them to type a special phrase to get it. After they connect, carry on with what they originally asked.`;
}

async function runConversation(user, text) {
  const history = conversationsRepo.historyForUser(user.id, 20);
  const messages = history.map((row) => ({
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content || '',
  }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: text });
  }

  // Start learning Shopify if it was connected before the study feature existed.
  try { appStudy.noticeBuiltins(user); } catch (_) { /* best-effort */ }
  const system = buildSystemPrompt(user) + connectLinkBlock(user) + appStudy.knowledgeBlock(user) + rulesBlock(user)
    + pendingActionsBlock(user) + recentImagesBlock(user);
  const reply = await runToolLoop(user, messages, system);

  try {
    require('../services/behaviorLearner')
      .learnForUser(user.id)
      .catch((e) => console.warn('[behaviorLearner]', e.message));
  } catch (_) {
    // non-fatal
  }

  return reply;
}

/**
 * Execute a standing instruction (an automation) with the full tool set, in
 * isolation from the chat history — so an automated run neither depends on nor
 * pollutes the conversation. Returns the message to send the user, or null if
 * the AI decided nothing needed sending.
 */
async function runAutomatedInstruction(user, instruction) {
  const system = buildSystemPrompt(user) +
    `\n\n--- AUTOMATED RUN ---\nThis is a scheduled standing instruction you set up earlier, firing now — the user did NOT just message you. Carry it out with your tools and reply with ONLY the message to send them: the result itself (e.g. the traffic update), briefly and naturally, as if you proactively reached out. Do not ask questions or say "let me know" — just do it. If for some reason it genuinely cannot be done right now, reply with a short honest note about that instead.`;

  const messages = [{ role: 'user', content: `[Scheduled instruction firing now] ${instruction}` }];
  const reply = await runToolLoop(user, messages, system, 4, { automated: true });
  return (reply || '').trim() || null;
}

async function runToolLoop(user, messages, system, maxRounds = 5, ctx = {}) {
  const convo = [...messages];
  // Third-party app tools (Composio) for the apps THIS user has connected.
  // Built once per turn; never throws — an outage just means no app tools.
  let integrations;

  // Rounds spent only on find_app_tools (looking up / loading an app's tools)
  // don't eat into the real budget — up to 2 free rounds per turn.
  let freeRounds = 2;
  for (let round = 0; round < maxRounds; round++) {
    // Rebuilt each round (cached underneath) so tools loaded by find_app_tools
    // in one round are callable in the next.
    integrations = await integrationToolsForUser(user);
    const response = await claude.chatWithTools(convo, {
      system,
      tools: [
        ...calendarTools,
        ...taskTools,
        ...goalTools,
        ...auditTools,
        ...vaultTools,
        ...browserTools,
        ...gmailTools,
        ...driveTools,
        ...shopifyTools,
        ...newsTools,
        ...memoryTools,
        ...mapsTools,
        ...webmailTools,
        ...voiceTools,
        ...healthTools,
        ...workTools,
        ...automationTools,
        ...agentTools,
        ...imageToolsAvailable(),
        ...brainTools,
        ...recordsTools,
        ...integrations.tools,
      ],
      maxTokens: 2048,
    });

    if (response.stop_reason === 'tool_use') {
      convo.push({ role: 'assistant', content: response.content });
      const uses = response.content.filter((b) => b.type === 'tool_use');
      if (freeRounds > 0 && uses.length && uses.every((b) => b.name === 'find_app_tools')) { freeRounds--; maxRounds++; }

      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        let result;
        if (integrations.names.has(block.name)) {
          // Checked first: app tool names are Composio slugs, and anything not
          // matched below would otherwise fall through to the calendar executor.
          result = await executeIntegrationTool(user, { name: block.name, input: block.input }, ctx);
        } else if (imageToolNames.has(block.name)) {
          result = await executeImageTool(user, { name: block.name, input: block.input });
        } else if (brainToolNames.has(block.name)) {
          result = await executeBrainTool(user, { name: block.name, input: block.input }, ctx);
        } else if (recordsToolNames.has(block.name)) {
          result = await executeRecordsTool(user, { name: block.name, input: block.input });
        } else if (taskToolNames.has(block.name)) {
          result = await executeTaskTool(user, { name: block.name, input: block.input });
        } else if (goalToolNames.has(block.name)) {
          result = await executeGoalTool(user, { name: block.name, input: block.input });
        } else if (auditToolNames.has(block.name)) {
          result = await executeAuditTool(user, { name: block.name, input: block.input });
        } else if (vaultToolNames.has(block.name)) {
          result = await executeVaultTool(user, { name: block.name, input: block.input });
        } else if (browserToolNames.has(block.name)) {
          result = await executeBrowserTool(user, { name: block.name, input: block.input });
        } else if (gmailToolNames.has(block.name)) {
          result = await executeGmailTool(user, { name: block.name, input: block.input });
        } else if (driveToolNames.has(block.name)) {
          result = await executeDriveTool(user, { name: block.name, input: block.input });
        } else if (shopifyToolNames.has(block.name)) {
          result = await executeShopifyTool(user, { name: block.name, input: block.input });
        } else if (newsToolNames.has(block.name)) {
          result = await executeNewsTool(user, { name: block.name, input: block.input });
        } else if (memoryToolNames.has(block.name)) {
          result = await executeMemoryTool(user, { name: block.name, input: block.input });
        } else if (mapsToolNames.has(block.name)) {
          result = await executeMapsTool(user, { name: block.name, input: block.input });
        } else if (webmailToolNames.has(block.name)) {
          result = await executeWebmailTool(user, { name: block.name, input: block.input });
        } else if (voiceToolNames.has(block.name)) {
          result = await executeVoiceTool(user, { name: block.name, input: block.input });
        } else if (healthToolNames.has(block.name)) {
          result = await executeHealthTool(user, { name: block.name, input: block.input });
        } else if (workToolNames.has(block.name)) {
          result = await executeWorkTool(user, { name: block.name, input: block.input });
        } else if (automationToolNames.has(block.name)) {
          result = await executeAutomationTool(user, { name: block.name, input: block.input });
        } else if (agentToolNames.has(block.name)) {
          result = await executeAgentTool(user, { name: block.name, input: block.input });
        } else {
          result = await executeCalendarTool(user, { name: block.name, input: block.input });
        }

        // Audit trail: record any action that actually changed something (best-effort).
        try { require('../db/agentActions').logToolAction(user.id, block.name, result); } catch (_) { /* never break the reply */ }

        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      convo.push({ role: 'user', content: toolResults });
      continue;
    }

    const text = claude.textOf(response);
    if (text && text.trim()) return text;
    return 'Done ✅';
  }

  return `I've handled that ✅`;
}

function cleanName(text) {
  let t = text.trim()
    .replace(/^(hi|hello|hey)[,!\s]+/i, '')
    .replace(/^(i'?m|i am|my name is|call me|it'?s)\s+/i, '')
    .replace(/[.!]+$/, '')
    .trim();
  if (!t) t = text.trim();
  return t.split(/\s+/).slice(0, 3).join(' ');
}

function parseWorkHours(text) {
  const t = text.toLowerCase();
  const times = [...t.matchAll(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/g)];
  const to24 = (m) => {
    if (!m) return null;
    let h = parseInt(m[1], 10);
    const min = m[2] ? m[2] : '00';
    const mer = m[3];
    if (mer === 'pm' && h < 12) h += 12;
    if (mer === 'am' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${min}`;
  };
  const start = times[0] ? to24(times[0]) : '09:00';
  const end = times[1] ? to24(times[1]) : '18:00';
  return { start: start || '09:00', end: end || '18:00' };
}

module.exports = {
  handleMessage,
  runConversation,
  runAutomatedInstruction,
};
