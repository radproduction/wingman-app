'use strict';

const claude = require('../llm/claude');

/**
 * Turn raw meeting notes (typed now; a transcript later) into a clean,
 * structured summary + action items. Pure function over the notes — it never
 * invents facts. Returns a normalized object even if the model misbehaves.
 */

const SYSTEM = `You are a meeting scribe. You are given the raw notes from a meeting and you turn them into a clean, structured summary.

Return ONLY a JSON object, no markdown and no commentary, with exactly this shape:
{
  "noContent": false,
  "overview": "2-3 sentence plain-English summary of what the meeting was about and where it landed",
  "discussion": ["a key point discussed", "..."],
  "decisions": ["a decision that was made", "..."],
  "actions": [{ "task": "what needs doing", "owner": "person's name, or empty string if unassigned", "due": "when, e.g. 'Friday' or 'Next week', or empty string", "priority": "High" | "Medium" | "Low" }],
  "openQuestions": ["something left unresolved", "..."],
  "followUps": ["a follow-up to schedule or send", "..."]
}

Rules:
- Base everything ONLY on the notes. Do not invent people, dates, or decisions.
- Use an empty array [] for any section with nothing in it.
- Keep each item short and concrete.
- Owner must be a name that appears in the notes/attendees, otherwise empty string.
- CRITICAL: If the notes are missing, empty, unintelligible, corrupted, just filler/repetition, or contain no real meeting discussion, set "noContent": true, "overview": "" and EVERY array empty. In that case do NOT describe the recording or transcript quality, and do NOT invent any action items, questions or follow-ups. Otherwise set "noContent": false.`;

function extractJson(text) {
  if (!text) return null;
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  try { return JSON.parse(t); } catch (_) { return null; }
}

const strArr = (x) => (Array.isArray(x) ? x.map((v) => String(v || '').trim()).filter(Boolean) : []);

function normalize(p) {
  const o = p || {};
  return {
    noContent: o.noContent === true,
    overview: typeof o.overview === 'string' ? o.overview.trim() : '',
    discussion: strArr(o.discussion),
    decisions: strArr(o.decisions),
    actions: (Array.isArray(o.actions) ? o.actions : [])
      .map((a) => ({
        task: String((a && a.task) || '').trim(),
        owner: String((a && a.owner) || '').trim(),
        due: String((a && a.due) || '').trim(),
        priority: ['High', 'Medium', 'Low'].includes(a && a.priority) ? a.priority : 'Medium',
      }))
      .filter((a) => a.task),
    openQuestions: strArr(o.openQuestions),
    followUps: strArr(o.followUps),
  };
}

/**
 * @param {{ title?: string, attendees?: Array<{name?:string}>, notes?: string }} meeting
 * @returns {Promise<object>} normalized summary
 */
async function summarize({ title, attendees = [], notes } = {}) {
  const who = (Array.isArray(attendees) ? attendees : [])
    .map((a) => a && a.name)
    .filter(Boolean)
    .join(', ');

  const prompt = [
    title ? `Meeting: ${title}` : null,
    who ? `Attendees: ${who}` : null,
    '',
    'Raw notes:',
    (notes && String(notes).trim()) || '(no notes were taken)',
  ]
    .filter((x) => x !== null)
    .join('\n');

  const raw = await claude.complete(prompt, { system: SYSTEM, maxTokens: 1500 });
  return normalize(extractJson(raw));
}

module.exports = { summarize, normalize };
