/*
 * Wingman cookie consent (GDPR / ePrivacy).
 *
 * Nothing optional runs until the visitor says so:
 *   - essential   always on (remembering this choice; the site itself sets no other cookies)
 *   - analytics   Google Analytics (G-XMYP7WB2NB)
 *   - marketing   Meta Pixel (1634177868286804)
 * The choice is kept for 12 months in a first-party cookie + localStorage and
 * can be changed any time via any element with [data-cookie-settings] or
 * window.wmConsent.open().
 *
 * A page can queue its own events before this script loads, and they only fire
 * if that category is allowed:
 *   window.WM_TRACK = { gtag: [['event', 'waitlist_signup']], fbq: [['track', 'Lead']] }
 */
(function () {
  'use strict';
  if (window.wmConsent) return;

  var GA_ID = 'G-XMYP7WB2NB';
  var PIXEL_ID = '1634177868286804';
  var KEY = 'wm_consent';
  var VERSION = 1;
  var MAX_AGE = 365 * 24 * 3600;
  var POLICY_URL = '/privacy/#cookies';

  // ── storage ──────────────────────────────────────────────────────────
  function read() {
    var raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* blocked */ }
    if (!raw) {
      var m = document.cookie.match(new RegExp('(?:^|; )' + KEY + '=([^;]*)'));
      raw = m ? decodeURIComponent(m[1]) : null;
    }
    if (!raw) return null;
    try {
      var c = JSON.parse(raw);
      if (!c || c.v !== VERSION) return null;
      if (c.at && Date.now() - c.at > MAX_AGE * 1000) return null;
      return c;
    } catch (e) { return null; }
  }

  function write(choice) {
    var c = { v: VERSION, analytics: !!choice.analytics, marketing: !!choice.marketing, at: Date.now() };
    var s = JSON.stringify(c);
    try { localStorage.setItem(KEY, s); } catch (e) { /* blocked */ }
    document.cookie = KEY + '=' + encodeURIComponent(s) + '; Max-Age=' + MAX_AGE + '; Path=/; SameSite=Lax' +
      (location.protocol === 'https:' ? '; Secure' : '');
    return c;
  }

  // ── trackers (loaded only after consent) ─────────────────────────────
  var loaded = { analytics: false, marketing: false };
  var queued = window.WM_TRACK || {};

  function loadScript(src) {
    var s = document.createElement('script');
    s.async = true;
    s.src = src;
    document.head.appendChild(s);
  }

  function startAnalytics() {
    if (loaded.analytics) return;
    loaded.analytics = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'granted',
    });
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    (queued.gtag || []).forEach(function (args) { window.gtag.apply(null, args); });
    loadScript('https://www.googletagmanager.com/gtag/js?id=' + GA_ID);
  }

  function startMarketing() {
    if (loaded.marketing) return;
    loaded.marketing = true;
    /* Meta Pixel base code */
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = [];
      t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL_ID);
    window.fbq('track', 'PageView');
    (queued.fbq || []).forEach(function (args) { window.fbq.apply(null, args); });
  }

  function apply(c) {
    if (c.analytics) startAnalytics();
    if (c.marketing) startMarketing();
    // Turning something OFF takes effect on the next page load (the scripts are
    // simply not loaded again); also drop the cookies they set on this domain.
    if (!c.analytics) clearCookies(/^(_ga|_gid|_gat)/);
    if (!c.marketing) clearCookies(/^(_fbp|_fbc)$/);
  }

  function clearCookies(re) {
    document.cookie.split('; ').forEach(function (pair) {
      var name = pair.split('=')[0];
      if (!re.test(name)) return;
      var host = location.hostname;
      var parts = host.split('.');
      var domains = ['', host];
      if (parts.length > 1) domains.push('.' + parts.slice(-2).join('.'));
      domains.forEach(function (d) {
        document.cookie = name + '=; Max-Age=0; Path=/' + (d ? '; Domain=' + d : '');
      });
    });
  }

  // ── UI ───────────────────────────────────────────────────────────────
  var CSS = [
    '.wmc{position:fixed;z-index:2147483000;right:20px;bottom:20px;width:min(420px,calc(100vw - 32px));',
    'box-sizing:border-box;background:oklch(99% .003 259);color:oklch(21% .012 259);',
    'border:1px solid oklch(89% .006 259);border-radius:20px;padding:20px;',
    'box-shadow:0 24px 60px -20px oklch(26.4% .117 261/.35),0 2px 6px oklch(21% .012 259/.06);',
    'font:400 15px/1.55 "Geist",system-ui,-apple-system,"Segoe UI",sans-serif;',
    'opacity:0;transform:translateY(12px);transition:opacity .25s ease,transform .3s cubic-bezier(.22,1,.36,1)}',
    '.wmc.in{opacity:1;transform:none}',
    '.wmc *{box-sizing:border-box}',
    '.wmc__head{display:flex;gap:12px;align-items:flex-start}',
    '.wmc__ic{flex:none;width:36px;height:36px;border-radius:12px;display:grid;place-items:center;',
    'background:oklch(93.5% .028 265);color:oklch(52% .13 265)}',
    '.wmc__t{margin:0 0 4px;font-weight:600;font-size:16px;line-height:1.3}',
    '.wmc__p{margin:0;color:oklch(44% .011 259)}',
    '.wmc__p a{color:oklch(55.6% .158 265);text-underline-offset:3px;font-weight:500}',
    '.wmc__row{display:flex;gap:8px;align-items:center;margin-top:16px;flex-wrap:wrap}',
    '.wmc__btn{appearance:none;border:1px solid oklch(89% .006 259);background:oklch(97% .005 259);color:inherit;',
    'font-family:inherit;font-size:14px;font-weight:500;line-height:1;padding:11px 16px;border-radius:999px;cursor:pointer;transition:background .15s,border-color .15s}',
    '.wmc__btn:hover{background:oklch(94.5% .007 259)}',
    '.wmc__btn--pri{background:oklch(55.6% .158 265);border-color:oklch(55.6% .158 265);color:oklch(99% .003 259)}',
    '.wmc__btn--pri:hover{background:oklch(48% .15 265);border-color:oklch(48% .15 265)}',
    '.wmc__link{margin-left:auto;appearance:none;border:0;background:none;color:oklch(44% .011 259);font-size:14px;font-weight:500;line-height:1;',
    'font-family:inherit;padding:11px 4px;cursor:pointer;text-decoration:underline;text-underline-offset:3px}',
    '.wmc__link:hover{color:oklch(21% .012 259)}',
    '.wmc__btn:focus-visible,.wmc__link:focus-visible,.wmc__sw:focus-visible{outline:2px solid oklch(52% .19 265);outline-offset:2px}',
    '.wmc__list{margin:16px 0 0;padding:0;list-style:none;border-top:1px solid oklch(93% .005 259)}',
    '.wmc__item{display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid oklch(93% .005 259)}',
    '.wmc__item strong{display:block;font-weight:600;font-size:14px}',
    '.wmc__item span{display:block;color:oklch(52% .011 259);font-size:13px;line-height:1.45}',
    '.wmc__sw{flex:none;margin-left:auto;position:relative;width:42px;height:24px;border-radius:999px;border:0;cursor:pointer;',
    'background:oklch(89% .006 259);transition:background .2s}',
    '.wmc__sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;',
    'box-shadow:0 1px 3px oklch(21% .012 259/.25);transition:transform .2s cubic-bezier(.22,1,.36,1)}',
    '.wmc__sw[aria-checked="true"]{background:oklch(55.6% .158 265)}',
    '.wmc__sw[aria-checked="true"]::after{transform:translateX(18px)}',
    '.wmc__sw[disabled]{opacity:.55;cursor:not-allowed}',
    '@media (max-width:560px){.wmc{left:12px;right:12px;bottom:12px;width:auto;padding:18px}',
    '.wmc__row .wmc__btn{flex:1 1 auto}}',
    '@media (prefers-reduced-motion:reduce){.wmc,.wmc__sw,.wmc__sw::after{transition:none}}',
  ].join('');

  var ICON = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3a9 9 0 1 0 9 9 4 4 0 0 1-4-4 4 4 0 0 1-4-4 1 1 0 0 0-1-1Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8.5" cy="10.5" r="1.1" fill="currentColor"/><circle cx="12.5" cy="15.5" r="1.1" fill="currentColor"/><circle cx="16" cy="12.5" r=".9" fill="currentColor"/><circle cx="8" cy="15" r=".8" fill="currentColor"/></svg>';

  var root = null;
  var styled = false;

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function sw(label, on, disabled) {
    var b = el('button', 'wmc__sw');
    b.type = 'button';
    b.setAttribute('role', 'switch');
    b.setAttribute('aria-label', label);
    b.setAttribute('aria-checked', on ? 'true' : 'false');
    if (disabled) b.disabled = true;
    else b.addEventListener('click', function () {
      b.setAttribute('aria-checked', b.getAttribute('aria-checked') === 'true' ? 'false' : 'true');
    });
    return b;
  }

  function close() {
    if (!root) return;
    var r = root;
    root = null;
    r.classList.remove('in');
    setTimeout(function () { if (r.parentNode) r.parentNode.removeChild(r); }, 260);
  }

  function decide(choice) {
    var c = write(choice);
    apply(c);
    close();
  }

  function open(startManaging) {
    if (!styled) {
      var st = document.createElement('style');
      st.textContent = CSS;
      document.head.appendChild(st);
      styled = true;
    }
    if (root) close();
    var current = read() || { analytics: false, marketing: false };

    root = el('section', 'wmc');
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-label', 'Cookies on Wingman');

    var head = el('div', 'wmc__head');
    head.appendChild(el('div', 'wmc__ic', ICON));
    var txt = el('div');
    txt.appendChild(el('p', 'wmc__t', 'Cookies on Wingman'));
    txt.appendChild(el('p', 'wmc__p',
      'We use essential storage to remember this choice. With your permission we also use analytics and marketing ' +
      'cookies to understand visits and measure our ads. <a href="' + POLICY_URL + '">Privacy policy</a>'));
    head.appendChild(txt);
    root.appendChild(head);

    var list = el('ul', 'wmc__list');
    var swA = sw('Analytics cookies', current.analytics);
    var swM = sw('Marketing cookies', current.marketing);
    [
      ['Essential', 'Remembers your cookie choice. Always on.', sw('Essential cookies', true, true)],
      ['Analytics', 'Google Analytics — which pages are visited, so we can improve the site.', swA],
      ['Marketing', 'Meta Pixel — measures how our ads perform.', swM],
    ].forEach(function (row) {
      var li = el('li', 'wmc__item');
      var t = el('div');
      t.appendChild(el('strong', null, row[0]));
      t.appendChild(el('span', null, row[1]));
      li.appendChild(t);
      li.appendChild(row[2]);
      list.appendChild(li);
    });

    var actions = el('div', 'wmc__row');
    var essential = el('button', 'wmc__btn', 'Essential only');
    var all = el('button', 'wmc__btn wmc__btn--pri', 'Accept all');
    var manage = el('button', 'wmc__link', 'Manage');
    [essential, all, manage].forEach(function (b) { b.type = 'button'; });
    essential.addEventListener('click', function () { decide({ analytics: false, marketing: false }); });
    all.addEventListener('click', function () { decide({ analytics: true, marketing: true }); });

    function showManage() {
      if (list.parentNode) return;
      root.insertBefore(list, actions);
      manage.textContent = 'Save choices';
      manage.className = 'wmc__btn';
      manage.onclick = function () {
        decide({
          analytics: swA.getAttribute('aria-checked') === 'true',
          marketing: swM.getAttribute('aria-checked') === 'true',
        });
      };
      swA.focus();
    }
    manage.onclick = showManage;

    actions.appendChild(essential);
    actions.appendChild(all);
    actions.appendChild(manage);
    root.appendChild(actions);

    document.body.appendChild(root);
    if (startManaging) showManage();
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (root) root.classList.add('in'); }); });
  }

  // "Cookie settings" links anywhere on the page (including ones rendered later).
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings],a[href="#cookie-settings"]') : null;
    if (!t) return;
    e.preventDefault();
    open(true);
  });

  window.wmConsent = { open: function () { open(true); }, get: read };

  function boot() {
    var c = read();
    if (c) apply(c);
    else open(false);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
