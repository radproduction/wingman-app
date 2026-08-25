'use strict';

const { db, uuid } = require('./index');

/**
 * Upsert a bill. De-dupes on (user_id, source_email_id) when present,
 * else on (user_id, name, due_date).
 */
function upsert(userId, bill) {
  let existing = null;
  if (bill.sourceEmailId) {
    existing = db.prepare('SELECT id, status FROM bills WHERE user_id = ? AND source_email_id = ?')
      .get(userId, bill.sourceEmailId);
  }
  if (!existing && bill.name) {
    existing = db.prepare('SELECT id, status FROM bills WHERE user_id = ? AND name = ? AND IFNULL(due_date,\'\') = IFNULL(?,\'\')')
      .get(userId, bill.name, bill.dueDate || null);
  }

  const row = {
    user_id: userId,
    name: bill.name || null,
    amount: bill.amount != null ? Number(bill.amount) : null,
    currency: bill.currency || 'PKR',
    due_date: bill.dueDate || null,
    status: bill.status || 'pending',
    recurring: bill.recurring ? 1 : 0,
    source_email_id: bill.sourceEmailId || null,
  };

  if (existing) {
    // Never revert a bill the user already marked paid back to pending when a
    // re-scan of the same email re-imports it (that caused paid bills to nag again).
    const status = existing.status === 'paid' ? 'paid' : row.status;
    db.prepare(`
      UPDATE bills SET name=@name, amount=@amount, currency=@currency,
        due_date=@due_date, status=@status, recurring=@recurring,
        source_email_id=@source_email_id WHERE id=@id
    `).run({ ...row, status, id: existing.id });
    return existing.id;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO bills (id, user_id, name, amount, currency, due_date, status, recurring, source_email_id)
    VALUES (@id, @user_id, @name, @amount, @currency, @due_date, @status, @recurring, @source_email_id)
  `).run({ ...row, id });
  return id;
}

function listForUser(userId, { status } = {}) {
  if (status) {
    return db.prepare('SELECT * FROM bills WHERE user_id = ? AND status = ? ORDER BY due_date ASC')
      .all(userId, status);
  }
  return db.prepare('SELECT * FROM bills WHERE user_id = ? ORDER BY due_date ASC').all(userId);
}

/** Fuzzy-find a pending bill by name (case-insensitive substring). */
function findByName(userId, phrase) {
  const p = (phrase || '').toLowerCase().trim();
  if (!p) return null;
  const rows = db.prepare("SELECT * FROM bills WHERE user_id = ? AND status != 'paid'").all(userId);
  const matches = rows.filter((r) => {
    const n = (r.name || '').toLowerCase();
    return n.includes(p) || p.includes(n);
  });
  matches.sort((a, b) => (a.name || '').length - (b.name || '').length);
  return matches[0] || null;
}

function markPaid(id) {
  db.prepare("UPDATE bills SET status = 'paid' WHERE id = ?").run(id);
  return db.prepare('SELECT * FROM bills WHERE id = ?').get(id);
}

/**
 * Mark the pending bill matching `name` as paid — used when a payment/receipt
 * email is detected, so Wingman stops chasing a bill the user already settled.
 * Returns the bill that was cleared, or null if none matched.
 */
function markPaidByName(userId, name) {
  const bill = findByName(userId, name);
  if (!bill) return null;
  markPaid(bill.id);
  return bill;
}

/**
 * Stamp when we last alerted about these bills AND bump their reminder count, so
 * they don't re-notify daily and a still-unpaid bill isn't chased forever.
 */
function markAlerted(ids, whenISO) {
  if (!ids || !ids.length) return;
  const stmt = db.prepare(
    'UPDATE bills SET last_alerted_at = ?, reminder_count = COALESCE(reminder_count, 0) + 1 WHERE id = ?',
  );
  const tx = db.transaction((list) => { for (const id of list) stmt.run(whenISO, id); });
  tx(ids);
}

module.exports = { upsert, listForUser, findByName, markPaid, markPaidByName, markAlerted };
