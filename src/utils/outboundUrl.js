'use strict';

const dns = require('dns').promises;
const net = require('net');

/**
 * Validation for URLs the SERVER will call on a user's behalf.
 *
 * A user-supplied URL that our server fetches is an SSRF hole: without this,
 * someone could point it at 169.254.169.254 (cloud metadata) or a service
 * reachable only from inside our network and use Wingman as a proxy into it.
 * So we require HTTPS, resolve the hostname, and refuse anything that lands on
 * a private or loopback address.
 */

function isPrivateAddress(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    if (a === 10) return true;                       // 10.0.0.0/8
    if (a === 127) return true;                      // loopback
    if (a === 0) return true;                        // "this" network
    if (a === 169 && b === 254) return true;         // link-local + cloud metadata
    if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
    if (a === 192 && b === 168) return true;         // 192.168.0.0/16
    if (a >= 224) return true;                       // multicast / reserved
    return false;
  }
  if (net.isIPv6(ip)) {
    const s = ip.toLowerCase();
    if (s === '::1' || s === '::') return true;
    if (s.startsWith('fc') || s.startsWith('fd')) return true;  // unique local
    if (s.startsWith('fe80')) return true;                      // link-local
    // IPv4-mapped (::ffff:10.0.0.1) — check the embedded address.
    const m = s.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (m) return isPrivateAddress(m[1]);
    return false;
  }
  return true; // unparseable → treat as unsafe
}

/**
 * Check a URL is safe for the server to call.
 * @returns {Promise<{ok: true, url: URL} | {ok: false, reason: string}>}
 */
async function check(raw) {
  let url;
  try { url = new URL(String(raw || '').trim()); }
  catch (_) { return { ok: false, reason: 'That does not look like a valid URL.' }; }

  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'The URL must start with https:// — we will not send your secret over an unencrypted connection.' };
  }
  if (url.username || url.password) {
    return { ok: false, reason: 'Remove the username/password from the URL.' };
  }

  // A bare IP is allowed only if it's public; a hostname must resolve to one.
  let addresses;
  if (net.isIP(url.hostname)) {
    addresses = [{ address: url.hostname }];
  } else {
    try { addresses = await dns.lookup(url.hostname, { all: true }); }
    catch (_) { return { ok: false, reason: `Could not find ${url.hostname}. Check the address.` }; }
  }
  if (!addresses.length) return { ok: false, reason: `Could not find ${url.hostname}.` };
  if (addresses.some((a) => isPrivateAddress(a.address))) {
    return { ok: false, reason: 'That address is on a private network, so this server cannot reach it.' };
  }

  return { ok: true, url };
}

module.exports = { check, isPrivateAddress };
