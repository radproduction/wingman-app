'use strict';

/**
 * Anthropic tool definitions for images: make one (Higgsfield), and look up the
 * images this user already has (ones Wingman made, ones they sent on WhatsApp)
 * so they can be attached to a post in a later message.
 */

const config = require('../config');

const imageTools = [
  {
    name: 'generate_image',
    description:
      'Create an image with AI and send it to the user on WhatsApp. Use for ANY request to make/design/draw ' +
      'a picture: a poster, social post visual, ad creative, logo idea, illustration, product shot, greeting ' +
      'card, meme, wallpaper… — whether or not it will be posted anywhere. Write the prompt yourself in ' +
      'detailed English (subject, style, colours, composition, mood, any exact text to show in quotes) even ' +
      'if the user wrote in Roman Urdu. The image is delivered to the user automatically; you get back its ' +
      'image_url, which you can pass to a posting tool (e.g. Facebook photo post, Instagram) afterwards. ' +
      'Takes up to a minute.',
    input_schema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed English description of the image to create.' },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '4:5', '9:16', '16:9', '3:4', '4:3'],
          description: '1:1 square (default, feed posts) · 4:5 portrait feed · 9:16 story/reel/status · 16:9 wide/cover.',
        },
        caption: { type: 'string', description: 'Optional short line shown under the image on WhatsApp.' },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'list_my_images',
    description:
      'List this user\'s recent images with their image_url — both images you generated and photos they sent ' +
      'you on WhatsApp. Use when they say "post that image", "use the photo I sent", "the last one".',
    input_schema: { type: 'object', properties: {} },
  },
];

const imageToolNames = new Set(imageTools.map((t) => t.name));

/** generate_image is only offered when Higgsfield is configured; listing always works. */
function imageToolsAvailable() {
  return config.higgsfield.enabled ? imageTools : imageTools.filter((t) => t.name === 'list_my_images');
}

module.exports = { imageTools, imageToolNames, imageToolsAvailable };
