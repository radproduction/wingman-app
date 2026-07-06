'use strict';

const { db, uuid } = require('./index');

/**
 * Upsert a travel/trip record. De-dupes on (user_id, confirmation_code)
 * when present, else on (user_id, source_email_id), else on
 * (user_id, provider, depart_time).
 */
function upsert(userId, t) {
  let existing = null;
  if (t.confirmationCode) {
    existing = db.prepare('SELECT id FROM travel WHERE user_id = ? AND confirmation_code = ?')
      .get(userId, t.confirmationCode);
  }
  if (!existing && t.sourceEmailId) {
    existing = db.prepare('SELECT id FROM travel WHERE user_id = ? AND source_email_id = ?')
      .get(userId, t.sourceEmailId);
  }
  if (!existing && t.provider && t.departTime) {
    existing = db.prepare('SELECT id FROM travel WHERE user_id = ? AND provider = ? AND depart_time = ?')
      .get(userId, t.provider, t.departTime);
  }

  const row = {
    user_id: userId,
    trip_name: t.tripName || null,
    type: t.type || 'flight',
    provider: t.provider || null,
    confirmation_code: t.confirmationCode || null,
    origin: t.origin || null,
    destination: t.destination || null,
    depart_time: t.departTime || null,
    arrive_time: t.arriveTime || null,
    return_time: t.returnTime || null,
    hotel_name: t.hotelName || null,
    hotel_checkin: t.hotelCheckin || null,
    hotel_checkout: t.hotelCheckout || null,
    status: t.status || null,
    price: t.price != null ? Number(t.price) : null,
    currency: t.currency || 'PKR',
    metadata: JSON.stringify(t.metadata || {}),
    source_email_id: t.sourceEmailId || null,
  };

  if (existing) {
    // Merge: keep existing non-null fields when the incoming value is null.
    const prev = db.prepare('SELECT * FROM travel WHERE id = ?').get(existing.id);
    for (const k of Object.keys(row)) {
      if ((row[k] === null || row[k] === undefined) && prev[k] != null) row[k] = prev[k];
    }
    db.prepare(`
      UPDATE travel SET trip_name=@trip_name, type=@type, provider=@provider,
        confirmation_code=@confirmation_code, origin=@origin, destination=@destination,
        depart_time=@depart_time, arrive_time=@arrive_time, return_time=@return_time,
        hotel_name=@hotel_name, hotel_checkin=@hotel_checkin, hotel_checkout=@hotel_checkout,
        status=@status, price=@price, currency=@currency, metadata=@metadata,
        source_email_id=@source_email_id WHERE id=@id
    `).run({ ...row, id: existing.id });
    return existing.id;
  }

  const id = uuid();
  db.prepare(`
    INSERT INTO travel (id, user_id, trip_name, type, provider, confirmation_code,
      origin, destination, depart_time, arrive_time, return_time, hotel_name,
      hotel_checkin, hotel_checkout, status, price, currency, metadata, source_email_id)
    VALUES (@id, @user_id, @trip_name, @type, @provider, @confirmation_code,
      @origin, @destination, @depart_time, @arrive_time, @return_time, @hotel_name,
      @hotel_checkin, @hotel_checkout, @status, @price, @currency, @metadata, @source_email_id)
  `).run({ ...row, id });
  return id;
}

function hydrate(row) {
  if (!row) return row;
  try { row.metadata = JSON.parse(row.metadata || '{}'); } catch (_) { row.metadata = {}; }
  return row;
}

function getById(id) {
  return hydrate(db.prepare('SELECT * FROM travel WHERE id = ?').get(id));
}

function listForUser(userId) {
  return db.prepare('SELECT * FROM travel WHERE user_id = ? ORDER BY depart_time ASC').all(userId).map(hydrate);
}

/** Trips departing at/after `nowISO` (upcoming). */
function listUpcoming(userId, nowISO) {
  return db.prepare(
    'SELECT * FROM travel WHERE user_id = ? AND (depart_time IS NULL OR depart_time >= ?) ORDER BY depart_time ASC'
  ).all(userId, nowISO).map(hydrate);
}

/** Find the most relevant trip by fuzzy destination match. */
function findByDestination(userId, dest) {
  const like = `%${(dest || '').toLowerCase()}%`;
  return hydrate(db.prepare(
    `SELECT * FROM travel WHERE user_id = ?
       AND (LOWER(IFNULL(destination,'')) LIKE ? OR LOWER(IFNULL(trip_name,'')) LIKE ?)
     ORDER BY depart_time ASC LIMIT 1`
  ).get(userId, like, like));
}

function updateFields(id, fields = {}) {
  const allowed = ['trip_name', 'destination', 'depart_time', 'arrive_time', 'return_time',
    'hotel_name', 'hotel_checkin', 'hotel_checkout', 'status', 'price', 'currency', 'metadata'];
  const sets = []; const params = { id };
  for (const [k, v] of Object.entries(fields)) {
    if (!allowed.includes(k)) continue;
    sets.push(`${k} = @${k}`);
    params[k] = k === 'metadata' && typeof v === 'object' ? JSON.stringify(v) : v;
  }
  if (!sets.length) return getById(id);
  db.prepare(`UPDATE travel SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return getById(id);
}

module.exports = { upsert, listForUser, listUpcoming, findByDestination, getById, updateFields, hydrate };
