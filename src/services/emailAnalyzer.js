'use strict';

const claude = require('../llm/claude');

const ANALYSIS_PROMPT = (subject, sender, body) => `Analyze this email. Respond ONLY in valid JSON, no markdown, no backticks:
{
  "category": "urgent|needs_reply|fyi|spam",
  "summary": "1-2 sentence summary",
  "action_needed": true or false,
  "detected_type": "bill|payment_receipt|order|flight|meeting_request|general",
  "extracted_data": {
    "company": "if bill or payment_receipt: company/biller name",
    "amount": "if bill or payment_receipt: amount with currency",
    "due_date": "if bill: YYYY-MM-DD",
    "item": "if order: item name",
    "store": "if order: store name",
    "tracking_number": "if order: tracking number or null",
    "carrier": "if order: carrier name or null",
    "eta": "if order: estimated delivery date or null",
    "airline": "if flight: airline name",
    "flight_number": "if flight: flight number",
    "departure": "if flight: departure city/airport",
    "arrival": "if flight: arrival city/airport",
    "flight_date": "if flight: YYYY-MM-DD",
    "flight_time": "if flight: HH:MM"
  },
  "draft_reply": "suggested reply text if action_needed, null otherwise"
}

detected_type guidance:
- "bill" = an invoice/statement the user still needs to PAY (has an amount due and usually a due date).
- "payment_receipt" = confirmation a payment ALREADY went through (words like "payment received", "receipt", "thank you for your payment", "your card was charged"). Set company and amount so the matching bill can be cleared. Do NOT mark these as "bill".

Email subject: ${subject}
Email from: ${sender}
Email body: ${body}`;

/**
 * Strip code fences / stray prose and parse JSON safely.
 */
function parseJson(raw) {
  let s = (raw || '').trim();
  s = s.replace(/^```(json)?/i, '').replace(/```$/, '').trim();
  // Grab the outermost {...} if there is extra text around it
  const first = s.indexOf('{');
  const last = s.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    s = s.slice(first, last + 1);
  }
  return JSON.parse(s);
}

/**
 * Analyze one email via Claude. Returns a normalized object; on failure,
 * returns a safe "fyi/general" fallback so the scan never crashes.
 *
 * @param {{subject:string, sender:string, body:string}} email
 */
async function analyzeEmail(email) {
  const prompt = ANALYSIS_PROMPT(email.subject || '(no subject)', email.sender || '(unknown)', email.body || '');
  try {
    const raw = await claude.complete(prompt, { maxTokens: 700 });
    const parsed = parseJson(raw);
    return {
      category: ['urgent', 'needs_reply', 'fyi', 'spam'].includes(parsed.category) ? parsed.category : 'fyi',
      summary: parsed.summary || '',
      actionNeeded: !!parsed.action_needed,
      detectedType: parsed.detected_type || 'general',
      extractedData: parsed.extracted_data || {},
      draftReply: parsed.draft_reply || null,
    };
  } catch (err) {
    return {
      category: 'fyi',
      summary: (email.subject || '').slice(0, 140),
      actionNeeded: false,
      detectedType: 'general',
      extractedData: {},
      draftReply: null,
      _error: err.message,
    };
  }
}

module.exports = { analyzeEmail, ANALYSIS_PROMPT, parseJson };
