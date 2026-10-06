'use strict';

/**
 * Runs the image tools (see imageTools.js). Never throws — errors come back as
 * { error } so Claude can explain them plainly.
 */

const config = require('../config');
const higgsfield = require('../services/higgsfield');
const mediaStore = require('../services/mediaStore');
const userMedia = require('../db/userMedia');

function ago(createdAt) {
  const t = Date.parse(`${String(createdAt).replace(' ', 'T')}Z`);
  if (!t) return '';
  const m = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

function describe(row) {
  return {
    image_id: row.id,
    image_url: row.url,
    source: row.kind === 'generated' ? 'made by Wingman' : 'sent by the user',
    about: row.note || '',
    when: ago(row.created_at),
  };
}

/** Deliver the image on WhatsApp when we can; the web chat gets the link instead. */
async function deliver(user, saved, caption) {
  try {
    const cloudApi = require('../whatsapp/cloudApi');
    if (!user || !user.phone || !cloudApi.ready()) return false;
    await cloudApi.sendImage(user.phone, mediaStore.read(saved), { mimeType: saved.mime, caption });
    console.log(`[images] >> image to ${String(user.phone).replace(/[^0-9]/g, '')}`);
    return true;
  } catch (e) {
    console.warn('[images] WhatsApp delivery failed:', e.message);
    return false;
  }
}

async function generate(user, input) {
  if (!config.higgsfield.enabled) return { error: 'IMAGES_NOT_CONFIGURED', detail: 'Image generation is not set up on this server.' };
  const used = userMedia.generatedLastDay(user.id);
  if (used >= config.higgsfield.dailyLimit) {
    return { error: 'DAILY_IMAGE_LIMIT', detail: `This user has already made ${used} images in the last 24 hours (limit ${config.higgsfield.dailyLimit}). Tell them to try again tomorrow.` };
  }
  const prompt = String(input.prompt || '').trim();
  if (!prompt) return { error: 'EMPTY_PROMPT' };

  let out;
  try {
    out = await higgsfield.generateImage(prompt, { aspectRatio: input.aspect_ratio || '1:1' });
  } catch (e) {
    console.warn('[images] generation failed:', e.message);
    if (e.message === 'IMAGE_REJECTED') return { error: 'IMAGE_REJECTED', detail: 'The image service refused this prompt (content rules). Offer a different idea.' };
    if (e.message === 'IMAGE_TIMEOUT') return { error: 'IMAGE_TIMEOUT', detail: 'The image is taking too long. Ask the user to try again in a minute.' };
    return { error: 'IMAGE_FAILED', detail: e.message.slice(0, 200) };
  }

  const saved = await mediaStore.save(user.id, out.buffer, { kind: 'generated', mimeType: out.mimeType, note: prompt });
  const sent = await deliver(user, saved, input.caption || '');
  return {
    image_id: saved.id,
    image_url: saved.url,
    sent_to_user_on_whatsapp: sent,
    note: sent
      ? 'The user can already SEE this image in the chat — do not describe it at length or paste the link. Ask if they want changes, or carry on (e.g. post it) using image_url.'
      : 'Could not send the image file — give the user the image_url link so they can open it.',
  };
}

async function executeImageTool(user, toolUse) {
  const { name, input = {} } = toolUse;
  try {
    if (!user) return { error: 'NO_USER' };
    if (name === 'generate_image') return await generate(user, input);
    if (name === 'list_my_images') {
      const rows = mediaStore.recent(user.id, 8);
      return rows.length ? { images: rows.map(describe) } : { images: [], note: 'No images yet.' };
    }
    return { error: 'UNKNOWN_TOOL' };
  } catch (e) {
    console.warn(`[images] ${name} failed:`, e.message);
    return { error: 'IMAGE_ERROR', detail: String(e.message || '').slice(0, 200) };
  }
}

/**
 * System-prompt block listing the user's latest images with their URLs — chat
 * history is text-only, so without this "post that image" in a later message
 * would have nothing to point at.
 */
function recentImagesBlock(user) {
  try {
    if (!user) return '';
    const rows = mediaStore.recent(user.id, 3);
    if (!rows.length) return '';
    return '\n\n--- THIS USER\'S RECENT IMAGES ---\n' +
      rows.map((r) => `- ${r.kind === 'generated' ? 'made by you' : 'sent by the user'} ${ago(r.created_at)}: image_url ${r.url}${r.note ? ` — ${String(r.note).slice(0, 120)}` : ''}`).join('\n') +
      '\nWhen they say "that image / the photo I sent / the last one", use the matching image_url (newest first). Never show these links to the user unless they ask.';
  } catch (_) {
    return '';
  }
}

module.exports = { executeImageTool, recentImagesBlock };
