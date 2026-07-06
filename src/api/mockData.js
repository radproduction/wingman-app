'use strict';

/**
 * Rich, investor-ready mock dataset for the Wingman dashboard.
 *
 * All timestamps are generated relative to "now" so the dashboard always looks
 * current. Dates are rendered in the user's Asia/Dubai context by the client.
 * This is served whenever the requested user has no live data yet (e.g. before
 * Google is connected), so every page looks fully populated for screenshots.
 */

function iso(offsetMinutes) {
  return new Date(Date.now() + offsetMinutes * 60000).toISOString();
}
function isoDays(days, hour, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}
function todayAt(hour, minute = 0) {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const USER = {
  id: 'demo-aamir',
  phone: '971500000000',
  name: 'Aamir',
  timezone: 'Asia/Dubai',
  work_hours_start: '09:00',
  work_hours_end: '18:00',
  language: 'en',
  health_connected: 1,
  gmail_connected: false,
  calendar_connected: false,
};

const CALENDAR = [
  { id: 'e1', title: 'Team standup', location: 'Zoom', start_time: todayAt(10, 0), end_time: todayAt(10, 30), attendees: ['Sara', 'Bilal', 'Omar'], status: 'confirmed', has_conflict: 0 },
  { id: 'e2', title: 'Client call — Fahad (Vitafur)', location: 'Google Meet', start_time: todayAt(12, 0), end_time: todayAt(12, 45), attendees: ['Fahad Khan'], status: 'confirmed', has_conflict: 0 },
  { id: 'e3', title: 'Product review — Wingman', location: 'Office / Meeting Room 2', start_time: todayAt(14, 0), end_time: todayAt(15, 0), attendees: ['Sara', 'Omar'], status: 'confirmed', has_conflict: 0 },
  { id: 'e4', title: 'Investor sync — Seed round', location: 'Zoom', start_time: todayAt(16, 30), end_time: todayAt(17, 15), attendees: ['Yousuf (VC)'], status: 'confirmed', has_conflict: 1 },
  { id: 'e5', title: 'Gym — strength', location: 'Fitness First, JLT', start_time: todayAt(18, 30), end_time: todayAt(19, 30), attendees: [], status: 'confirmed', has_conflict: 0 },
  { id: 'e6', title: 'Dinner with Ali', location: 'Zuma, DIFC', start_time: isoDays(1, 20, 0), end_time: isoDays(1, 22, 0), attendees: ['Ali'], status: 'confirmed', has_conflict: 0 },
  { id: 'e7', title: 'Ramada campaign kickoff', location: 'Ramada HQ', start_time: isoDays(1, 11, 0), end_time: isoDays(1, 12, 0), attendees: ['Marketing team'], status: 'confirmed', has_conflict: 0 },
];

const EMAILS = [
  { id: 'm1', gmail_id: 'g1', sender: 'Emergent Cloud <billing@emergent.io>', subject: 'Invoice #4821 — payment due', category: 'urgent', summary: 'Monthly cloud invoice of PKR 250,000 is due July 15.', action_needed: 1, replied: 0, detected_type: 'bill', created_at: iso(-40), draft_reply: null },
  { id: 'm2', gmail_id: 'g2', sender: 'AWS <no-reply@amazon.com>', subject: 'Your production instance is at 92% CPU', category: 'urgent', summary: 'Sustained high CPU on prod for 20 minutes — may need scaling.', action_needed: 1, replied: 0, detected_type: 'general', created_at: iso(-95), draft_reply: null },
  { id: 'm3', gmail_id: 'g3', sender: 'Fahad Khan <fahad@vitafur.com>', subject: 'Re: Dubai meeting agenda', category: 'needs_reply', summary: 'Fahad shared the agenda and asks to confirm the 12pm slot.', action_needed: 1, replied: 0, detected_type: 'meeting_request', created_at: iso(-160), draft_reply: 'Hi Fahad — 12pm works. See you then.' },
  { id: 'm4', gmail_id: 'g4', sender: 'Sara Ahmed <sara@rad.ae>', subject: 'Q3 budget approval needed', category: 'needs_reply', summary: 'Sara needs sign-off on the Q3 marketing budget by Thursday.', action_needed: 1, replied: 0, detected_type: 'general', created_at: iso(-220), draft_reply: null },
  { id: 'm5', gmail_id: 'g5', sender: 'Amazon.ae <shipment@amazon.ae>', subject: 'Your order has shipped', category: 'fyi', summary: 'Sony WH-1000XM5 shipped via Aramex, arriving in 2 days.', action_needed: 0, replied: 0, detected_type: 'order', created_at: iso(-300), draft_reply: null },
  { id: 'm6', gmail_id: 'g6', sender: 'Emirates <no-reply@emirates.com>', subject: 'Booking confirmed — EK601', category: 'fyi', summary: 'Flight DXB→KHI on July 10 confirmed. Seat 14A.', action_needed: 0, replied: 0, detected_type: 'flight', created_at: iso(-520), draft_reply: null },
  { id: 'm7', gmail_id: 'g7', sender: 'Product Hunt <hello@producthunt.com>', subject: 'Weekly digest', category: 'fyi', summary: 'Top launches this week in AI and productivity.', action_needed: 0, replied: 0, detected_type: 'general', created_at: iso(-900), draft_reply: null },
  { id: 'm8', gmail_id: 'g8', sender: 'LinkedIn <news@linkedin.com>', subject: 'You appeared in 27 searches', category: 'fyi', summary: 'Your profile appeared in 27 searches this week.', action_needed: 0, replied: 0, detected_type: 'general', created_at: iso(-1100), draft_reply: null },
];

const TASKS = [
  { id: 't1', title: 'Call Ali re: PopVapor supply', source: 'whatsapp', priority: 1, due_date: todayAt(16, 0), completed: 0, recurring: null },
  { id: 't2', title: 'Approve Q3 marketing budget', source: 'email', priority: 1, due_date: todayAt(17, 0), completed: 0, recurring: null },
  { id: 't3', title: 'Review Wingman investor deck', source: 'manual', priority: 2, due_date: todayAt(20, 0), completed: 0, recurring: null },
  { id: 't4', title: 'Send Vitafur proposal', source: 'email', priority: 2, due_date: isoDays(1, 12, 0), completed: 0, recurring: null },
  { id: 't5', title: 'Pay Emergent invoice', source: 'email', priority: 1, due_date: isoDays(-1, 18, 0), completed: 0, recurring: null },
  { id: 't6', title: 'Book Dubai→Karachi return leg', source: 'manual', priority: 3, due_date: isoDays(2, 10, 0), completed: 0, recurring: null },
  { id: 't7', title: 'Morning workout', source: 'manual', priority: 3, due_date: todayAt(7, 0), completed: 1, recurring: 'daily' },
  { id: 't8', title: 'Standup notes to team', source: 'manual', priority: 3, due_date: todayAt(11, 0), completed: 1, recurring: null },
  { id: 't9', title: 'Reply to Sara', source: 'email', priority: 2, due_date: todayAt(15, 0), completed: 1, recurring: null },
];

const BILLS = [
  { id: 'b1', name: 'Amex Platinum', amount: 340000, currency: 'PKR', due_date: isoDays(3, 0), status: 'pending', recurring: 1 },
  { id: 'b2', name: 'Emergent Cloud', amount: 250000, currency: 'PKR', due_date: isoDays(-1, 0), status: 'overdue', recurring: 1 },
  { id: 'b3', name: 'DEWA (utilities)', amount: 920, currency: 'AED', due_date: isoDays(6, 0), status: 'pending', recurring: 1 },
  { id: 'b4', name: 'Etisalat (mobile)', amount: 415, currency: 'AED', due_date: isoDays(9, 0), status: 'pending', recurring: 1 },
  { id: 'b5', name: 'Adobe Creative Cloud', amount: 22000, currency: 'PKR', due_date: isoDays(12, 0), status: 'pending', recurring: 1 },
  { id: 'b6', name: 'Office rent — JLT', amount: 8500, currency: 'AED', due_date: isoDays(-8, 0), status: 'paid', recurring: 1 },
];

const DELIVERIES = [
  { id: 'd1', item_name: 'Nike Air Max 270', merchant: 'Nike.ae', carrier: 'Aramex', tracking_number: 'ARX-88213带', status: 'out_for_delivery', estimated_delivery: todayAt(19, 0), return_window_ends: null },
  { id: 'd2', item_name: 'Sony WH-1000XM5', merchant: 'Amazon.ae', carrier: 'Aramex', tracking_number: 'ARX-77120', status: 'in_transit', estimated_delivery: isoDays(2, 18), return_window_ends: null },
  { id: 'd3', item_name: 'Apple Magic Keyboard', merchant: 'Apple', carrier: 'FedEx', tracking_number: 'FX-55010', status: 'in_transit', estimated_delivery: isoDays(3, 15), return_window_ends: null },
  { id: 'd4', item_name: 'Herman Miller cushion', merchant: 'Amazon.ae', carrier: 'Aramex', tracking_number: 'ARX-41002', status: 'delivered', estimated_delivery: isoDays(-2, 14), delivered_at: isoDays(-2, 14), return_window_ends: isoDays(12, 0) },
];
// fix accidental non-ascii in tracking
DELIVERIES[0].tracking_number = 'ARX-88213';

const TRAVEL = [
  {
    id: 'v1', trip_name: 'Dubai → Karachi', type: 'flight', provider: 'Emirates', confirmation_code: 'EK601',
    origin: 'Dubai (DXB)', destination: 'Karachi (KHI)', depart_time: isoDays(4, 3, 30), arrive_time: isoDays(4, 7, 15),
    return_time: isoDays(8, 22, 0), status: 'confirmed', price: 1850, currency: 'AED',
    hotel_name: 'Movenpick Karachi', hotel_checkin: isoDays(4, 12), hotel_checkout: isoDays(8, 12),
  },
];

const HEALTH = {
  connected: true,
  sleep_hours: 6.2,
  sleep_target: 8,
  hrv: 42,
  resting_hr: 61,
  steps: 3421,
  steps_target: 8000,
  calories: 1980,
  readiness: 68,
  recommendation: 'Your HRV is a touch low and sleep was under target. Consider a lighter morning and a 20-min walk after lunch.',
  week_sleep: [7.1, 6.8, 5.9, 7.4, 6.2, 6.9, 6.2],
  week_steps: [8200, 6400, 9100, 5200, 7800, 4300, 3421],
};

const CONTACTS = [
  { id: 'c1', name: 'Fahad Khan', email: 'fahad@vitafur.com', company: 'Vitafur', relationship: 'Client', interaction_count: 18, strength: 'close', last_contacted_at: iso(-160), notes: 'Key client on the Vitafur account. Detail-oriented, prefers morning meetings. Currently reviewing the Q3 proposal.' },
  { id: 'c2', name: 'Sara Ahmed', email: 'sara@rad.ae', company: 'Rad', relationship: 'Team', interaction_count: 42, strength: 'close', last_contacted_at: iso(-220), notes: 'Head of Marketing at Rad. Owns Q3 budget and campaign delivery.' },
  { id: 'c3', name: 'Ali Raza', email: 'ali@popvapor.com', company: 'PopVapor', relationship: 'Partner', interaction_count: 11, strength: 'regular', last_contacted_at: iso(-1400), notes: 'Supply-chain partner for PopVapor. Responsive on WhatsApp.' },
  { id: 'c4', name: 'Yousuf Malik', email: 'yousuf@northstar.vc', company: 'NorthStar VC', relationship: 'Investor', interaction_count: 7, strength: 'regular', last_contacted_at: iso(-3000), notes: 'Lead on the seed round conversation. Wants monthly metric updates.' },
  { id: 'c5', name: 'Omar Sheikh', email: 'omar@rad.ae', company: 'Rad', relationship: 'Team', interaction_count: 33, strength: 'close', last_contacted_at: iso(-500), notes: 'Product lead on Wingman.' },
  { id: 'c6', name: 'Bilal Noor', email: 'bilal@rad.ae', company: 'Rad', relationship: 'Team', interaction_count: 15, strength: 'close', last_contacted_at: iso(-800), notes: 'Backend engineer.' },
];

const FOLLOWUPS = [
  { id: 'f1', type: 'promise_made', description: 'Send the Vitafur Q3 proposal', counterparty: 'Fahad Khan', due_date: isoDays(1, 12), status: 'open' },
  { id: 'f2', type: 'promise_made', description: 'Share seed-round metrics deck', counterparty: 'Yousuf (NorthStar VC)', due_date: isoDays(-1, 18), status: 'open' },
  { id: 'f3', type: 'promise_received', description: 'Ali to confirm PopVapor supply dates', counterparty: 'Ali Raza', due_date: isoDays(2, 12), status: 'open' },
];

const BRIEFINGS = [
  { id: 'br1', type: 'morning', content: 'Good morning, Aamir. You have 4 meetings today, 2 urgent emails, and the Amex bill is due in 3 days.', sent_at: todayAt(7, 0) },
  { id: 'br2', type: 'evening', content: 'Evening wrap: 3/8 tasks done, 4 meetings attended. Tomorrow: Ramada kickoff at 11am.', sent_at: isoDays(-1, 20) },
];

module.exports = {
  user: USER,
  calendar: CALENDAR,
  emails: EMAILS,
  tasks: TASKS,
  bills: BILLS,
  deliveries: DELIVERIES,
  travel: TRAVEL,
  health: HEALTH,
  contacts: CONTACTS,
  followups: FOLLOWUPS,
  briefings: BRIEFINGS,
};
