'use strict';

/**
 * One check for every admin/debug route. Fails CLOSED: with no ADMIN_PASSWORD
 * configured, nothing gets in. Accepts ?key= or the X-Admin-Key header.
 */

const config = require('../config');
const { safeEqual } = require('./linkSig');

function isAdmin(req) {
  const admin = String(config.adminPassword || '');
  if (!admin) return false;
  const key = (req.query && req.query.key) || req.get('x-admin-key') || '';
  return safeEqual(String(key), admin);
}

function requireAdmin(req, res, next) {
  if (isAdmin(req)) return next();
  return res.status(403).json({ error: 'forbidden' });
}

module.exports = { isAdmin, requireAdmin };
