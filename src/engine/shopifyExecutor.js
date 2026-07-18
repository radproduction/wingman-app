'use strict';

const shopify = require('../services/shopify');

function isConnected(user) {
  return !!(user && user.shopify_domain && user.shopify_token);
}

/**
 * Execute a single Shopify tool_use block. Never throws — errors become {error}
 * so Claude can explain them to the user instead of the turn failing.
 */
async function executeShopifyTool(user, toolUse) {
  const { name, input } = toolUse;

  // The connect link is the one tool that must work BEFORE a store is linked.
  if (name === 'get_shopify_connect_link') {
    const config = require('../config');
    const shopifyAuth = require('../auth/shopifyAuth');
    if (!config.shopify.enabled) {
      return { error: 'SHOPIFY_OAUTH_NOT_CONFIGURED', detail: 'Shopify connect is not set up on this server yet.' };
    }
    const shop = shopifyAuth.normalizeShop(input.shop_domain);
    if (!shopifyAuth.isValidShop(shop)) {
      return { error: 'INVALID_SHOP_DOMAIN', detail: 'That does not look like a Shopify store domain. It should look like mystore.myshopify.com.' };
    }
    const url = `${config.publicBaseUrl}/auth/shopify?shop=${encodeURIComponent(shop)}&phone=${encodeURIComponent(user.phone)}`;
    return { shop, connect_url: url, already_connected: isConnected(user) };
  }

  if (!isConnected(user)) {
    return { error: 'SHOPIFY_NOT_CONNECTED' };
  }

  try {
    switch (name) {
      case 'shopify_summary': {
        const data = await shopify.summary(user, { period: input.period });
        return { store: user.shopify_domain, ...data };
      }

      case 'shopify_top_products': {
        const data = await shopify.topProducts(user, { period: input.period, limit: input.limit });
        return { store: user.shopify_domain, ...data };
      }

      case 'shopify_recent_orders': {
        const data = await shopify.recentOrders(user, { period: input.period, limit: input.limit });
        return { store: user.shopify_domain, ...data };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  } catch (err) {
    const msg = (err && err.message) || 'shopify_operation_failed';
    if (msg === 'SHOPIFY_NOT_CONNECTED') return { error: 'SHOPIFY_NOT_CONNECTED' };
    if (msg === 'SHOPIFY_AUTH_FAILED') {
      return { error: 'SHOPIFY_AUTH_FAILED', detail: 'The stored Shopify token is invalid or expired — the user should reconnect their store in Settings.' };
    }
    return { error: msg };
  }
}

module.exports = { executeShopifyTool };
