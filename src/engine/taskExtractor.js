'use strict';

const claude = require('../llm/claude');

/**
 * Detect whether a user message is a reminder / task request and, if so,
 * extract a clean task title and optional due time. Uses Claude and asks
 * for strict JSON so we can parse deterministically.
 *
 * @param {string} messageText
 * @param {Object} user  (for timezone/current-time context)
 * @returns {Promise<{isTask:boolean, title?:string, dueDate?:string|null, priority?:number}>}
 */
async function extractTask(messageText, user = {}) {
  const nowIso = new Date().toISOString();
  const system = `You extract task/reminder intents from short chat messages. Reply with ONLY a compact JSON object, no prose, no code fences.

Schema:
{"isTask": boolean, "title": string|null, "dueDate": string|null, "priority": number}

Rules:
- isTask is true only when the user is asking to remember, remind, add a to-do, follow up, or schedule a personal task.
- title: a short imperative task title (e.g. "Call Ali").
- dueDate: ISO 8601 datetime if a time/date is implied, else null. Current time is ${nowIso}. User timezone: ${user.timezone || 'Asia/Dubai'}. Resolve relative times ("4pm", "tomorrow") against that.
- priority: 1 (high) to 5 (low); default 3.
- If it is NOT a task, return {"isTask": false, "title": null, "dueDate": null, "priority": 3}.`;

  try {
    const raw = await claude.chat(
      [{ role: 'user', content: messageText }],
      { system, maxTokens: 200 }
    );
    const jsonStr = raw.trim().replace(/^```(json)?/i, '').replace(/```$/, '').trim();
    const parsed = JSON.parse(jsonStr);
    const result = {
      isTask: !!parsed.isTask,
      title: parsed.title || null,
      dueDate: parsed.dueDate || null,
      priority: Number.isFinite(parsed.priority) ? parsed.priority : 3,
    };
    if (result.isTask && result.title) return result;
    return heuristicTask(messageText, user);
  } catch (err) {
    // Fail safe: never break the conversation over extraction issues
    return heuristicTask(messageText, user);
  }
}

function heuristicTask(messageText, user = {}) {
  const text = String(messageText || '').trim();
  const lower = text.toLowerCase();
  const abilityQuestion =
    (text.includes('?') || /\b(can you|could you|will you|are you able|able to|do you support|can u|will u)\b/.test(lower)) &&
    /\b(task|tasks|google task|google tasks|reminder|todo|to-?do)\b/.test(lower);
  if (abilityQuestion) {
    return { isTask: false, title: null, dueDate: null, priority: 3 };
  }
  const looksLikeTask =
    /\b(remind|reminder|task|todo|to-?do|follow up|follow-up|yaad|yaad\s+dil|bana do|banao)\b/.test(lower) ||
    /\b(call|pay|send|buy|book|check|reply|meeting|followup)\b/.test(lower);

  if (!looksLikeTask) {
    return { isTask: false, title: null, dueDate: null, priority: 3 };
  }

  let title = text
    .replace(/\b(remind me|set (?:a )?reminder|add (?:a )?task|make (?:a )?task|create (?:a )?task|task banao|task bnao|ek task banao|mujhe yaad dilana|mujhe reminder (?:karwa|krwa) dena)\b/gi, ' ')
    .replace(/\b(kal|tomorrow|aaj|today|next week|5 bje|5 बजे|5pm|5 pm|\d{1,2}(?::\d{2})?\s*(am|pm)?|at \d{1,2}(?::\d{2})?\s*(am|pm)?|ko)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  title = title.replace(/^(mera|meri|mere|mujhe|please|plz)\s+/i, '').trim();
  if (!title) title = text;
  title = title.charAt(0).toUpperCase() + title.slice(1);

  const dueDate = parseLooseDueDate(text, user.timezone || 'Asia/Karachi');
  return { isTask: true, title, dueDate, priority: 3 };
}

function parseLooseDueDate(text, timezone) {
  const lower = String(text || '').toLowerCase();
  const dayOffset = /\b(kal|tomorrow)\b/.test(lower) ? 1 : /\b(aaj|today)\b/.test(lower) ? 0 : null;
  const timeMatch = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (dayOffset == null && !timeMatch) return null;

  let hour = 9;
  let minute = 0;
  if (timeMatch) {
    hour = Number(timeMatch[1]);
    minute = timeMatch[2] ? Number(timeMatch[2]) : 0;
    const mer = timeMatch[3];
    if (mer === 'pm' && hour < 12) hour += 12;
    if (mer === 'am' && hour === 12) hour = 0;
  }

  const { startOfDayISO } = require('../utils/time');
  const start = startOfDayISO(timezone, dayOffset == null ? 0 : dayOffset, new Date());
  const hh = String(hour).padStart(2, '0');
  const mm = String(minute).padStart(2, '0');
  const datePart = start.slice(0, 10);
  const offset = start.slice(19);
  return `${datePart}T${hh}:${mm}:00${offset}`;
}

module.exports = { extractTask };
