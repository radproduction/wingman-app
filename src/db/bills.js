'use strict';

const { db, uuid } = require('./index');

/**
 * Upsert a bill. De-dupes on (user_id, source_email_id) when present,
 * else on (user_id, name, due_date).
 */
function upsert(userId, bill) {
  let existing = null;
  if (bill.sourceEmailId) {
    existing = db.prepare('SELECT id FROM bills WHERE user_id = ? AND source_email_id = ?')
      .get(userId, bill.sourceEmailId);
  }
  if (!existing && bill.name) {
    existing = db.prepare('SELECT id FROM bills WHERE user_id = ? AND name = ? AND IFNULL(due_date,\'\') = IFNULL(?,\'\')')
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
    db.prepare(`
      UPDATE bills SET name=@name, amount=@amount, currency=@currency,
        due_date=@due_date, status=@status, recurring=@recurring,
        source_email_id=@source_email_id WHERE id=@id
    `).run({ ...row, id: existing.id });
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

module.exports = { upsert, listForUser, findByName, markPaid };
