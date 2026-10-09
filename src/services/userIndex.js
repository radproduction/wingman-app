'use strict';

/**
 * The user's searchable memory — layer 3 of "Wingman knows you".
 *
 * Wingman already syncs a lot into its own database (analysed emails, calendar
 * events, tasks, meeting notes and summaries, contacts, follow-ups, the chat
 * itself). This service keeps a full-text index (SQLite FTS5, see search_docs /
 * search_fts in schema.sql) over all of it, so the assistant can answer
 * "what did the client say last month?" with one fast local search instead of
 * live API calls — and across sources Gmail search can't see (meetings, chats).
 *
 * Indexing is incremental and runs from the scheduler: new rows by rowid, plus a
 * short look-back so edited rows (a meeting that got its summary, a completed
 * task) are refreshed, plus a prune of rows deleted at the source. Everything is
 * synchronous better-sqlite3 and best-effort — a failing source is skipped.
 */

const { db } = require('../db');

const BATCH = 1500;            // rows per source per tick
const LOOKBACK_DAYS = 3;       // re-index recent rows so edits are picked up
const BODY_CAP = 6000;

function clip(s, n = BODY_CAP) {
  const t = String(s == null ? '' : s).replace(/\s+\n/g, '\n').trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
}
function json(s, fallback) { try { return JSON.parse(s); } catch (_) { return fallback; } }

/** Turn a meeting summary JSON into readable text (it's stored as JSON). */
function flattenSummary(raw) {
  const s = json(raw, null);
  if (!s || typeof s !== 'object') return String(raw || '');
  const out = [];
  for (const [k, v] of Object.entries(s)) {
    if (Array.isArray(v)) {
      const items = v.map((x) => (typeof x === 'string' ? x : [x.task || x.text || x.title || '', x.owner ? `(${x.owner})` : '', x.due ? `due ${x.due}` : ''].join(' ').trim())).filter(Boolean);
      if (items.length) out.push(`${k}: ${items.join('; ')}`);
    } else if (v) {
      out.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`);
    }
  }
  return out.join('\n');
}

function names(attendeesJson) {
  const a = json(attendeesJson, []);
  if (!Array.isArray(a)) return '';
  return a.map((x) => (typeof x === 'string' ? x : [x.name, x.email].filter(Boolean).join(' '))).filter(Boolean).join(', ');
}

// Each source: how to read its rows and turn one into { title, body, at }.
const SOURCES = {
  email: {
    table: 'email_items',
    cols: 'rowid AS rid, id, user_id, subject, sender, account_email, category, summary, detected_type, extracted_data, created_at',
    recent: "created_at > datetime('now', ?)",
    map: (r) => ({
      title: r.subject || '(no subject)',
      body: [`From: ${r.sender || ''}`, r.account_email ? `To account: ${r.account_email}` : '', r.category ? `Category: ${r.category}` : '',
        r.summary || '', r.detected_type && r.detected_type !== 'general' ? `Type: ${r.detected_type} ${r.extracted_data || ''}` : ''].filter(Boolean).join('\n'),
      at: r.created_at,
    }),
  },
  meeting: {
    table: 'meetings',
    cols: 'rowid AS rid, id, user_id, title, type, company, attendees, notes, summary, meeting_at, created_at, updated_at',
    recent: "updated_at > datetime('now', ?)",
    map: (r) => ({
      title: r.title || 'Meeting',
      body: [r.type ? `Type: ${r.type}` : '', r.company ? `Company: ${r.company}` : '', names(r.attendees) ? `Attendees: ${names(r.attendees)}` : '',
        r.summary ? `Summary:\n${flattenSummary(r.summary)}` : '', r.notes ? `Notes / transcript:\n${r.notes}` : ''].filter(Boolean).join('\n'),
      at: r.meeting_at || r.created_at,
    }),
  },
  event: {
    table: 'calendar_events',
    cols: 'rowid AS rid, id, user_id, title, description, location, start_time, attendees, account_email, created_at',
    recent: "created_at > datetime('now', ?)",
    map: (r) => ({
      title: r.title || 'Event',
      body: [r.start_time ? `When: ${r.start_time}` : '', r.location ? `Where: ${r.location}` : '', names(r.attendees) ? `With: ${names(r.attendees)}` : '', r.description || ''].filter(Boolean).join('\n'),
      at: r.start_time || r.created_at,
    }),
  },
  task: {
    table: 'tasks',
    cols: 'rowid AS rid, id, user_id, title, due_date, completed, completed_at, source, created_at, updated_at',
    recent: "updated_at > datetime('now', ?)",
    map: (r) => ({
      title: r.title || 'Task',
      body: [r.completed ? `Done${r.completed_at ? ` on ${r.completed_at}` : ''}` : 'Open', r.due_date ? `Due: ${r.due_date}` : '', r.source ? `From: ${r.source}` : ''].filter(Boolean).join(' · '),
      at: r.created_at,
    }),
  },
  contact: {
    table: 'contacts',
    cols: 'rowid AS rid, id, user_id, name, email, phone, company, relationship, notes, last_summary, last_contacted_at, created_at',
    recent: "COALESCE(last_contacted_at, created_at) > datetime('now', ?)",
    map: (r) => ({
      title: r.name || r.email || 'Contact',
      body: [r.email, r.company ? `Company: ${r.company}` : '', r.relationship ? `Relationship: ${r.relationship}` : '', r.notes || '', r.last_summary || ''].filter(Boolean).join('\n'),
      at: r.last_contacted_at || r.created_at,
    }),
  },
  followup: {
    table: 'followups',
    cols: 'rowid AS rid, id, user_id, type, description, counterparty, due_date, status, created_at',
    recent: "created_at > datetime('now', ?)",
    map: (r) => ({
      title: `${r.type === 'promise_made' ? 'You promised' : 'Promised to you'}${r.counterparty ? ` — ${r.counterparty}` : ''}`,
      body: [r.description || '', r.due_date ? `Due: ${r.due_date}` : '', r.status ? `Status: ${r.status}` : ''].filter(Boolean).join('\n'),
      at: r.created_at,
    }),
  },
  chat: {
    table: 'conversations',
    cols: 'rowid AS rid, id, user_id, role, content, created_at',
    where: "user_id IS NOT NULL AND content IS NOT NULL AND length(content) > 12 AND role IN ('user', 'assistant')",
    recent: null, // chat lines never change
    map: (r) => ({
      title: r.role === 'assistant' ? 'Wingman said' : 'User said',
      body: clip(r.content, 2000),
      at: r.created_at,
    }),
  },
};

function tableExists(name) {
  return !!db.prepare("SELECT 1 FROM sqlite_master WHERE type IN ('table','view') AND name = ?").get(name);
}

let ready = null;
function indexReady() {
  if (ready === null) ready = tableExists('search_docs') && tableExists('search_fts');
  return ready;
}

const upsertSql = `
  INSERT INTO search_docs (user_id, source, ref_id, at, title, body) VALUES (?, ?, ?, ?, ?, ?)
  ON CONFLICT(source, ref_id) DO UPDATE SET
    user_id = excluded.user_id, at = excluded.at, title = excluded.title, body = excluded.body
  WHERE search_docs.title IS NOT excluded.title OR search_docs.body IS NOT excluded.body OR search_docs.at IS NOT excluded.at`;

function indexRows(source, rows) {
  const def = SOURCES[source];
  const up = db.prepare(upsertSql);
  let n = 0;
  db.transaction(() => {
    for (const r of rows) {
      if (!r.user_id) continue;
      const doc = def.map(r);
      const body = clip(doc.body);
      if (!String(doc.title || '').trim() && !body) continue;
      n += up.run(r.user_id, source, String(r.id), doc.at || null, clip(doc.title, 300), body).changes;
    }
  })();
  return n;
}

/** Index one source: new rows, recently-changed rows, and drop deleted ones. */
function syncSource(source) {
  const def = SOURCES[source];
  if (!tableExists(def.table)) return { source, skipped: 'no_table' };
  const state = db.prepare('SELECT last_rowid FROM search_state WHERE source = ?').get(source);
  const last = (state && state.last_rowid) || 0;
  const where = def.where ? `AND ${def.where}` : '';

  const fresh = db.prepare(`SELECT ${def.cols} FROM ${def.table} WHERE rowid > ? ${where} ORDER BY rowid LIMIT ${BATCH}`).all(last);
  let changed = indexRows(source, fresh);
  const maxRid = fresh.length ? fresh[fresh.length - 1].rid : last;

  if (def.recent && last > 0) {
    const recent = db.prepare(`SELECT ${def.cols} FROM ${def.table} WHERE rowid <= ? AND ${def.recent} ${where} LIMIT ${BATCH}`)
      .all(last, `-${LOOKBACK_DAYS} days`);
    changed += indexRows(source, recent);
  }

  // Rows deleted at the source (or the whole user) shouldn't stay searchable.
  const pruned = db.prepare(
    `DELETE FROM search_docs WHERE source = ? AND ref_id NOT IN (SELECT id FROM ${def.table})`,
  ).run(source).changes;

  db.prepare(`
    INSERT INTO search_state (source, last_rowid, updated_at) VALUES (?, ?, datetime('now'))
    ON CONFLICT(source) DO UPDATE SET last_rowid = excluded.last_rowid, updated_at = excluded.updated_at
  `).run(source, maxRid);
  return { source, fresh: fresh.length, changed, pruned, more: fresh.length === BATCH };
}

/** Bring the whole index up to date (called by the scheduler and at boot). */
function syncAll() {
  if (!indexReady()) return { skipped: 'no_index' };
  const results = [];
  for (const source of Object.keys(SOURCES)) {
    try { results.push(syncSource(source)); }
    catch (e) { console.warn(`[index] ${source} failed:`, e.message); }
  }
  const total = results.reduce((a, r) => a + (r.changed || 0), 0);
  if (total) console.log(`[index] updated ${total} item(s): ${results.filter((r) => r.changed).map((r) => `${r.source} ${r.changed}`).join(', ')}`);
  return { results, more: results.some((r) => r.more) };
}

/** Run until caught up (backfill), yielding between batches. */
async function backfill() {
  for (let i = 0; i < 200; i++) {
    const r = syncAll();
    if (!r.more) return;
    await new Promise((res) => setImmediate(res));
  }
}

// ── search ──────────────────────────────────────────────────────────────

const STOP = new Set(['the', 'a', 'an', 'and', 'or', 'of', 'to', 'in', 'on', 'for', 'with', 'about', 'is', 'was', 'what', 'did', 'do', 'does',
  'my', 'me', 'i', 'he', 'she', 'they', 'we', 'you', 'it', 'that', 'this', 'last', 'from', 'at', 'by', 'when', 'where', 'who', 'how']);

/** Turn free text into a safe FTS5 query: quoted terms, prefix-matched, OR'ed. */
function ftsQuery(text) {
  const words = String(text || '').toLowerCase().match(/[\p{L}\p{N}@._-]+/gu) || [];
  const terms = [...new Set(words.map((w) => w.replace(/^[._-]+|[._-]+$/g, '')).filter((w) => w.length > 1 && !STOP.has(w)))].slice(0, 12);
  if (!terms.length) return '';
  return terms.map((w) => `"${w.replace(/"/g, '')}"${w.length >= 3 ? '*' : ''}`).join(' OR ');
}

/**
 * Search one user's synced data.
 * @returns {Array<{source, ref_id, when, title, snippet}>}
 */
function search(userId, query, { sources, since, until, limit = 8 } = {}) {
  if (!indexReady()) return [];
  const lim = Math.min(Math.max(parseInt(limit, 10) || 8, 1), 20);
  const srcs = (Array.isArray(sources) ? sources : []).filter((s) => SOURCES[s]);
  const filters = ['d.user_id = ?'];
  const params = [userId];
  if (srcs.length) { filters.push(`d.source IN (${srcs.map(() => '?').join(',')})`); params.push(...srcs); }
  if (since) { filters.push('d.at >= ?'); params.push(String(since)); }
  if (until) { filters.push('d.at <= ?'); params.push(String(until)); }

  const q = ftsQuery(query);
  let rows;
  if (q) {
    rows = db.prepare(`
      SELECT d.source, d.ref_id, d.at, d.title,
             snippet(search_fts, 1, '«', '»', '…', 24) AS snip,
             bm25(search_fts, 4.0, 1.0) AS rank
      FROM search_fts JOIN search_docs d ON d.id = search_fts.rowid
      WHERE search_fts MATCH ? AND ${filters.join(' AND ')}
      ORDER BY rank LIMIT ?
    `).all(q, ...params, lim);
  } else {
    // No usable words (e.g. "what happened last week") — newest items in range.
    rows = db.prepare(`
      SELECT d.source, d.ref_id, d.at, d.title, substr(d.body, 1, 200) AS snip
      FROM search_docs d WHERE ${filters.join(' AND ')} ORDER BY d.at DESC LIMIT ?
    `).all(...params, lim);
  }
  return rows.map((r) => ({ source: r.source, ref_id: r.ref_id, when: r.at, title: r.title, snippet: r.snip }));
}

/** The full indexed text of one item, scoped to its owner. */
function getDoc(userId, source, refId) {
  if (!indexReady()) return null;
  const d = db.prepare('SELECT source, ref_id, at, title, body FROM search_docs WHERE user_id = ? AND source = ? AND ref_id = ?')
    .get(userId, String(source || ''), String(refId || ''));
  if (!d) return null;
  if (d.source === 'email') {
    try {
      const e = db.prepare('SELECT gmail_id, account_email FROM email_items WHERE id = ? AND user_id = ?').get(d.ref_id, userId);
      if (e) d.gmail_id = e.gmail_id;
      if (e && e.account_email) d.account_email = e.account_email;
    } catch (_) { /* optional */ }
  }
  return d;
}

/** Counts per source for one user (for "what can you search?" and diagnostics). */
function stats(userId) {
  if (!indexReady()) return {};
  const out = {};
  for (const r of db.prepare('SELECT source, COUNT(*) AS n FROM search_docs WHERE user_id = ? GROUP BY source').all(userId)) out[r.source] = r.n;
  return out;
}

module.exports = { syncAll, backfill, search, getDoc, stats, ftsQuery, SOURCES };
