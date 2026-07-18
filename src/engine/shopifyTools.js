'use strict';

/**
 * Anthropic tool definitions for the Shopify store agent. Claude uses these to
 * pull real store numbers, then reasons about WHY they moved and what to do.
 */
const PERIOD_DESC =
  "One of: 'today', 'yesterday', 'last_7_days', 'last_30_days'. Defaults to 'today'.";

const shopifyTools = [
  {
    name: 'get_shopify_connect_link',
    description:
      "Generate the personalised link the user taps to connect their Shopify store. " +
      'Use when they ask to connect/link their store, or when another Shopify tool ' +
      'returns SHOPIFY_NOT_CONNECTED. You need their store domain first — if you ' +
      "don't have it, ASK for it (e.g. \"what's your store domain? something like " +
      'mystore.myshopify.com").',
    input_schema: {
      type: 'object',
      properties: {
        shop_domain: {
          type: 'string',
          description: 'The store domain, e.g. "mystore.myshopify.com" (just the store name is fine too).',
        },
      },
      required: ['shop_domain'],
    },
  },
  {
    name: 'shopify_summary',
    description:
      "Get the user's Shopify store performance for a period, WITH an automatic " +
      'comparison against the immediately preceding window of equal length ' +
      '(so "today" is compared to the same hours yesterday). Returns orders, ' +
      'revenue, AOV, units, discounts, refunds, cancelled orders, new vs returning ' +
      'customers, top products, and percent changes. Use this for "how are sales?", ' +
      '"how did we do today?", "orders kam kyun aaye?", or any performance question.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: PERIOD_DESC },
      },
      required: [],
    },
  },
  {
    name: 'shopify_top_products',
    description:
      'Get the best-selling products for a period (units and revenue). Use for ' +
      '"what sold best?", "which product is doing well?", or to explain a change in sales.',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: PERIOD_DESC },
        limit: { type: 'number', description: 'How many products (default 5, max 10).' },
      },
      required: [],
    },
  },
  {
    name: 'shopify_recent_orders',
    description:
      'List recent individual orders for a period (order number, time, total, status, items). ' +
      'Use for "what orders came in?", "show me today\'s orders".',
    input_schema: {
      type: 'object',
      properties: {
        period: { type: 'string', description: PERIOD_DESC },
        limit: { type: 'number', description: 'How many orders (default 10, max 25).' },
      },
      required: [],
    },
  },
];

const shopifyToolNames = new Set(shopifyTools.map((t) => t.name));

module.exports = { shopifyTools, shopifyToolNames };
