'use strict';

const { db } = require('../db');
const calendarEventsRepo = require('../db/calendarEvents');
const emailItemsRepo = require('../db/emailItems');
const tasksRepo = require('../db/tasks');

function deleteDerivedByEmailIds(userId, emailIds) {
  if (!emailIds || !emailIds.length) return { bills: 0, deliveries: 0, travel: 0, followups: 0 };
  const placeholders = emailIds.map(() => '?').join(', ');
  const params = [userId, ...emailIds];
  return {
    bills: db.prepare(`DELETE FROM bills WHERE user_id = ? AND source_email_id IN (${placeholders})`).run(...params).changes,
    deliveries: db.prepare(`DELETE FROM deliveries WHERE user_id = ? AND source_email_id IN (${placeholders})`).run(...params).changes,
    travel: db.prepare(`DELETE FROM travel WHERE user_id = ? AND source_email_id IN (${placeholders})`).run(...params).changes,
    followups: db.prepare(`DELETE FROM followups WHERE user_id = ? AND source_email_id IN (${placeholders})`).run(...params).changes,
  };
}

function pruneBrainState(userId) {
  try {
    const usersRepo = require('../db/users');
    const peopleCRM = require('./peopleCRM');
    peopleCRM.refreshContacts(userId, { enrich: false }).catch(() => {});
    const user = usersRepo.getById(userId);
    if (!user) return;
    const prefs = { ...(user.preferences || {}) };
    delete prefs.lastEmailScan;
    usersRepo.update(userId, { preferences: prefs });
  } catch (_) { /* best-effort */ }
}

function cleanupAccount(userId, account) {
  const emailIds = emailItemsRepo.listIdsByAccount(userId, account.id);
  const derived = deleteDerivedByEmailIds(userId, emailIds);
  const emailItems = emailItemsRepo.deleteByAccount(userId, account.id);
  const calendarEvents = calendarEventsRepo.deleteByAccount(userId, account.id);
  const detachedTasks = tasksRepo.clearGoogleSyncByAccount(userId, account.id);
  const removedImportedTasks = tasksRepo.removeGoogleImportedByAccount(userId, account.id);
  pruneBrainState(userId);
  return {
    email_items: emailItems,
    calendar_events: calendarEvents,
    detached_tasks: detachedTasks,
    removed_imported_tasks: removedImportedTasks,
    ...derived,
  };
}

function cleanupAllGoogleData(userId) {
  const emailIds = db.prepare('SELECT id FROM email_items WHERE user_id = ?').all(userId).map((r) => r.id);
  const derived = deleteDerivedByEmailIds(userId, emailIds);
  const emailItems = emailItemsRepo.deleteAllForUser(userId);
  const calendarEvents = calendarEventsRepo.deleteAllForUser(userId);
  const detachedTasks = tasksRepo.clearAllGoogleSync(userId);
  const removedImportedTasks = tasksRepo.removeAllGoogleImported(userId);
  pruneBrainState(userId);
  return {
    email_items: emailItems,
    calendar_events: calendarEvents,
    detached_tasks: detachedTasks,
    removed_imported_tasks: removedImportedTasks,
    ...derived,
  };
}

async function resyncPrimaryData(userId) {
  try { await require('./googleTasks').syncUser(userId); } catch (_) { /* best-effort */ }
  try { await require('./emailScanner').scanUser(userId); } catch (_) { /* best-effort */ }
  try {
    const user = require('../db/users').getById(userId);
    if (user && require('../auth/googleAuth').isConnected(user)) {
      const from = new Date(Date.now() - 7 * 86400000).toISOString();
      const to = new Date(Date.now() + 45 * 86400000).toISOString();
      await require('./calendar').getEvents(userId, { from, to });
    }
  } catch (_) { /* best-effort */ }
}

module.exports = { cleanupAccount, cleanupAllGoogleData, resyncPrimaryData };
