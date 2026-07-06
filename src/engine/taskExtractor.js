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
    return {
      isTask: !!parsed.isTask,
      title: parsed.title || null,
      dueDate: parsed.dueDate || null,
      priority: Number.isFinite(parsed.priority) ? parsed.priority : 3,
    };
  } catch (err) {
    // Fail safe: never break the conversation over extraction issues
    return { isTask: false, title: null, dueDate: null, priority: 3 };
  }
}

module.exports = { extractTask };
