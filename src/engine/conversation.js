'use strict';

const usersRepo = require('../db/users');
const conversationsRepo = require('../db/conversations');
const claude = require('../llm/claude');
const { buildSystemPrompt } = require('./systemPrompt');
const { calendarTools } = require('./calendarTools');
const { executeCalendarTool } = require('./calendarExecutor');
const { taskTools, taskToolNames } = require('./taskTools');
const { executeTaskTool } = require('./taskExecutor');
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
const billAlerts = require('../services/billAlerts');
const deliveryAlerts = require('../services/deliveryAlerts');
const travelAssistant = require('../services/travelAssistant');
const peopleCRM = require('../services/peopleCRM');

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

  let reply;
  const has = (skill) => usersRepo.hasSkill(user, skill);

  if (isConnectGoogleIntent(text)) {
    reply = buildConnectGoogleReply(phoneNumber);
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
  } else {
    reply = await runConversation(user, text);
  }

  conversationsRepo.logMessage({
    userId: user.id,
    role: 'assistant',
    content: reply,
    metadata: { direction: 'outbound', phoneNumber },
  });

  return { reply, user };
}

function isConnectGoogleIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\b(connect|reconnect|link)\b/.test(t) && /\b(google|drive)\b/.test(t);
}

function buildConnectGoogleReply(phoneNumber) {
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  return `Tap this to connect Google - Calendar, Gmail, Drive & Tasks: ${url}`;
}

function isConnectCalendarIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\bconnect\b/.test(t) && /\bcalendar\b/.test(t);
}

function buildConnectCalendarReply(user, phoneNumber) {
  if (googleAuth.isConnected(user)) {
    return `Your Google Calendar is already connected ✅\n\nTry: "what's my schedule tomorrow?"`;
  }
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  return `Tap this to connect your Google Calendar: ${url}`;
}

function isConnectEmailIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\bconnect\b/.test(t) && /\b(email|gmail|inbox)\b/.test(t);
}

function buildConnectEmailReply(user, phoneNumber) {
  if (googleAuth.isEmailConnected(user)) {
    return `Your email is already connected ✅\n\nTry: "check my email"`;
  }
  const url = `${config.publicBaseUrl}/auth/google?phone=${encodeURIComponent(phoneNumber)}`;
  return `Tap this to connect your email: ${url}`;
}

function isCheckEmailIntent(text) {
  const t = (text || '').toLowerCase().trim();
  return /\bcheck\b.*\b(email|inbox|mail)\b/.test(t)
    || /\b(email|inbox)\b.*\bupdate\b/.test(t)
    || /\bany (new )?(emails|mail)\b/.test(t);
}

function buildCheckEmailReply(user) {
  if (!googleAuth.isEmailConnected(user)) {
    return `Let's connect your email first - just say 'connect email' and I'll send you a link. 📧`;
  }
  return emailDigest.buildDigest(user.id);
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

async function runConversation(user, text) {
  const history = conversationsRepo.historyForUser(user.id, 20);
  const messages = history.map((row) => ({
    role: row.role === 'assistant' ? 'assistant' : 'user',
    content: row.content || '',
  }));

  if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
    messages.push({ role: 'user', content: text });
  }

  const system = buildSystemPrompt(user);
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

async function runToolLoop(user, messages, system, maxRounds = 4) {
  const convo = [...messages];

  for (let round = 0; round < maxRounds; round++) {
    const response = await claude.chatWithTools(convo, {
      system,
      tools: [
        ...calendarTools,
        ...taskTools,
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
      ],
      maxTokens: 1024,
    });

    if (response.stop_reason === 'tool_use') {
      convo.push({ role: 'assistant', content: response.content });

      const toolResults = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;

        let result;
        if (taskToolNames.has(block.name)) {
          result = await executeTaskTool(user, { name: block.name, input: block.input });
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
  isConnectCalendarIntent,
  buildConnectCalendarReply,
  isConnectEmailIntent,
  buildConnectEmailReply,
  isCheckEmailIntent,
  buildCheckEmailReply,
};
