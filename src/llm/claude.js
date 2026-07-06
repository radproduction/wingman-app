'use strict';

const Anthropic = require('@anthropic-ai/sdk');
const config = require('../config');

let anthropic = null;

function getClient() {
  if (!anthropic) {
    anthropic = new Anthropic({ apiKey: config.anthropic.apiKey });
  }
  return anthropic;
}

/**
 * Simple helper to get a text completion from Claude.
 *
 * @param {string} prompt
 * @param {Object} [opts]
 * @param {string} [opts.system]
 * @param {number} [opts.maxTokens=1024]
 * @returns {Promise<string>}
 */
async function complete(prompt, { system, maxTokens = 1024 } = {}) {
  const resp = await getClient().messages.create({
    model: config.anthropic.model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages: [{ role: 'user', content: prompt }],
  });
  return resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

/**
 * Full chat completion accepting a messages array (role/content) and a system prompt.
 *
 * @param {Array<{role:'user'|'assistant', content:string}>} messages
 * @param {Object} [opts]
 * @param {string} [opts.system]
 * @param {number} [opts.maxTokens=1024]
 * @returns {Promise<string>}
 */
async function chat(messages, { system, maxTokens = 1024 } = {}) {
  const resp = await getClient().messages.create({
    model: config.anthropic.model,
    max_tokens: maxTokens,
    system: system || undefined,
    messages,
  });
  return resp.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

/**
 * Chat that supports tool-use. Returns the raw Anthropic response so the
 * caller can inspect stop_reason and tool_use blocks.
 *
 * @param {Array} messages
 * @param {Object} [opts]
 * @param {string} [opts.system]
 * @param {Array} [opts.tools]
 * @param {number} [opts.maxTokens=1024]
 * @returns {Promise<Object>} the Anthropic message response
 */
async function chatWithTools(messages, { system, tools, maxTokens = 1024 } = {}) {
  return getClient().messages.create({
    model: config.anthropic.model,
    max_tokens: maxTokens,
    system: system || undefined,
    tools: tools && tools.length ? tools : undefined,
    messages,
  });
}

/** Extract concatenated text from an Anthropic response object. */
function textOf(response) {
  if (!response || !response.content) return '';
  return response.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

module.exports = { getClient, complete, chat, chatWithTools, textOf };
