'use strict';

/**
 * Reads images the user sends on WhatsApp (screenshots, photos of receipts,
 * bills, documents, whiteboards, error messages, …) using Claude's vision.
 *
 * Mirrors the media pattern already used for voice notes (transcribe) and
 * documents (extract text): the image is turned into a rich TEXT description +
 * OCR, which is then fed to the normal conversation engine — so every existing
 * tool works on top of what the picture shows, and Wingman never has to say
 * "I can't see images".
 */

const claude = require('../llm/claude');

// Claude vision accepts these; anything else we relabel as JPEG (WhatsApp photos
// are JPEG) and let the API try — a genuinely unsupported blob throws and is
// handled by the caller.
const SUPPORTED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);

// Anthropic caps a single image near ~5MB of base64. WhatsApp photos are almost
// always well under this; guard so a huge file fails fast with a clear message
// instead of a confusing API error.
const MAX_BYTES = 4.5 * 1024 * 1024;

const READ_PROMPT = (caption) => `You are looking at an image a user sent you on WhatsApp. It could be a screenshot, a photo of a bill or receipt, a document, a chat, an error message, a product, a place, or anything else.

Do BOTH of these:
1. Briefly say what the image is / shows (1-2 lines).
2. Extract EVERY piece of text you can read from it, verbatim — numbers, amounts, dates, names, invoice/order IDs, addresses, error text, etc. Preserve it faithfully; do not summarise the text away. If there is no readable text, say so.

Be accurate and literal. Do not invent anything that isn't in the image.${caption ? `\n\nThe user sent it with this note: "${caption}" — keep that in mind, but still describe and read the whole image.` : ''}`;

/**
 * Turn an image buffer into text context for the conversation engine.
 *
 * @param {Buffer} buffer
 * @param {Object} [opts]
 * @param {string} [opts.mimeType]
 * @param {string} [opts.caption]  the user's caption sent with the image
 * @returns {Promise<string>} a text block describing + transcribing the image
 */
async function readImage(buffer, { mimeType = 'image/jpeg', caption = '' } = {}) {
  if (!buffer || !buffer.length) throw new Error('EMPTY_IMAGE');
  if (buffer.length > MAX_BYTES) throw new Error('IMAGE_TOO_LARGE');

  const mt = SUPPORTED_MIME.has(String(mimeType).toLowerCase()) ? String(mimeType).toLowerCase() : 'image/jpeg';
  const data = buffer.toString('base64');

  const description = await claude.chat(
    [{
      role: 'user',
      content: [
        { type: 'image', source: { type: 'base64', media_type: mt, data } },
        { type: 'text', text: READ_PROMPT(caption) },
      ],
    }],
    { maxTokens: 1024 },
  );

  const text = (description || '').trim();
  if (!text) throw new Error('NO_VISION_OUTPUT');

  // Frame it so the engine treats the contents as something Wingman can see, and
  // answers the caption (if any) against the image rather than re-describing it.
  return [
    '[The user sent an image on WhatsApp. You CAN see it — its contents are below. Use them to answer.]',
    text,
    caption ? `\nThe user's message with the image: "${caption}"` : '',
  ].filter(Boolean).join('\n');
}

module.exports = { readImage, SUPPORTED_MIME };
