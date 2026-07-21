'use strict';

const cron = require('node-cron');
const usersRepo = require('../db/users');
const emailItemsRepo = require('../db/emailItems');
const billsRepo = require('../db/bills');
const deliveriesRepo = require('../db/deliveries');
const travelRepo = require('../db/travel');
const gmail = require('./gmail');
const { analyzeEmail } = require('./emailAnalyzer');
const googleAuth = require('../auth/googleAuth');
const deliveryAlerts = require('./deliveryAlerts');
const followupTracker = require('./followupTracker');
const peopleCRM = require('./peopleCRM');
const travelAssistant = require('./travelAssistant');
const t = require('../utils/time');

// wa is required lazily to avoid a circular dependency at module load
function wa() { return require('../whatsapp/client'); }

/**
 * Scan a single user's inbox: fetch recent messages, analyze new ones,
 * persist, fan-out to bills/deliveries/travel, and alert on urgent items.
 *
 * @param {string} userId
 * @param {Object} [opts]
 * @param {number} [opts.maxResults=50]
 * @returns {Promise<{scanned:number, newItems:number, urgent:number}>}
 */
async function scanUser(userId, { maxResults = 50 } = {}) {
  const user = usersRepo.getById(userId);
  if (!user || !googleAuth.isEmailConnected(user)) {
    return { scanned: 0, newItems: 0, urgent: 0, skipped: 'not_connected' };
  }

  // Only scan since the last scan (fallback: recent inbox)
  const lastScan = user.preferences && user.preferences.lastEmailScan;
  const query = lastScan
    ? `newer_than:2d in:inbox`   // Gmail query granularity is coarse; we also de-dupe by id
    : `in:inbox newer_than:7d`;

  // Record the user's own email address once, so we can detect sent mail
  // (promises made) reliably.
  if (!(user.preferences && user.preferences.emailAddress)) {
    try {
      const prof = await gmail.getProfile(user);
      if (prof && prof.emailAddress) {
        usersRepo.updatePreferences(userId, { emailAddress: prof.emailAddress });
        user = usersRepo.getById(userId);
      }
    } catch (_) { /* non-fatal */ }
  }

  // Scan EVERY linked Google account, so a user with personal + work mailboxes
  // gets alerts from both. Each message is paired with the account it came from
  // so it is fetched with the right credentials. A failing account is skipped.
  const items = [];
  const seenIds = new Set();
  for (const account of gmail.accountsFor(user)) {
    try {
      const ids = await gmail.listMessageIds(user, { maxResults, query, account });
      // Also include recent SENT mail so the follow-up tracker can capture
      // commitments the user made ("I'll send…").
      const sentIds = await gmail.listMessageIds(user, { maxResults: 20, query: 'in:sent newer_than:7d', account });
      for (const id of [...ids, ...sentIds]) {
        if (seenIds.has(id)) continue;
        seenIds.add(id);
        items.push({ id, account });
      }
    } catch (err) {
      console.warn(`[emailScanner] list failed for ${(account && account.email) || user.phone}:`, err.message);
    }
  }

  let newItems = 0;
  let urgent = 0;

  for (const { id, account } of items) {
    if (emailItemsRepo.existsByGmailId(userId, id)) continue; // de-dupe

    let msg;
    try {
      msg = await gmail.getMessage(user, id, account);
    } catch (err) {
      console.warn(`[emailScanner] fetch ${id} failed:`, err.message);
      continue;
    }

    const analysis = await analyzeEmail({
      subject: msg.subject,
      sender: msg.sender,
      body: msg.body || msg.snippet,
    });

    // Persist the analyzed email
    const emailItemId = emailItemsRepo.upsert(userId, {
      gmailId: msg.gmailId,
      accountId: account && account.id ? account.id : null,
      accountEmail: account && account.email ? account.email : null,
      subject: msg.subject,
      sender: msg.sender,
      category: analysis.category,
      summary: analysis.summary,
      actionNeeded: analysis.actionNeeded,
      draftReply: analysis.draftReply,
      detectedType: analysis.detectedType,
      extractedData: analysis.extractedData,
    });
    newItems++;

    // Fan-out to typed tables
    try {
      const fan = fanOut(userId, emailItemId, analysis);
      // Delivery status-change alert
      if (fan && fan.delivery && fan.delivery.statusChanged) {
        const d = deliveriesRepo.getById(fan.delivery.id);
        if (d) await deliveryAlerts.sendStatusAlert(user, d);
      }
      // Compile flight + hotel into a single trip itinerary
      if (fan && fan.tripId) {
        try { travelAssistant.compileItinerary(userId, fan.tripId); }
        catch (e) { console.warn('[emailScanner] itinerary compile failed:', e.message); }
      }
    } catch (err) {
      console.warn('[emailScanner] fan-out failed:', err.message);
    }

    // People CRM: record the sender as a contact interaction
    try {
      const own = user.preferences && user.preferences.emailAddress;
      peopleCRM.recordFromEmail(userId, {
        sender: msg.sender, created_at: new Date().toISOString(),
      }, own);
    } catch (err) {
      console.warn('[emailScanner] contact update failed:', err.message);
    }

    // Follow-up commitment detection (promises made/received)
    try {
      const tz = user.timezone || 'Asia/Karachi';
      const todayDate = t.startOfDayISO(tz, 0).slice(0, 10);
      const userIsSender = isFromUser(user, msg.sender) ||
        (msg.labelIds && msg.labelIds.includes('SENT'));
      await followupTracker.processEmail(userId, {
        id: emailItemId, subject: msg.subject, sender: msg.sender,
      }, { body: msg.body || msg.snippet, userIsSender, todayDate });
    } catch (err) {
      console.warn('[emailScanner] followup detection failed:', err.message);
    }

    // Urgent alert
    if (analysis.category === 'urgent') {
      urgent++;
      await sendUrgentAlert(user, msg.sender, analysis.summary);
    }
  }

  // Record last scan time
  usersRepo.updatePreferences(userId, { lastEmailScan: new Date().toISOString() });

  // Enrich frequent contacts (5+ interactions) via Claude, best-effort.
  try { await peopleCRM.refreshContacts(userId, { enrich: true }); }
  catch (err) { console.warn('[emailScanner] CRM enrichment failed:', err.message); }

  return { scanned: items.length, newItems, urgent };
}

/**
 * Insert/update typed records based on detected_type + extracted_data.
 */
function fanOut(userId, emailItemId, analysis) {
  const d = analysis.extractedData || {};

  if (analysis.detectedType === 'bill') {
    billsRepo.upsert(userId, {
      name: d.company || 'Bill',
      amount: parseAmount(d.amount),
      currency: parseCurrency(d.amount),
      dueDate: d.due_date || null,
      status: 'pending',
      sourceEmailId: emailItemId,
    });
  } else if (analysis.detectedType === 'order') {
    const delivery = deliveriesRepo.upsert(userId, {
      itemName: d.item || 'Order',
      merchant: d.store || null,
      carrier: d.carrier || null,
      trackingNumber: d.tracking_number || null,
      estimatedDelivery: d.eta || null,
      status: 'in_transit',
      sourceEmailId: emailItemId,
    });
    return { delivery };
  } else if (analysis.detectedType === 'flight') {
    const departTime = joinDateTime(d.flight_date, d.flight_time);
    const tripId = travelRepo.upsert(userId, {
      tripName: [d.departure, d.arrival].filter(Boolean).join(' → ') || 'Flight',
      type: 'flight',
      provider: d.airline || null,
      confirmationCode: d.flight_number || null,
      origin: d.departure || null,
      destination: d.arrival || null,
      departTime,
      status: 'scheduled',
      sourceEmailId: emailItemId,
    });
    return { tripId };
  }
}

async function sendUrgentAlert(user, sender, summary) {
  const text = `🚨 Urgent email from ${cleanSender(sender)}: ${summary}`;
  try {
    if (wa().ready()) {
      await wa().sendMessage(user.phone, text);
    } else {
      console.log('[emailScanner] (WA not ready) would alert:', text);
    }
  } catch (err) {
    console.warn('[emailScanner] urgent alert failed:', err.message);
  }
}

// ── helpers ──────────────────────────────────────────────────────────

function parseAmount(amountStr) {
  if (amountStr == null) return null;
  const m = String(amountStr).replace(/,/g, '').match(/[\d.]+/);
  return m ? Number(m[0]) : null;
}

function parseCurrency(amountStr) {
  if (!amountStr) return 'PKR';
  const s = String(amountStr).toUpperCase();
  if (s.includes('AED') || s.includes('DHS') || s.includes('DIRHAM')) return 'AED';
  if (s.includes('USD') || s.includes('$')) return 'USD';
  if (s.includes('PKR') || s.includes('RS')) return 'PKR';
  if (s.includes('EUR') || s.includes('€')) return 'EUR';
  if (s.includes('GBP') || s.includes('£')) return 'GBP';
  return 'PKR';
}

function joinDateTime(date, time) {
  if (!date) return null;
  return time ? `${date}T${time}:00` : `${date}T00:00:00`;
}

function cleanSender(sender) {
  if (!sender) return 'someone';
  const m = sender.match(/^\s*"?([^"<]+?)"?\s*</);
  return (m ? m[1] : sender).trim();
}

/** Heuristic: was this email sent by the user themselves? */
function isFromUser(user, sender) {
  if (!sender) return false;
  const emailPref = user.preferences && user.preferences.emailAddress;
  if (emailPref && sender.toLowerCase().includes(String(emailPref).toLowerCase())) return true;
  return false;
}

/**
 * Scan all Gmail-connected users (used by cron).
 */
async function scanAllUsers() {
  const users = usersRepo.listConnectedEmailUsers();
  const results = [];
  for (const u of users) {
    try {
      results.push({ phone: u.phone, ...(await scanUser(u.id)) });
    } catch (err) {
      results.push({ phone: u.phone, error: err.message });
    }
  }
  if (results.length) console.log('[emailScanner] cron scan:', JSON.stringify(results));
  return results;
}

let cronTask = null;

/**
 * Start the every-15-minutes cron job. Idempotent.
 */
function startCron() {
  if (cronTask) return cronTask;
  cronTask = cron.schedule('*/15 * * * *', () => {
    scanAllUsers().catch((e) => console.warn('[emailScanner] cron error:', e.message));
  });
  console.log('[emailScanner] cron scheduled: every 15 minutes');
  return cronTask;
}

module.exports = { scanUser, scanAllUsers, startCron, fanOut };
