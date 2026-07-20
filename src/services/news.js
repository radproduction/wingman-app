'use strict';

/**
 * News via Google News RSS — no API key, no quota, no cost.
 *
 * Topic feeds cover the standard categories; "local" is a search feed scoped to
 * the user's city, which is how we answer "anything happening near me?".
 */

const TOPIC_SECTIONS = {
  world: 'WORLD',
  nation: 'NATION',
  business: 'BUSINESS',
  technology: 'TECHNOLOGY',
  entertainment: 'ENTERTAINMENT',
  sports: 'SPORTS',
  science: 'SCIENCE',
  health: 'HEALTH',
};

/** Friendly labels used in the briefing and in chat. */
const TOPIC_LABELS = {
  world: 'World',
  nation: 'National',
  business: 'Business',
  technology: 'Tech',
  entertainment: 'Entertainment',
  sports: 'Sports',
  science: 'Science',
  health: 'Health',
  local: 'Local',
};

const ALL_TOPICS = [...Object.keys(TOPIC_SECTIONS), 'local'];
const DEFAULT_TOPICS = ['world', 'nation', 'technology', 'local'];

// Timezone → (country, city) so a new user gets sensible defaults without asking.
const TZ_DEFAULTS = {
  'Asia/Karachi': { country: 'PK', city: 'Karachi' },
  'Asia/Dubai': { country: 'AE', city: 'Dubai' },
  'Asia/Riyadh': { country: 'SA', city: 'Riyadh' },
  'Asia/Kolkata': { country: 'IN', city: 'Mumbai' },
  'Europe/London': { country: 'GB', city: 'London' },
  'America/New_York': { country: 'US', city: 'New York' },
  'America/Los_Angeles': { country: 'US', city: 'Los Angeles' },
};

function defaultsForTz(tz) {
  return TZ_DEFAULTS[tz] || { country: 'US', city: '' };
}

/** Google News locale params for a user. */
function localeFor(user) {
  const tz = (user && user.timezone) || 'Asia/Karachi';
  const d = defaultsForTz(tz);
  const country = (user && user.news_country) || d.country;
  const lang = 'en';
  return { hl: `${lang}-${country}`, gl: country, ceid: `${country}:${lang}` };
}

// A user can follow several cities, not just where they live — people care
// about the town their family is in, or the one they are flying to next week.
const MAX_CITIES = 5;

/** Every city the user follows. Always a list; falls back to their timezone. */
function citiesFor(user) {
  let list = user && user.news_city;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); }
    catch (_) { list = [list]; }             // pre-list users stored a bare string
  }
  if (!Array.isArray(list)) list = list ? [list] : [];

  const clean = list
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .slice(0, MAX_CITIES);

  if (clean.length) return clean;
  const fallback = defaultsForTz((user && user.timezone) || 'Asia/Karachi').city;
  return fallback ? [fallback] : [];
}

/** First followed city — for callers that only need one (labels, summaries). */
function cityFor(user) {
  return citiesFor(user)[0] || null;
}

/** Which topics a user follows (falls back to a sensible default set). */
function topicsFor(user) {
  let list = user && user.news_topics;
  if (typeof list === 'string') {
    try { list = JSON.parse(list); } catch (_) { list = null; }
  }
  if (!Array.isArray(list) || !list.length) return DEFAULT_TOPICS;
  return list.filter((t) => ALL_TOPICS.includes(t));
}

function decodeEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}

/**
 * Google appends " - Source" to titles, and sometimes twice
 * ("…specs - GSMArena.com news - GSMArena.com"). Strip trailing segments that
 * are really just the publisher repeated.
 */
function stripTrailingSource(title, source) {
  if (!source) return title;
  const key = source.toLowerCase().replace(/\.(com|net|org|pk|in|co\.uk).*$/, '').split(/\s+/)[0];
  if (!key || key.length < 3) return title;
  let out = title;
  for (let i = 0; i < 2; i++) {
    const idx = out.lastIndexOf(' - ');
    if (idx < 20) break;
    if (out.slice(idx + 3).toLowerCase().includes(key)) out = out.slice(0, idx).trim();
    else break;
  }
  return out;
}

/** Parse a Google News RSS document into normalized headlines. */
function parseFeed(xml, limit) {
  const items = [...String(xml).matchAll(/<item>([\s\S]*?)<\/item>/g)].slice(0, limit);
  return items.map((m) => {
    const block = m[1];
    const pick = (tag) => {
      const r = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
      return r ? decodeEntities(r[1]) : '';
    };
    const raw = pick('title');
    // Google formats titles as "Headline - Source"; split the source off the end.
    const idx = raw.lastIndexOf(' - ');
    const source = idx > 20 ? raw.slice(idx + 3).trim() : (pick('source') || '');
    const title = idx > 20 ? stripTrailingSource(raw.slice(0, idx).trim(), source) : raw;
    return { title, source, link: pick('link'), publishedAt: pick('pubDate') };
  }).filter((i) => i.title);
}

async function fetchFeed(url, limit) {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Wingman/1.0)' } });
  if (!res.ok) throw new Error(`news feed ${res.status}`);
  return parseFeed(await res.text(), limit);
}

/** Headlines about one named city. */
async function headlinesForCity(user, city, { limit = 4 } = {}) {
  const { hl, gl, ceid } = localeFor(user);
  const qs = `hl=${hl}&gl=${gl}&ceid=${ceid}`;
  if (!city) return [];
  return fetchFeed(`https://news.google.com/rss/search?q=${encodeURIComponent(city)}&${qs}`, limit);
}

/** Headlines for one topic (or the user's city when topic === 'local'). */
async function headlines(user, topic, { limit = 4 } = {}) {
  const { hl, gl, ceid } = localeFor(user);
  const qs = `hl=${hl}&gl=${gl}&ceid=${ceid}`;

  if (topic === 'local') {
    const city = cityFor(user);
    if (!city) return [];
    return headlinesForCity(user, city, { limit });
  }

  const section = TOPIC_SECTIONS[topic];
  if (!section) return [];
  return fetchFeed(`https://news.google.com/rss/headlines/section/topic/${section}?${qs}`, limit);
}

/**
 * Build the user's news bulletin: a few headlines per followed topic.
 * A failing feed is skipped rather than breaking the whole bulletin.
 */
async function bulletin(user, { perTopic = 3, topics } = {}) {
  const list = topics && topics.length ? topics : topicsFor(user);
  const cities = citiesFor(user);
  const sections = [];

  for (const topic of list) {
    // 'local' isn't one section — it's one per city the user follows, each
    // labelled with its own name so several cities never blur together.
    if (topic === 'local') {
      for (const city of cities) {
        try {
          const items = await headlinesForCity(user, city, { limit: perTopic });
          if (items.length) sections.push({ topic: 'local', city, label: city, items });
        } catch (err) {
          console.warn(`[news] ${city} feed failed:`, err.message);
        }
      }
      continue;
    }

    try {
      const items = await headlines(user, topic, { limit: perTopic });
      if (items.length) {
        sections.push({ topic, label: TOPIC_LABELS[topic] || topic, items });
      }
    } catch (err) {
      console.warn(`[news] ${topic} feed failed:`, err.message);
    }
  }
  return { sections, cities, city: cities[0] || null };
}

/** Compact WhatsApp-friendly text for the morning briefing. */
function formatBulletin(bul, { perTopic = 2 } = {}) {
  if (!bul || !bul.sections.length) return '';
  const lines = ['📰 Today\'s headlines:'];
  for (const s of bul.sections) {
    lines.push(`*${s.label}*`);
    for (const it of s.items.slice(0, perTopic)) {
      lines.push(`• ${it.title}${it.source ? ` — ${it.source}` : ''}`);
    }
  }
  return lines.join('\n');
}

module.exports = {
  ALL_TOPICS, DEFAULT_TOPICS, TOPIC_LABELS, TOPIC_SECTIONS,
  topicsFor, cityFor, citiesFor, headlinesForCity, localeFor, defaultsForTz,
  headlines, bulletin, formatBulletin, parseFeed,
};
