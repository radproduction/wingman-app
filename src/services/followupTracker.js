'use strict';

const usersRepo = require('../db/users');
const followupsRepo = require('../db/followups');
const t = require('../utils/time');
const claude = require('../llm/claude');

function wa() { return require('../whatsapp/client'); }

// Cheap regex pre-filter so we only spend Claude tokens on likely commitments.
const PROMISE_HINTS = /(i'?ll send|i will send|will share|get back to you|i'?ll get|send (?:it|you|the)|by (?:eod|end of day|tomorrow|monday|tuesday|wednesday|thursday|friday|next week)|i'?ll have|have it ready|revert by|circle back)/i;

function mightContainCommitment(text) {
  return PROMISE_HINTS.test(text || '');
}

/**
 * Use Claude to extract commitments from a single email body.
 * Returns { promisesMade: [...], promisesReceived: [...] } where each item is
 * { description, counterparty, dueDate (YYYY-MM-DD|null) }.
 */
async function extractCommitments({ subject, sender, body, userIsSender, todayDate }) {
  const prompt = `You extract commitments from an email. Respond ONLY with valid JSON, no markdown, no backticks.

Return this shape:
{
  "promises_made": [ { "description": "short action the SENDER promised to do", "counterparty": "who it's for", "due_date": "YYYY-MM-DD or null" } ],
  "promises_received": [ { "description": "short action someone promised TO the reader", "counterparty": "who promised", "due_date": "YYYY-MM-DD or null" } ]
}

Rules:
- "promises_made" = commitments the email's SENDER makes (e.g. "I'll send the proposal by Friday").
- "promises_received" = commitments made TO the reader.
- If this email was sent BY the reader (userIsSender=${!!userIsSender}), their statements are promises_made.
- Resolve relative dates against today = ${todayDate}. If no date, use null.
- Empty arrays if none. Keep descriptions under 12 words.

Email subject: ${subject || ''}
Email from: ${sender || ''}
Email body: ${(body || '').slice(0, 1500)}`;

  let raw;
  try {
    raw = await claude.complete(prompt, { maxTokens: 500 });
  } catch (err) {
    console.warn('[followupTracker] Claude failed:', err.message);
    return { promisesMade: [], promisesReceived: [] };
  }
  const parsed = safeParse(raw);
  return {
    promisesMade: (parsed.promises_made || []).map(norm),
    promisesReceived: (parsed.promises_received || []).map(norm),
  };
}

function norm(x) {
  return {
    description: (x.description || '').trim(),
    counterparty: (x.counterparty || '').trim() || null,
    dueDate: x.due_date && /^\d{4}-\d{2}-\d{2}$/.test(x.due_date) ? x.due_date : null,
  };
}

function safeParse(raw) {
  if (!raw) return {};
  let s = String(raw).trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();
  const a = s.indexOf('{'); const b = s.lastIndexOf('}');
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  try { return JSON.parse(s); } catch (_) { return {}; }
}

/**
 * Process one analyzed email item into followups (called by the scanner).
 * @param {string} userId
 * @param {Object} emailItem  { id, subject, sender, ... }
 * @param {Object} ctx        { body, userIsSender, todayDate }
 * @returns {Promise<number>} number of followups created
 */
async function processEmail(userId, emailItem, ctx) {
  const body = ctx.body || '';
  if (!mightContainCommitment(`${emailItem.subject} ${body}`)) return 0;

  const { promisesMade, promisesReceived } = await extractCommitments({
    subject: emailItem.subject,
    sender: emailItem.sender,
    body,
    userIsSender: ctx.userIsSender,
    todayDate: ctx.todayDate,
  });

  let created = 0;
  for (const p of promisesMade) {
    if (!p.description) continue;
    followupsRepo.create(userId, {
      type: 'promise_made', description: p.description, counterparty: p.counterparty,
      dueDate: p.dueDate, sourceEmailId: emailItem.id,
    });
    created++;
  }
  for (const p of promisesReceived) {
    if (!p.description) continue;
    followupsRepo.create(userId, {
      type: 'promise_received', description: p.description, counterparty: p.counterparty,
      dueDate: p.dueDate, sourceEmailId: emailItem.id,
    });
    created++;
  }
  return created;
}

/**
 * Daily check: alert on overdue follow-ups.
 */
async function checkOverdue(userId, { now = new Date(), send = true } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { alerts: [] };
  const nowISO = now.toISOString();
  const overdue = followupsRepo.listOverdue(user.id, nowISO);

  const alerts = [];
  for (const f of overdue) {
    if (f.type === 'promise_made') {
      alerts.push(`\u23f3 You said you'd ${f.description}${f.counterparty ? ' (' + f.counterparty + ')' : ''}. Still pending?`);
    } else {
      alerts.push(`\u23f3 ${f.counterparty || 'Someone'} promised: ${f.description}. Following up?`);
    }
    followupsRepo.markStatus(f.id, 'overdue_alerted');
  }

  if (send && alerts.length) {
    try {
      if (wa().ready()) for (const a of alerts) await wa().sendMessage(user.phone, a);
    } catch (err) { console.warn('[followupTracker] alert failed:', err.message); }
  }
  return { alerts };
}

async function runDueUsers({ hour = 9, now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const u of users) {
    if (!gate.allows(u, 'followups')) continue;
    const tz = u.timezone || 'Asia/Karachi';
    if (t.hourInTz(tz, now) === hour) {
      results.push({ phone: u.phone, ...(await checkOverdue(u.id, { now })) });
    }
  }
  return results;
}

module.exports = { mightContainCommitment, extractCommitments, processEmail, checkOverdue, runDueUsers };
