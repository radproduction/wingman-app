'use strict';

const { db, uuid } = require('./index');

/**
 * Upsert a delivery. De-dupes on (user_id, tracking_number) when present,
 * else on (user_id, source_email_id), else on (user_id, item_name).
 */
function upsert(userId, d) {
  let existing = null;
  if (d.trackingNumber) {
    existing = db.prepare('SELECT id FROM deliveries WHERE user_id = ? AND tracking_number = ?')
      .get(userId, d.trackingNumber);
  }
  if (!existing && d.sourceEmailId) {
    existing = db.prepare('SELECT id FROM deliveries WHERE user_id = ? AND source_email_id = ?')
      .get(userId, d.sourceEmailId);
  }
  if (!existing && d.itemName) {
    existing = db.prepare('SELECT id FROM deliveries WHERE user_id = ? AND item_name = ?')
      .get(userId, d.itemName);
  }

  const row = {
    user_id: userId,
    item_name: d.itemName || null,
    merchant: d.merchant || null,
    carrier: d.carrier || null,
    tracking_number: d.trackingNumber || null,
    status: d.status || 'in_transit',
    estimated_delivery: d.estimatedDelivery || null,
    delivered_at: d.deliveredAt || null,
    return_window_ends: d.returnWindowEnds || null,
    source_email_id: d.sourceEmailId || null,
  };

  if (existing) {
    const prev = db.prepare('SELECT status FROM deliveries WHERE id = ?').get(existing.id);
    db.prepare(`
      UPDATE deliveries SET item_name=@item_name, merchant=@merchant, carrier=@carrier,
        tracking_number=@tracking_number, status=@status, estimated_delivery=@estimated_delivery,
        delivered_at=@delivered_at, return_window_ends=@return_window_ends,
        source_email_id=@source_email_id WHERE id=@id
    `).run({ ...row, id: existing.id });
    return { id: existing.id, isNew: false, statusChanged: prev && prev.status !== row.status };
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO deliveries (id, user_id, item_name, merchant, carrier, tracking_number,
      status, estimated_delivery, delivered_at, return_window_ends, source_email_id)
    VALUES (@id, @user_id, @item_name, @merchant, @carrier, @tracking_number,
      @status, @estimated_delivery, @delivered_at, @return_window_ends, @source_email_id)
  `).run({ ...row, id });
  return { id, isNew: true, statusChanged: true };
}

function listForUser(userId) {
  return db.prepare('SELECT * FROM deliveries WHERE user_id = ? ORDER BY estimated_delivery ASC').all(userId);
}

function getById(id) {
  return db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
}

/** Active (not delivered) deliveries. */
function listActive(userId) {
  return db.prepare("SELECT * FROM deliveries WHERE user_id = ? AND status != 'delivered' ORDER BY estimated_delivery ASC").all(userId);
}

module.exports = { upsert, listForUser, getById, listActive };
