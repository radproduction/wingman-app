'use strict';

const { google } = require('googleapis');
const googleAuth = require('../auth/googleAuth');
const usersRepo = require('../db/users');
const tasksRepo = require('../db/tasks');
const accountsRepo = require('../db/googleAccounts');

const TASKS_SCOPE = 'https://www.googleapis.com/auth/tasks';

function scopesOf(account) {
  const raw = (account && account.scopes) || '';
  return String(raw).split(/\s+/).filter(Boolean);
}

function hasTasksScope(account) {
  return scopesOf(account).includes(TASKS_SCOPE);
}

function connectedAccounts(user) {
  if (!user || !user.id) return [];
  try {
    return accountsRepo.listForUser(user.id).filter(hasTasksScope);
  } catch (_) {
    return [];
  }
}

function isConnected(user) {
  return connectedAccounts(user).length > 0;
}

function primaryTasksAccount(user) {
  const list = connectedAccounts(user);
  return list[0] || null;
}

function tasksFor(user, account) {
  const auth = googleAuth.getAuthorizedClient(user, 'calendar', account);
  return google.tasks({ version: 'v1', auth });
}

async function listTasklists(service) {
  const out = [];
  let pageToken;
  do {
    const res = await service.tasklists.list({ maxResults: 100, pageToken });
    out.push(...(res.data.items || []));
    pageToken = res.data.nextPageToken || null;
  } while (pageToken);
  return out;
}

async function listTasks(service, tasklistId) {
  const out = [];
  let pageToken;
  do {
    const res = await service.tasks.list({
      tasklist: tasklistId,
      maxResults: 100,
      showCompleted: true,
      showDeleted: true,
      showHidden: true,
      pageToken,
    });
    out.push(...(res.data.items || []));
    pageToken = res.data.nextPageToken || null;
  } while (pageToken);
  return out;
}

function normalizeDue(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function pushOneTask(user, account, task) {
  const service = tasksFor(user, account);
  const tasklist = task.google_tasklist_id || '@default';

  if (!task.google_task_id || task.sync_state === 'pending_create') {
    const res = await service.tasks.insert({
      tasklist,
      requestBody: {
        title: task.title,
        due: normalizeDue(task.due_date),
        status: task.completed ? 'completed' : 'needsAction',
        completed: task.completed ? (task.completed_at || new Date().toISOString()) : undefined,
      },
    });
    return tasksRepo.updateSyncMeta(task.id, {
      googleTaskId: res.data.id,
      googleTasklistId: tasklist === '@default' ? (res.data.selfLink && /\/lists\/([^/]+)\//.exec(res.data.selfLink || '')?.[1]) || '@default' : tasklist,
      googleAccountId: account.id,
      googleUpdatedAt: res.data.updated || null,
      syncState: 'synced',
    });
  }

  const requestBody = {
    title: task.title,
    due: normalizeDue(task.due_date),
    status: task.completed ? 'completed' : 'needsAction',
  };
  if (task.completed) requestBody.completed = task.completed_at || new Date().toISOString();

  const res = await service.tasks.patch({
    tasklist,
    task: task.google_task_id,
    requestBody,
  });

  return tasksRepo.updateSyncMeta(task.id, {
    googleTasklistId: tasklist,
    googleAccountId: account.id,
    googleUpdatedAt: res.data.updated || null,
    syncState: 'synced',
  });
}

async function flushPendingLocalChanges(user) {
  const primary = primaryTasksAccount(user);
  if (!primary) return { pushed: 0, skipped: 0, reason: 'NOT_CONNECTED' };

  const pending = tasksRepo.listPendingSync(user.id, 200);
  let pushed = 0;
  let skipped = 0;

  for (const task of pending) {
    try {
      const account = task.google_account_id
        ? accountsRepo.getById(task.google_account_id)
        : primary;
      if (!account || !hasTasksScope(account)) { skipped += 1; continue; }
      await pushOneTask(user, account, task);
      pushed += 1;
    } catch (err) {
      skipped += 1;
      console.warn('[googleTasks] push failed for', task.id, err.message);
    }
  }
  return { pushed, skipped };
}

async function syncUser(userId) {
  const user = usersRepo.getById(userId);
  if (!user) return { imported: 0, updated: 0, completed: 0, skipped: 0, reason: 'no_user' };

  const accounts = connectedAccounts(user);
  if (!accounts.length) return { imported: 0, updated: 0, completed: 0, skipped: 0, reason: 'NOT_CONNECTED' };

  await flushPendingLocalChanges(user);

  let imported = 0;
  let updated = 0;
  let completed = 0;
  let skipped = 0;

  for (const account of accounts) {
    const service = tasksFor(user, account);
    const lists = await listTasklists(service);
    const tasklists = lists.length ? lists : [{ id: '@default' }];

    for (const list of tasklists) {
      const tasks = await listTasks(service, list.id);
      for (const item of tasks) {
        const existing = tasksRepo.getByGoogleRef(user.id, {
          googleAccountId: account.id,
          googleTasklistId: list.id,
          googleTaskId: item.id,
        });

        if (existing && String(existing.sync_state || '').startsWith('pending_')) {
          skipped += 1;
          continue;
        }

        if (item.deleted) {
          if (existing && !existing.completed) {
            tasksRepo.complete(existing.id, { completedAt: item.completed || item.updated || new Date().toISOString() });
            tasksRepo.updateSyncMeta(existing.id, {
              googleAccountId: account.id,
              googleTasklistId: list.id,
              googleUpdatedAt: item.updated || null,
              syncState: 'synced',
            });
            completed += 1;
          } else {
            skipped += 1;
          }
          continue;
        }

        const row = tasksRepo.upsertFromGoogle(user.id, {
          title: item.title || 'Untitled',
          dueDate: item.due || null,
          completed: item.status === 'completed',
          completedAt: item.completed || null,
          googleTaskId: item.id,
          googleTasklistId: list.id,
          googleAccountId: account.id,
          googleUpdatedAt: item.updated || null,
        });
        if (existing) updated += 1; else if (row) imported += 1; else skipped += 1;
      }
    }
  }

  return { imported, updated, completed, skipped };
}

async function syncAllUsers() {
  const users = usersRepo.listOnboarded();
  const results = [];
  for (const user of users) {
    if (!isConnected(user)) continue;
    try {
      const r = await syncUser(user.id);
      if (r.imported || r.updated || r.completed) {
        results.push({ phone: user.phone, imported: r.imported, updated: r.updated, completed: r.completed });
      }
    } catch (err) {
      console.warn('[googleTasks] sync failed for', user.phone, err.message);
    }
  }
  if (results.length) console.log('[googleTasks]', JSON.stringify(results));
  return results;
}

async function mirrorNewLocalTask(taskId) {
  const task = tasksRepo.getById(taskId);
  if (!task) return { synced: false, reason: 'no_task' };
  const user = usersRepo.getById(task.user_id);
  if (!isConnected(user)) return { synced: false, reason: 'NOT_CONNECTED' };
  tasksRepo.markLocalDirty(taskId, 'pending_create');
  await flushPendingLocalChanges(user);
  return { synced: true };
}

async function mirrorTaskUpdate(taskId) {
  const task = tasksRepo.getById(taskId);
  if (!task) return { synced: false, reason: 'no_task' };
  const user = usersRepo.getById(task.user_id);
  if (!isConnected(user)) return { synced: false, reason: 'NOT_CONNECTED' };
  tasksRepo.markLocalDirty(taskId, task.google_task_id ? 'pending_update' : 'pending_create');
  await flushPendingLocalChanges(user);
  return { synced: true };
}

async function mirrorTaskCompletion(taskId) {
  const task = tasksRepo.getById(taskId);
  if (!task) return { synced: false, reason: 'no_task' };
  const user = usersRepo.getById(task.user_id);
  if (!isConnected(user)) return { synced: false, reason: 'NOT_CONNECTED' };
  tasksRepo.markLocalDirty(taskId, task.google_task_id ? 'pending_complete' : 'pending_create');
  await flushPendingLocalChanges(user);
  return { synced: true };
}

module.exports = {
  TASKS_SCOPE,
  hasTasksScope,
  isConnected,
  primaryTasksAccount,
  syncUser,
  syncAllUsers,
  flushPendingLocalChanges,
  mirrorNewLocalTask,
  mirrorTaskUpdate,
  mirrorTaskCompletion,
};
