'use strict';

const t = require('../utils/time');

const API_VERSION = process.env.SHOPIFY_API_VERSION || '2024-10';

/** Normalize a store domain: strip protocol/paths, ensure .myshopify.com host. */
function normalizeDomain(input) {
  let d = String(input || '').trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/\s/g, '');
  return d;
}

/** Low-level Admin API GET. Throws with a readable message on failure. */
async function apiGet(domain, token, path, params = {}) {
  const url = new URL(`https://${normalizeDomain(domain)}/admin/api/${API_VERSION}/${path}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': token, 'Content-Type': 'application/json' },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      throw new Error('SHOPIFY_AUTH_FAILED');
    }
    if (res.status === 404) throw new Error('SHOPIFY_NOT_FOUND');
    throw new Error(`Shopify API ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

/** Verify a domain + token pair. Returns { shop, currency, domain }. */
async function testConnection(domain, token) {
  const data = await apiGet(domain, token, 'shop.json');
  const shop = data && data.shop;
  if (!shop) throw new Error('SHOPIFY_AUTH_FAILED');
  return {
    shop: shop.name,
    domain: normalizeDomain(domain),
    currency: shop.currency || 'USD',
    timezone: shop.iana_timezone || null,
  };
}

function connectedOrThrow(user) {
  if (!user || !user.shopify_domain || !user.shopify_token) throw new Error('SHOPIFY_NOT_CONNECTED');
  return { domain: user.shopify_domain, token: user.shopify_token };
}

/** Fetch orders created within [fromISO, toISO). Capped at 250 (one page). */
async function fetchOrders(user, fromISO, toISO) {
  const { domain, token } = connectedOrThrow(user);
  const data = await apiGet(domain, token, 'orders.json', {
    status: 'any',
    created_at_min: fromISO,
    created_at_max: toISO,
    limit: 250,
    fields: 'id,name,created_at,total_price,subtotal_price,total_discounts,currency,financial_status,cancelled_at,refunds,line_items,customer',
  });
  return (data && data.orders) || [];
}

const num = (v) => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

/** Aggregate a raw order list into the metrics the assistant reasons over. */
function computeMetrics(orders) {
  const live = orders.filter((o) => !o.cancelled_at);
  const cancelled = orders.length - live.length;

  let revenue = 0, discounts = 0, refunded = 0, items = 0, newCustomers = 0;
  const productMap = new Map();

  for (const o of live) {
    revenue += num(o.total_price);
    discounts += num(o.total_discounts);
    for (const r of (o.refunds || [])) {
      for (const rli of (r.refund_line_items || [])) refunded += num(rli.subtotal);
    }
    if (o.customer && num(o.customer.orders_count) <= 1) newCustomers++;
    for (const li of (o.line_items || [])) {
      const qty = num(li.quantity);
      items += qty;
      const key = li.title || 'Unknown';
      const prev = productMap.get(key) || { title: key, units: 0, revenue: 0 };
      prev.units += qty;
      prev.revenue += num(li.price) * qty;
      productMap.set(key, prev);
    }
  }

  const count = live.length;
  const topProducts = [...productMap.values()]
    .sort((a, b) => b.units - a.units)
    .slice(0, 5)
    .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }));

  return {
    orders: count,
    revenue: Math.round(revenue * 100) / 100,
    aov: count ? Math.round((revenue / count) * 100) / 100 : 0,
    units_sold: items,
    discounts: Math.round(discounts * 100) / 100,
    refunded: Math.round(refunded * 100) / 100,
    cancelled_orders: cancelled,
    new_customers: newCustomers,
    returning_customers: Math.max(count - newCustomers, 0),
    top_products: topProducts,
    truncated: orders.length >= 250,
  };
}

/** Percent change helper (null when there's no baseline to compare against). */
function pctChange(current, previous) {
  if (!previous) return current ? null : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/**
 * Resolve a named period into an ISO window in the user's timezone.
 * Supported: today | yesterday | last_7_days | last_30_days | this_month
 */
function resolvePeriod(period, tz, now = new Date()) {
  const p = String(period || 'today').toLowerCase();
  const startToday = t.startOfDayISO(tz, 0, now);
  switch (p) {
    case 'yesterday':
      return { from: t.startOfDayISO(tz, -1, now), to: startToday, label: 'yesterday' };
    case 'last_7_days':
    case 'week':
      return { from: t.startOfDayISO(tz, -7, now), to: now.toISOString(), label: 'last 7 days' };
    case 'last_30_days':
    case 'month':
      return { from: t.startOfDayISO(tz, -30, now), to: now.toISOString(), label: 'last 30 days' };
    case 'today':
    default:
      return { from: startToday, to: now.toISOString(), label: 'today' };
  }
}

/**
 * Metrics for a period PLUS the immediately-preceding window of equal length,
 * so "today vs yesterday" compares like-for-like (same elapsed hours).
 */
async function summary(user, { period = 'today', now = new Date() } = {}) {
  const tz = user.timezone || 'Asia/Karachi';
  const { from, to, label } = resolvePeriod(period, tz, now);

  const fromMs = new Date(from).getTime();
  const toMs = new Date(to).getTime();
  const span = Math.max(toMs - fromMs, 1);
  const prevFrom = new Date(fromMs - span).toISOString();
  const prevTo = from;

  const [curOrders, prevOrders] = await Promise.all([
    fetchOrders(user, from, to),
    fetchOrders(user, prevFrom, prevTo),
  ]);

  const current = computeMetrics(curOrders);
  const previous = computeMetrics(prevOrders);

  return {
    period: label,
    window: { from, to },
    currency: null, // filled by the executor from the stored shop currency
    current,
    previous,
    change: {
      orders_pct: pctChange(current.orders, previous.orders),
      revenue_pct: pctChange(current.revenue, previous.revenue),
      aov_pct: pctChange(current.aov, previous.aov),
      orders_delta: current.orders - previous.orders,
      revenue_delta: Math.round((current.revenue - previous.revenue) * 100) / 100,
    },
  };
}

/** Top selling products for a period. */
async function topProducts(user, { period = 'last_7_days', limit = 5, now = new Date() } = {}) {
  const tz = user.timezone || 'Asia/Karachi';
  const { from, to, label } = resolvePeriod(period, tz, now);
  const orders = await fetchOrders(user, from, to);
  const m = computeMetrics(orders);
  return { period: label, products: m.top_products.slice(0, Math.min(Math.max(limit, 1), 10)) };
}

/** A few recent orders, lightly normalized, for "what came in today?" answers. */
async function recentOrders(user, { period = 'today', limit = 10, now = new Date() } = {}) {
  const tz = user.timezone || 'Asia/Karachi';
  const { from, to, label } = resolvePeriod(period, tz, now);
  const orders = await fetchOrders(user, from, to);
  const list = orders.slice(-Math.min(Math.max(limit, 1), 25)).reverse().map((o) => ({
    order: o.name,
    at: o.created_at,
    total: num(o.total_price),
    status: o.cancelled_at ? 'cancelled' : (o.financial_status || 'pending'),
    items: (o.line_items || []).map((li) => `${li.quantity}× ${li.title}`).slice(0, 4),
  }));
  return { period: label, count: orders.length, orders: list };
}

module.exports = {
  normalizeDomain, testConnection, summary, topProducts, recentOrders,
  computeMetrics, resolvePeriod, fetchOrders,
};
