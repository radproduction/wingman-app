'use strict';

const usersRepo = require('../db/users');
const goalsRepo = require('../db/goals');
const t = require('../utils/time');

function wa() { return require('../whatsapp/client'); }

/**
 * "Always working on your goals." For each active goal, proactively surface the
 * NEXT step — at most once per goal per local day, and only during daytime hours
 * so nobody is nudged at 3am. The near-duplicate guard in the WhatsApp client is
 * a second line of defence against repeats.
 */
async function runForUser(userId, { now = new Date() } = {}) {
  const user = usersRepo.getById(userId);
  if (!user) return { sent: 0 };
  const tz = user.timezone || 'Asia/Karachi';
  const hour = t.hourInTz(tz, now);
  if (hour < 9 || hour >= 21) return { sent: 0 }; // daytime only

  const todayKey = t.dateKeyInTz(tz, now);
  const goals = goalsRepo.listActive(user.id);
  let sent = 0;

  for (const g of goals) {
    // Once per goal per local day.
    if (g.last_nudge_at && String(g.last_nudge_at).slice(0, 10) === todayKey) continue;
    const next = (g.plan || []).find((s) => !s.done);
    if (!next) continue; // plan complete but goal not marked done — don't nag

    const msg = `🎯 On your goal *${g.title}* — next up: ${next.step}\n\n`
      + 'Want me to help with this, or set a reminder? Just reply and I\'ll take it from there.';
    try {
      if (wa().ready()) {
        const r = await wa().sendMessage(user.phone, msg);
        if (!(r && r.duplicate)) sent += 1;
      }
    } catch (e) { console.warn('[goalCoach] send failed:', e.message); }
    goalsRepo.update(g.id, { lastNudgeAt: now.toISOString() });
  }
  return { sent };
}

async function runAllUsers({ now = new Date() } = {}) {
  const gate = require('./proactiveGate');
  const users = usersRepo.listOnboarded();
  const out = [];
  for (const u of users) {
    if (!gate.allows(u, 'goals')) continue;
    try {
      const r = await runForUser(u.id, { now });
      if (r.sent) out.push({ phone: u.phone, nudged: r.sent });
    } catch (e) { console.warn('[goalCoach] failed for', u.phone, e.message); }
  }
  if (out.length) console.log('[goalCoach] nudged', out.length, 'user(s)');
  return out;
}

module.exports = { runForUser, runAllUsers };
