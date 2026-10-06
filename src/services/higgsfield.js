'use strict';

/**
 * Higgsfield image generation.
 *
 * The API is asynchronous: POST the prompt to a model path → get a request id
 * and status_url → poll until it is `completed` → the result carries image URLs.
 * Docs: https://docs.higgsfield.ai  (auth: "Authorization: Key KEY_ID:KEY_SECRET")
 */

const config = require('../config');

const ASPECTS = new Set(['1:1', '4:3', '3:4', '3:2', '2:3', '5:4', '4:5', '16:9', '9:16', '21:9']);
const TERMINAL = new Set(['completed', 'failed', 'nsfw', 'canceled', 'cancelled']);
const MAX_WAIT_MS = 150 * 1000;

function headers(extra = {}) {
  return { Authorization: `Key ${config.higgsfield.apiKey}`, 'Content-Type': 'application/json', ...extra };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function json(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch (_) { return { raw: text.slice(0, 300) }; }
}

function errorText(data, status) {
  const d = data || {};
  const m = d.detail || d.message || d.error || d.raw;
  return (typeof m === 'string' ? m : JSON.stringify(m || '')).slice(0, 200) || `HTTP ${status}`;
}

/** Pull image URLs out of a completed result, whatever shape the model uses. */
function imageUrls(data) {
  const out = [];
  const push = (u) => { if (typeof u === 'string' && /^https?:\/\//.test(u)) out.push(u); };
  for (const img of (data && data.images) || []) push(img && (img.url || img));
  for (const j of (data && data.jobs) || []) {
    const r = (j && j.results) || {};
    push((r.raw && r.raw.url) || (r.min && r.min.url));
  }
  if (data && data.image) push(data.image.url || data.image);
  if (data && data.output) (Array.isArray(data.output) ? data.output : [data.output]).forEach((o) => push(o && (o.url || o)));
  return out;
}

// If the configured model path is gone (Higgsfield renames versions), fall back
// to these so a stale HIGGSFIELD_IMAGE_MODEL doesn't take images down.
const MODEL_FALLBACKS = ['higgsfield-ai/soul/v2/standard', 'higgsfield-ai/soul/standard'];

async function submit(prompt, aspectRatio) {
  const models = [config.higgsfield.imageModel, ...MODEL_FALLBACKS.filter((m) => m !== config.higgsfield.imageModel)];
  let last;
  for (const model of models) {
    try {
      return await submitTo(model, prompt, aspectRatio);
    } catch (e) {
      last = e;
      if (e.status !== 404) throw e;
      console.warn(`[higgsfield] model "${model}" not found, trying the next one`);
    }
  }
  throw last;
}

async function submitTo(model, prompt, aspectRatio) {
  const body = { prompt };
  if (aspectRatio) body.aspect_ratio = aspectRatio;
  if (config.higgsfield.resolution) body.resolution = config.higgsfield.resolution;
  const url = `${config.higgsfield.baseUrl}/${model}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: headers({ 'Idempotency-Key': require('crypto').randomUUID() }),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  const data = await json(res);
  if (!res.ok) {
    const e = new Error(`Higgsfield ${res.status}: ${errorText(data, res.status)}`);
    e.status = res.status;
    throw e;
  }
  return data;
}

/**
 * Generate one image. Returns { buffer, mimeType, sourceUrl }.
 * Throws an Error with a short, user-safe .message on failure
 * (IMAGE_REJECTED for a content rejection, IMAGE_TIMEOUT if it runs too long).
 */
async function generateImage(prompt, { aspectRatio = '1:1' } = {}) {
  if (!config.higgsfield.enabled) throw new Error('IMAGES_NOT_CONFIGURED');
  const p = String(prompt || '').trim().slice(0, 2000);
  if (!p) throw new Error('EMPTY_PROMPT');
  const ar = ASPECTS.has(aspectRatio) ? aspectRatio : '1:1';

  let data = await submit(p, ar);
  const statusUrl = data.status_url || (data.request_id && `${config.higgsfield.baseUrl}/requests/${data.request_id}/status`);
  const started = Date.now();
  let delay = 2000;
  while (!TERMINAL.has(String(data.status || '').toLowerCase())) {
    if (!statusUrl) throw new Error('Higgsfield returned no status_url');
    if (Date.now() - started > MAX_WAIT_MS) throw new Error('IMAGE_TIMEOUT');
    await sleep(delay + Math.random() * 400);
    delay = Math.min(delay * 1.5, 8000);
    try {
      const res = await fetch(statusUrl, { headers: headers(), signal: AbortSignal.timeout(20000) });
      if (res.status === 401 || res.status === 404) throw Object.assign(new Error(`Higgsfield ${res.status}`), { fatal: true });
      if (res.ok) data = await json(res);
    } catch (e) {
      if (e.fatal) throw e; // otherwise a network blip — keep polling
    }
  }

  const status = String(data.status).toLowerCase();
  if (status === 'nsfw') throw new Error('IMAGE_REJECTED');
  if (status !== 'completed') throw new Error(`Higgsfield ${status}: ${errorText(data, 0)}`);

  const urls = imageUrls(data);
  if (!urls.length) throw new Error('Higgsfield finished but returned no image');
  const img = await fetch(urls[0], { signal: AbortSignal.timeout(45000) });
  if (!img.ok) throw new Error(`image download failed: HTTP ${img.status}`);
  return {
    buffer: Buffer.from(await img.arrayBuffer()),
    mimeType: img.headers.get('content-type') || 'image/jpeg',
    sourceUrl: urls[0],
  };
}

module.exports = { generateImage, imageUrls, ASPECTS };
