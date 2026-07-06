'use strict';

const usersRepo = require('../db/users');
const contactsRepo = require('../db/contacts');
const emailItemsRepo = require('../db/emailItems');
const claude = require('../llm/claude');
const t = require('../utils/time');

/**
 * Parse a "From"/sender header into { name, email }.
 * e.g. `"Fahad Khan" <fahad@acme.com>` -> { name: 'Fahad Khan', email: 'fahad@acme.com' }
 */
function parseSender(sender) {
  if (!sender) return null;
  const m = sender.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (m) {
    const name = (m[1] || '').trim();
    const email = m[2].trim().toLowerCase();
    return { name: name || email, email };
  }
  const emailOnly = sender.trim().match(/[^\s<>]+@[^\s<>]+/);
  if (emailOnly) return { name: emailOnly[0].toLowerCase(), email: emailOnly[0].toLowerCase() };
  return null;
}

/**
 * Update the contacts table from a single analyzed email item.
 * Skips the user's own address and the SENT-mail case is handled by the caller.
 */
function recordFromEmail(userId, emailItem, ownAddress) {
  const parsed = parseSender(emailItem.sender);
  if (!parsed) return null;
  if (ownAddress && parsed.email === ownAddress.toLowerCase()) return null;
  return contactsRepo.recordInteraction(userId, {
    email: parsed.email,
    name: parsed.name,
    at: emailItem.created_at,
  });
}

/**
 * After a scan, (re)build contact stats from stored email_items and enrich
 * frequent contacts via Claude. Called from the email scanner.
 */
async function refreshContacts(userId, { enrich = true } = {}) {
  const user = usersRepo.getById(userId);
  const own = user && user.preferences ? (user.preferences.emailAddress || null) : null;

  // Rebuild interaction counts is unnecessary here since recordFromEmail is
  // called incrementally by the scanner; this method focuses on enrichment.
  if (!enrich) return { enriched: 0 };

  const toEnrich = contactsRepo.listForEnrichment(userId, 5);
  let enriched = 0;
  for (const contact of toEnrich) {
    try {
      const notes = await summarizeRelationship(userId, contact);
      if (notes) { contactsRepo.setNotes(contact.id, notes); enriched += 1; }
    } catch (err) { console.warn('[peopleCRM] enrichment failed:', err.message); }
  }
  return { enriched };
}

function safeParse(s) { try { return JSON.parse(s || '{}'); } catch (_) { return {}; } }

/** Ask Claude for a 2-sentence relationship summary from email subjects/snippets. */
async function summarizeRelationship(userId, contact) {
  const emails = emailItemsRepo.searchByKeyword(userId, contact.email).slice(0, 8);
  if (!emails.length) return null;
  const digest = emails
    .map((e) => `- ${e.subject || '(no subject)'}: ${e.summary || ''}`)
    .join('\n');
  const prompt = `Based on these email subjects and snippets, describe the relationship with this contact in 2 sentences. Be specific and concise.\n\nContact: ${contact.name} <${contact.email}>\n\nEmails:\n${digest}`;
  const out = await claude.complete(prompt, { maxTokens: 200 });
  return (out || '').trim();
}

// ── Conversational commands ──────────────────────────────────────────

function detectWhatDoIKnow(text) {
  const s = (text || '').toLowerCase();
  const m = s.match(/what do i know about ([a-z0-9\s.@'-]+?)\??$/);
  return m ? m[1].trim() : null;
}

function detectLastTalked(text) {
  const s = (text || '').toLowerCase();
  const m = s.match(/when did i (?:last )?(?:talk to|speak to|contact|email) ([a-z0-9\s.@'-]+?)\??$/);
  return m ? m[1].trim() : null;
}

function isTopContactsQuery(text) {
  const s = (text || '').toLowerCase();
  return /who (?:have i|did i) email(?:ed)? (?:the )?most/.test(s) || /top contacts/.test(s);
}

function buildContactReply(user, query) {
  const c = contactsRepo.find(user.id, query);
  if (!c) return `I don't have anyone matching "${query}" in your contacts yet.`;
  const lines = [`\ud83d\udc64 *${c.name}*`];
  if (c.email) lines.push(`\u2709\ufe0f ${c.email}`);
  lines.push(`\ud83d\udcac ${c.interaction_count || 0} interaction${c.interaction_count === 1 ? '' : 's'} \u2014 ${c.strength || 'occasional'}`);
  if (c.last_contacted_at) lines.push(`\ud83d\udd52 Last contact: ${labelDate(c.last_contacted_at, user.timezone)}`);
  if (c.notes) { lines.push(''); lines.push(c.notes); }
  return lines.join('\n');
}

function buildLastTalkedReply(user, query) {
  const c = contactsRepo.find(user.id, query);
  if (!c) return `I don't have anyone matching "${query}" in your contacts yet.`;
  if (!c.last_contacted_at) return `I have ${c.name} on record but no dated interactions yet.`;
  return `You last connected with *${c.name}* on ${labelDate(c.last_contacted_at, user.timezone)} (${c.interaction_count} total interactions).`;
}

function buildTopContactsReply(user) {
  const now = new Date();
  const monthStart = t.startOfDayISO(user.timezone || 'Asia/Karachi', 0, now).slice(0, 8) + '01';
  const top = contactsRepo.topContacts(user.id, { limit: 5, sinceISO: monthStart });
  const list = top.length ? top : contactsRepo.topContacts(user.id, { limit: 5 });
  if (!list.length) return 'No contacts recorded yet.';
  const lines = ['\ud83d\udcca *Top Contacts:*'];
  list.forEach((c, i) => lines.push(`${i + 1}. ${c.name} \u2014 ${c.interaction_count} interaction${c.interaction_count === 1 ? '' : 's'}`));
  return lines.join('\n');
}

function labelDate(iso, tz) {
  try { return t.dayLabel(iso, tz || 'Asia/Karachi'); } catch (_) { return (iso || '').slice(0, 10); }
}

module.exports = {
  parseSender, recordFromEmail, refreshContacts, summarizeRelationship,
  detectWhatDoIKnow, detectLastTalked, isTopContactsQuery,
  buildContactReply, buildLastTalkedReply, buildTopContactsReply,
};
