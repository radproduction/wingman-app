'use strict';

const usersRepo = require('../db/users');
const conversationsRepo = require('../db/conversations');
const tasksRepo = require('../db/tasks');
const claude = require('../llm/claude');
const { buildSystemPrompt } = require('./systemPrompt');
const { extractTask } = require('./taskExtractor');
const { calendarTools } = require('./calendarTools');
const { executeCalendarTool } = require('./calendarExecutor');
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
const { executeVoiceTool } = require('./voiceExecutor');
const { executeWebmailTool } = require('./webmailExecutor');
const { executeMapsTool } = require('./mapsExecutor');
const { executeMemoryTool } = require('./memoryExecutor');
const { executeNewsTool } = require('./newsExecutor');
const { executeShopifyTool } = require('./shopifyExecutor');
const googleAuth = require('../auth/googleAuth');
const config = require('../config');
const emailDigest = require('../services/emailDigest');
const taskIntents = require('./taskIntents');
const billAlerts = require('../services/billAlerts');
const deliveryAlerts = require('../services/deliveryAlerts');
const travelAssistant = require('../services/travelAssistant');
const peopleCRM = require('../services/peopleCRM');

/**
 * Handle an inbound WhatsApp message end-to-end.
 * - Looks up / creates the user
 * - Runs onboarding if incomplete
 * - Otherwise: loads history, calls Claude, creates tasks when relevant
 * - Persists both the user message and the assistant reply
 *
 * NOTE: This function persists the INBOUND user message itself (role='user'),
 * so the WhatsApp handler should NOT also log the inbound message.
 *
 * @param {Object} params
 * @param {string} params.text          the message body
 * @param {string} params.phoneNumber   digits-only WhatsApp number
 * @param {Object} [params.meta]        extra metadata (chatId, waMessageId, ...)
 * @returns {Promise<{reply:string, user:Object}>}
 */
async function handleMessage({ text, phoneNumber, meta = {} }) {
  // Separate-number model: Wingman runs on its OWN WhatsApp number. Only
  // users who have registered AND completed onboarding in the web app get a
  // response. Unknown numbers get a single, friendly bounce pointing them to
  // sign up — we do NOT auto-create users or run onboarding over WhatsApp.
  let user = usersRepo.getByPhone(phoneNumber);

  if (!user || !usersRepo.isOnboarded(user)) {
    return {
      reply:
        "Hi! I'm Wingman, a personal AI assistant. I only chat with registered users. " +
        `Set up your account here to get started: ${config.publicBaseUrl} \uD83D\uDE80`,
      user: user || null,
      ignored: true,
    };
  }

  // Always log the inbound user message first (so it is part of history)
  conversationsRepo.logMessage({
    userId: user.id,
    role: 'user',
    content: text,
    metadata: { direction: 'inbound', phoneNumber, ...meta },
  });

  let reply;

  const has = (skill) => usersRepo.hasSkill(user, skill);

  if (isConnectGoogleIntent(text)) {
    reply = buildConnectGoogleReply(user, phoneNumber);
  } else if (isTaskCapabilityQuestion(text)) {
    reply = buildTaskCapabilityReply(user, phoneNumber, text);
  } else if (looksLikeCreateTaskIntent(text)) {
    reply = await buildCreateTaskReply(user, text);
  } else if (isGoogleTasksIntent(text)) {
    reply = await buildGoogleTasksReply(user, phoneNumber, text);
  } else if (isConnectCalendarIntent(text)) {
    reply = buildConnectCalendarReply(user, phoneNumber);
  } else if (isConnectEmailIntent(text)) {
    reply = buildConnectEmailReply(user, phoneNumber);
  } else if (isCheckEmailIntent(text)) {
    reply = buildCheckEmailReply(user);
  } else if (has('bill_tracker') && billAlerts.detectMarkPaid(text)) {
    reply = billAlerts.handleMarkPaid(user, billAlerts.detectMarkPaid(text));
  } else if (has('bill_tracker') && billAlerts.isBillQuery(text)) {
    reply = billAlerts.buildBillsReply(user);
  } else if (has('delivery_tracker') && deliveryAlerts.isDeliveryQuery(text)) {
    reply = deliveryAlerts.buildDeliveriesReply(user);
  } else if (has('travel_assistant') && travelAssistant.detectItineraryQuery(text)) {
    reply = await travelAssistant.buildItineraryReply(user, travelAssistant.detectItineraryQuery(text));
  } else if (has('travel_assistant') && travelAssistant.detectTripCost(text)) {
    reply = travelAssistant.buildTripCostReply(user, travelAssistant.detectTripCost(text));
  } else if (has('travel_assistant') && travelAssistant.detectWeatherQuery(text)) {
    reply = await travelAssistant.buildWeatherReply(travelAssistant.detectWeatherQuery(text));
  } else if (has('travel_assistant') && travelAssistant.isTripsQuery(text)) {
    reply = travelAssistant.buildTripsReply(user);
  } else if (has('people_crm') && peopleCRM.detectWhatDoIKnow(text)) {
    reply = peopleCRM.buildContactReply(user, peopleCRM.detectWhatDoIKnow(text));
  } else if (has('people_crm') && peopleCRM.detectLastTalked(text)) {
    reply = peopleCRM.buildLastTalkedReply(user, peopleCRM.detectLastTalked(text));
  } else if (has('people_crm') && peopleCRM.isTopContactsQuery(text)) {
    reply = peopleCRM.buildTopContactsReply(user);
  } else if (taskIntents.detect(text)) {
    reply = await taskIntents.handle(user, taskIntents.detect(text));
  } else {
    reply = await runConversation(user, text);
  }

  // Log the assistant reply
  conversationsRepo.logMessage({
    userId: user.id,
    role: 'assistant',
    content: reply,
    metadata: { direction: 'outbound', phoneNumber },
  });

  return { reply, user };
}

/** Detect a "connect google / drive" request → combined consent (incl. Drive + Tasks). */
function isConnectGoogleIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\b(connect|reconnect|link)\b/.test(t) && /\b(google|drive)\b/.test(t);
}

/** Build the WhatsApp reply with the combined Google OAuth link (incl. Drive + Tasks). */
function buildConnectGoogleReply(user, phoneNumber) {
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  return `Tap this to connect Google — Calendar, Gmail, Drive & Tasks: ${url}`;
}

function isGoogleTasksIntent(text) {
  const t = (text || '').toLowerCase().trim();
  if (!/\bgoogle tasks?\b/.test(t) && !/\btask app\b/.test(t)) return false;
  return /\b(show|check|see|list|open|where|kahan|dekh|dikha|sync|connected|access|reconnect|connect|task)\b/.test(t);
}

function isTaskCapabilityQuestion(text) {
  const t = (text || '').toLowerCase().trim();
  if (!t.includes('?') && !/\b(can you|could you|will you|are you able|able to|do you support|can u|will u)\b/.test(t)) return false;
  return /\b(task|tasks|google task|google tasks|reminder|todo|to-?do)\b/.test(t);
}

function looksLikeCreateTaskIntent(text) {
  const t = (text || '').toLowerCase().trim();
  if (isTaskCapabilityQuestion(t)) return false;
  return /\b(remind|reminder|task|todo|to-?do|yaad|yaad\s+dil|bana do|banao|follow up|follow-up)\b/.test(t);
}

function messageStyle(text, user) {
  const raw = String(text || '').trim();
  if (/[؀-ۿ]/.test(raw)) return 'arabic';
  const lower = raw.toLowerCase();
  const romanSignals = /\b(kya|kaise|mujhe|mera|meri|mere|kal|aaj|baje|kr|kar|karna|kar do|banao|yaad|dilana|hai|ho|haan|nahi|bhai|yar)\b/;
  const englishSignals = /\b(can|could|will|would|create|add|task|tasks|reminder|tomorrow|today|call|write|show|please|able)\b/;
  if (romanSignals.test(lower) && !englishSignals.test(lower)) return 'roman';
  if (englishSignals.test(lower) && !romanSignals.test(lower)) return 'en';
  return (user && user.language === 'ar') ? 'arabic' : (user && user.language === 'ur' ? 'roman' : 'en');
}

function buildTaskCapabilityReply(user, phoneNumber, text) {
  const style = messageStyle(text, user);
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  const googleTasks = require('../services/googleTasks');
  if (!googleTasks.isConnected(user)) {
    return style === 'roman'
      ? `Haan, me Google Tasks ke sath kaam kar sakta hoon, lekin pehle Google ko reconnect karna hoga: ${url}`
      : `Yes, I can work with Google Tasks, but Google needs to be reconnected first: ${url}`;
  }
  return style === 'roman'
    ? 'Haan — agar tum mujhe task do, me usay Wingman me bana kar Google Tasks me sync karne ki koshish karunga.'
    : 'Yes — if you give me a task, I will create it in Wingman and sync it to Google Tasks.';
}

async function buildGoogleTasksReply(user, phoneNumber, text = '') {
  const style = messageStyle(text, user);
  const googleTasks = require('../services/googleTasks');
  if (!googleTasks.isConnected(user)) {
    const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
    if (style === 'roman') {
      return `Google Tasks abhi connected nahi lag rahi. Is link se Google ko reconnect karo: ${url}\n\nUske baad Tasks page me sab tasks nazar aayengi.`;
    }
    return `Google Tasks doesn't look connected yet. Reconnect Google here: ${url}\n\nAfter that, your tasks will appear in the normal Tasks page.`;
  }

  try { await googleTasks.syncUser(user.id); } catch (_) { /* keep cached tasks */ }

  const tasks = tasksRepo.listForUser(user.id, { includeCompleted: false, limit: 8 });
  if (!tasks.length) {
    if (style === 'roman') {
      return 'Google Tasks connected hai ✅\n\nAbhi koi pending task nazar nahi aa rahi. App me Tasks page kholo, ya Google Tasks me ek test task bana ke refresh karo.';
    }
    return 'Google Tasks is connected ✅\n\nI do not see any pending tasks yet. Open the Tasks page in Wingman, or create a test task in Google Tasks and refresh.';
  }

  const lines = style === 'roman'
    ? [
        'Google Tasks connected hai ✅',
        '',
        'Google Tasks alag button me nahi aati — ye normal *Tasks* page me merged hoti hain.',
        '',
        '*Pending tasks:*',
      ]
    : [
        'Google Tasks is connected ✅',
        '',
        'Google Tasks does not have a separate button here — it is merged into the normal *Tasks* page.',
        '',
        '*Pending tasks:*',
      ];
  for (const task of tasks.slice(0, 5)) lines.push(`• ${task.title}`);
  lines.push('');
  lines.push(style === 'roman'
    ? 'Test ke liye Google Tasks app me ek task banao, phir Wingman me Tasks page refresh karo.'
    : 'For a quick test, create a task in Google Tasks, then refresh the Tasks page in Wingman.');
  return lines.join('\n');
}

async function buildCreateTaskReply(user, text) {
  const style = messageStyle(text, user);
  const task = await extractTask(text, user);
  if (!task.isTask || !task.title) return await runConversation(user, text);

  const created = tasksRepo.create({
    userId: user.id,
    title: task.title,
    source: 'whatsapp',
    priority: task.priority,
    dueDate: task.dueDate,
  });

  let sync = { synced: false, reason: 'NOT_CONNECTED' };
  try { sync = await require('../services/googleTasks').mirrorNewLocalTask(created.id); }
  catch (err) { sync = { synced: false, reason: err.message || 'SYNC_FAILED' }; }

  const due = task.dueDate
    ? `\n• Time: ${t.dayLabel(task.dueDate, user.timezone || 'Asia/Karachi')} ${t.timeLabel(task.dueDate, user.timezone || 'Asia/Karachi')}`
    : '';

  if (sync.synced) {
    return style === 'roman'
      ? `Done ✅\n\nTask bana di:\n• ${created.title}${due}\n\nYe Google Tasks me bhi sync ho gayi hai.`
      : `Done ✅\n\nTask created:\n• ${created.title}${due}\n\nIt has also synced to Google Tasks.`;
  }
  if (sync.reason === 'NOT_CONNECTED') {
    return style === 'roman'
      ? `Done ✅\n\nTask bana di:\n• ${created.title}${due}\n\nYe Wingman me save ho gayi hai. Google Tasks me bhejne ke liye Google ko reconnect karna hoga.`
      : `Done ✅\n\nTask created:\n• ${created.title}${due}\n\nIt was saved in Wingman, but Google needs to be reconnected before I can send it to Google Tasks.`;
  }
  return style === 'roman'
    ? `Done ✅\n\nTask bana di:\n• ${created.title}${due}\n\nWingman me save ho gayi hai, lekin Google Tasks sync abhi pending lag rahi hai.`
    : `Done ✅\n\nTask created:\n• ${created.title}${due}\n\nIt was saved in Wingman, but Google Tasks sync still looks pending.`;
}

/** Detect an explicit "connect calendar" request (deterministic, no LLM). */
function isConnectCalendarIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\bconnect\b/.test(t) && /\bcalendar\b/.test(t);
}

/** Build the WhatsApp reply containing the personalized OAuth link. */
function buildConnectCalendarReply(user, phoneNumber) {
  if (googleAuth.isConnected(user)) {
    return "Your Google Calendar is already connected \u2705\n\nTry: \"what's my schedule tomorrow?\"";
  }
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  return `Tap this to connect your Google Calendar: ${url}`;
}

/** Detect an explicit "connect email" request. */
function isConnectEmailIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\bconnect\b/.test(t) && /\b(email|gmail|inbox)\b/.test(t);
}

/** Build the WhatsApp reply with the OAuth link (combined scopes). */
function buildConnectEmailReply(user, phoneNumber) {
  if (googleAuth.isEmailConnected(user)) {
    return "Your email is already connected \u2705\n\nTry: \"check my email\"";
  }
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  return `Tap this to connect your email: ${url}`;
}

/** Detect a "check my email" / "any emails" request. */
function isCheckEmailIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\bcheck\b.*\b(email|inbox|mail)\b/.test(t) ||
         /\b(email|inbox)\b.*\bupdate\b/.test(t) ||
         /\bany (new )?(emails|mail)\b/.test(t);
}

/** Build the WhatsApp email digest reply from cached email_items. */
function buildCheckEmailReply(user) {
  if (!googleAuth.isEmailConnected(user)) {
    return "Let's connect your email first \u2014 just say 'connect email' and I'll send you a link. \uD83D\uDCE7";
  }
  return emailDigest.buildDigest(user.id);
}

/**
 * Step-based onboarding state machine stored in user.preferences.onboarding.step.
 * Steps: ask_name -> ask_timezone -> ask_hours -> complete
 */
async function runOnboarding(user, text, isNew) {
  const prefs = user.preferences || {};
  const ob = prefs.onboarding || { step: 'ask_name', complete: false };

  // Brand-new user who has sent their very first message: greet + ask name.
  // We only treat this as "the name" once we've already asked.
  if (isNew && ob.step === 'ask_name' && !ob.greeted) {
    ob.greeted = true;
    prefs.onboarding = ob;
    usersRepo.update(user.id, { preferences: prefs });
    return "Hey! I'm Wingman — your AI chief of staff. What should I call you? 🙌";
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
      return `Got it — ${tz}. ⏰\n\nLast thing: what are your work hours? (e.g. 9am to 6pm)`;
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
      // Should not happen, but recover gracefully
      ob.step = 'complete';
      ob.complete = true;
      prefs.onboarding = ob;
      usersRepo.update(user.id, { preferences: prefs });
      return runConversation(usersRepo.getById(user.id), text);
  }
}

/**
 * Normal conversation: history + Claude, plus background task extraction.
 */
async function runConversation(user, text) {
  // Load last 20 messages (chronological) for context
  const history = conversationsRepo.historyForUser(user.id, 20);

  // Map to Claude message format. The current inbound message is already the
  // last row in history (we logged it before calling this).
  const messages = history.map((row) => ({
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content || '',
  }));

  // Ensure the array ends with a user turn (Claude requires it)
  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: text });
  }

  const system = buildSystemPrompt(user);

  // Tool-use loop: let Claude call calendar tools until it produces text.
  let reply = await runToolLoop(user, messages, system);

  // Background: detect and create a task if this looks like a reminder/to-do.
  // (Skipped when the message clearly triggered a calendar operation is fine
  //  too — task extraction is conservative and returns isTask=false otherwise.)
  try {
    const task = await extractTask(text, user);
    if (task.isTask && task.title) {
      const created = tasksRepo.create({
        userId: user.id,
        title: task.title,
        source: 'whatsapp',
        priority: task.priority,
        dueDate: task.dueDate,
      });
      try { await require('../services/googleTasks').mirrorNewLocalTask(created.id); } catch (_) { /* best-effort */ }
    }
  } catch (_) {
    // non-fatal
  }

  // Learn durable things about the user from this conversation (background —
  // must never delay or break the reply).
  try {
    require('../services/behaviorLearner')
      .learnForUser(user.id)
      .catch((e) => console.warn('[behaviorLearner]', e.message));
  } catch (_) { /* non-fatal */ }

  return reply;
}

/**
 * Run the Claude tool-use loop. Executes any calendar tool_use blocks,
 * feeds results back, and repeats until Claude returns a final text answer.
 */
async function runToolLoop(user, messages, system, maxRounds = 4) {
  const convo = [...messages];

  for (let round = 0; round < maxRounds; round++) {
    const response = await claude.chatWithTools(convo, {
      system,
      tools: [...calendarTools, ...gmailTools, ...driveTools, ...shopifyTools, ...newsTools, ...memoryTools, ...mapsTools, ...webmailTools, ...voiceTools, ...healthTools, ...workTools],
      maxTokens: 1024,
    });

    if (response.stop_reason === 'tool_use') {
      // Append the assistant turn (must include the tool_use blocks verbatim)
      convo.push({ role: 'assistant', content: response.content });

      // Execute every tool_use block and collect tool_result blocks
      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        let result;
        if (gmailToolNames.has(block.name)) {
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
        } else {
          result = await executeCalendarTool(user, { name: block.name, input: block.input });
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }
      convo.push({ role: 'user', content: toolResults });
      continue; // loop again so Claude can read the results
    }

    // No tool use -> final text answer
    const text = claude.textOf(response);
    if (text && text.trim()) return text;
    return "Done \u2705";
  }

  // Safety net if we somehow never got a text answer
  return "I've handled that on your calendar \u2705";
}

// ─── helpers ────────────────────────────────────────────────────────

function cleanName(text) {
  // Strip common lead-ins like "I'm", "My name is", "Call me"
  let t = text.trim()
    .replace(/^(hi|hello|hey)[,!\s]+/i, '')
    .replace(/^(i'?m|i am|my name is|call me|it'?s)\s+/i, '')
    .replace(/[.!]+$/, '')
    .trim();
  if (!t) t = text.trim();
  // Keep it reasonable
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
  isConnectCalendarIntent,
  buildConnectCalendarReply,
  isConnectEmailIntent,
  buildConnectEmailReply,
  isCheckEmailIntent,
  buildCheckEmailReply,
};
