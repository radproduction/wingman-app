'use strict';

/**
 * Meeting notes email — HTML version in the Wingman email look (same visual
 * language as the waitlist thank-you: soft blue hero, rounded panels, Google
 * Sans stack, light + dark mode). Table-based and fully inline-styled so it
 * renders the same in Gmail, Outlook and Apple Mail.
 *
 * Pure function: renderNotesEmail(meeting, summary, opts) → { html, preheader }.
 * Every piece of meeting text is HTML-escaped — transcripts are untrusted input.
 */

const config = require('../config');

const FONT = "'Google Sans Flex','Google Sans',-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
// Two palettes. 'light' is the default: it follows the reader's own setting —
// Apple Mail / iOS Mail switch it to the dark palette via prefers-color-scheme,
// and the Gmail apps in dark mode auto-invert it into a dark version. A forced
// 'dark' email does NOT survive the Gmail app: Gmail inverts it back to light
// (seen on iOS, Oct 2026). Set MEETING_EMAIL_THEME=dark only for clients that
// don't recolour mail.
const THEMES = {
  light: {
    bg: '#ffffff', ink: '#1c1b1a', muted: '#6f6d68', accent: '#3a5cb8', btn: '#4a6fd4', btnInk: '#ffffff',
    hero: '#dde5f8', panel: '#e9edf4', chip: '#ffffff', numBg: '#ffffff', numBorder: '#4a6fd4',
    line: 'rgba(28,27,26,0.10)', logo: 'logo.png', pri: 'light',
  },
  dark: {
    bg: '#131313', ink: '#f4f4f4', muted: '#a0a0a0', accent: '#adcbff', btn: '#8ab4f8', btnInk: '#101014',
    hero: '#222f4f', panel: '#1d1d1f', chip: '#2a2a2a', numBg: '#223349', numBorder: '#8ab4f8',
    line: 'rgba(255,255,255,0.10)', logo: 'logo-dark.png', pri: 'dark',
  },
};
let T = THEMES.light; // set per render (render is synchronous)

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function assetBase() {
  const base = (config.waitlist && config.waitlist.thankYou && config.waitlist.thankYou.publicUrl) || 'https://app.imyourwingman.ai';
  return `${base.replace(/\/+$/, '')}/email/v1/`;
}

function fmtWhen(iso, tz) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'Asia/Karachi', weekday: 'long', month: 'long', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(d);
  } catch (_) {
    return d.toUTCString();
  }
}

function plural(n, one, many) { return `${n} ${n === 1 ? one : many}`; }

const PRIORITY = {
  High: { bg: '#fde2e1', fg: '#b3261e', dbg: '#4a1f1d', dfg: '#ffb4ab' },
  Medium: { bg: '#fdf0c8', fg: '#7a5900', dbg: '#3d3212', dfg: '#f5d77a' },
  Low: { bg: '#e6e8ee', fg: '#51545c', dbg: '#2a2c31', dfg: '#c4c7cf' },
};

// ─── building blocks ────────────────────────────────────────────────

function sectionTitle(text, count) {
  return `<tr><td class="wm-pad wm-font wm-ink" style="padding:36px 32px 12px;font-family:${FONT};font-size:20px;line-height:26px;letter-spacing:-0.01em;color:${T.ink};">${esc(text)}${count != null ? ` <span class="wm-muted" style="font-size:15px;color:${T.muted};">${count}</span>` : ''}</td></tr>`;
}

function bulletList(items, marker) {
  const rows = items.map((it) => `
      <tr>
        <td width="22" valign="top" class="wm-font wm-accent" style="padding:6px 0 0;font-family:${FONT};font-size:15px;line-height:22px;color:${T.accent};">${marker}</td>
        <td valign="top" class="wm-font wm-ink" style="padding:6px 0 0;font-family:${FONT};font-size:15px;line-height:22px;color:${T.ink};">${esc(it)}</td>
      </tr>`).join('');
  return `<tr><td class="wm-pad" style="padding:0 32px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>`;
}

function actionItems(actions) {
  const rows = actions.map((a, i) => {
    const pr = PRIORITY[a.priority] || PRIORITY.Medium;
    const p = T.pri === 'dark' ? { bg: pr.dbg, fg: pr.dfg } : pr;
    const meta = [];
    if (a.owner) meta.push(`<span class="wm-chip" style="display:inline-block;margin:6px 6px 0 0;padding:3px 10px;border-radius:999px;background:${T.chip};font-size:12px;line-height:18px;color:${T.ink};">👤 ${esc(a.owner)}</span>`);
    if (a.due) meta.push(`<span class="wm-chip" style="display:inline-block;margin:6px 6px 0 0;padding:3px 10px;border-radius:999px;background:${T.chip};font-size:12px;line-height:18px;color:${T.ink};">📅 ${esc(a.due)}</span>`);
    meta.push(`<span class="wm-pri-${esc(a.priority || 'Medium')}" style="display:inline-block;margin:6px 6px 0 0;padding:3px 10px;border-radius:999px;background:${p.bg};font-size:12px;line-height:18px;font-weight:500;color:${p.fg};">${esc(a.priority || 'Medium')}</span>`);
    return `
      <tr>
        <td width="32" valign="top" style="padding:${i ? 18 : 4}px 0 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:separate;"><tr><td align="center" valign="middle" class="wm-num wm-font" style="width:26px;height:26px;border-radius:999px;background:${T.numBg};border:2px solid ${T.numBorder};font-family:${FONT};font-size:12px;line-height:22px;font-weight:600;color:${T.accent};">${i + 1}</td></tr></table>
        </td>
        <td valign="top" class="wm-font" style="padding:${i ? 18 : 4}px 0 0 14px;font-family:${FONT};">
          <p class="wm-ink" style="margin:0;font-size:15px;line-height:22px;font-weight:500;color:${T.ink};">${esc(a.task)}</p>
          <div>${meta.join('')}</div>
        </td>
      </tr>`;
  }).join('');
  return `
  <tr><td class="wm-gutter" style="padding:0 16px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wm-panel" style="background:${T.panel};border-radius:24px;">
      <tr><td class="wm-pad wm-font wm-ink" style="padding:28px 32px 6px;font-family:${FONT};font-size:20px;line-height:26px;letter-spacing:-0.01em;color:${T.ink};">Action items <span class="wm-muted" style="font-size:15px;color:${T.muted};">${actions.length}</span></td></tr>
      <tr><td class="wm-pad" style="padding:8px 32px 28px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>
    </table>
  </td></tr>`;
}

function statCell(n, label) {
  return `<td align="center" class="wm-font" style="padding:0 6px;font-family:${FONT};">
    <p class="wm-ink" style="margin:0;font-size:26px;line-height:30px;font-weight:500;color:${T.ink};">${n}</p>
    <p class="wm-muted" style="margin:2px 0 0;font-size:12px;line-height:16px;color:${T.muted};">${esc(label)}</p>
  </td>`;
}


// Logo = the colourful W mark (an image that reads on light AND dark) + the
// word "Wingman" as live text. A single wordmark image breaks in Gmail's app
// dark mode: Gmail inverts the email's colours but never the images, so a
// white-text logo vanishes on the inverted light background (and vice versa).
// Live text is inverted together with its background, so it always contrasts.
function logoBlock(img, markH, textPx) {
  const markW = Math.round(markH * 87 / 62);
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center"><tr>
    <td valign="middle" style="padding:0 8px 0 0;"><img src="${img}logo-mark.png" width="${markW}" height="${markH}" alt="" style="display:block;width:${markW}px;height:${markH}px;"></td>
    <td valign="middle" class="wm-font wm-ink" style="font-family:${FONT};font-size:${textPx}px;line-height:${markH}px;font-weight:500;letter-spacing:-0.01em;color:${T.ink};">Wingman</td>
  </tr></table>`;
}

// ─── the email ──────────────────────────────────────────────────────

/**
 * @param {object} meeting  { title, meeting_at, attendees:[{name,email}], recording_url }
 * @param {object} summary  normalized summary from meetingNotes.normalize()
 * @param {object} [opts]   { tz, ownerName }
 */
function renderNotesEmail(meeting = {}, summary = {}, { tz, ownerName, theme } = {}) {
  const themeName = String(theme || (config.meetingEmail && config.meetingEmail.theme) || 'light').toLowerCase();
  T = THEMES[themeName] || THEMES.light;
  const isDark = T === THEMES.dark;
  const img = assetBase();
  const title = (meeting.title || 'Meeting').trim();
  const when = fmtWhen(meeting.meeting_at, tz);
  const attendees = (Array.isArray(meeting.attendees) ? meeting.attendees : [])
    .map((a) => (a && (a.name || a.email)) || '').filter(Boolean);
  const recUrl = meeting.recording_url || meeting.recordingUrl || '';
  const s = {
    overview: summary.overview || '',
    discussion: summary.discussion || [],
    decisions: summary.decisions || [],
    actions: summary.actions || [],
    openQuestions: summary.openQuestions || [],
    followUps: summary.followUps || [],
  };

  const metaLine = [when, attendees.length ? plural(attendees.length, 'attendee', 'attendees') : ''].filter(Boolean).join('  ·  ');
  const preheader = s.actions.length
    ? `${plural(s.actions.length, 'action item', 'action items')} and ${plural(s.decisions.length, 'decision', 'decisions')} from ${title}.`
    : `Summary of ${title}.`;

  const blocks = [];

  // Overview
  if (s.overview) {
    blocks.push(`<tr><td class="wm-pad wm-font" style="padding:36px 32px 0;font-family:${FONT};">
      <p class="wm-muted" style="margin:0 0 8px;font-size:12px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:${T.muted};">In short</p>
      <p class="wm-ink" style="margin:0;font-size:16px;line-height:26px;color:${T.ink};">${esc(s.overview)}</p>
    </td></tr>`);
  }

  // Stats strip
  blocks.push(`<tr><td class="wm-gutter" style="padding:28px 16px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wm-line" style="border-top:1px solid ${T.line};border-bottom:1px solid ${T.line};">
      <tr><td style="padding:18px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        ${statCell(s.actions.length, s.actions.length === 1 ? 'Action item' : 'Action items')}
        ${statCell(s.decisions.length, s.decisions.length === 1 ? 'Decision' : 'Decisions')}
        ${statCell(s.openQuestions.length, s.openQuestions.length === 1 ? 'Open question' : 'Open questions')}
      </tr></table></td></tr>
    </table>
  </td></tr>`);

  if (s.actions.length) blocks.push(`<tr><td style="padding:28px 0 0;"></td></tr>${actionItems(s.actions)}`);
  if (s.decisions.length) { blocks.push(sectionTitle('Decisions', s.decisions.length)); blocks.push(bulletList(s.decisions, '✓')); }
  if (s.discussion.length) { blocks.push(sectionTitle('Key discussion')); blocks.push(bulletList(s.discussion, '•')); }
  if (s.openQuestions.length) { blocks.push(sectionTitle('Open questions', s.openQuestions.length)); blocks.push(bulletList(s.openQuestions, '?')); }
  if (s.followUps.length) { blocks.push(sectionTitle('Follow-ups')); blocks.push(bulletList(s.followUps, '→')); }

  // Recording band
  if (recUrl) {
    blocks.push(`<tr><td class="wm-gutter" style="padding:40px 16px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wm-band" style="background:${T.hero};border-radius:24px;">
        <tr><td align="center" class="wm-font" style="padding:28px 32px;font-family:${FONT};">
          <p class="wm-ink" style="margin:0;font-size:18px;line-height:24px;color:${T.ink};">The full recording is saved</p>
          <p class="wm-ink" style="margin:6px 0 0;font-size:14px;line-height:21px;color:${T.ink};">Watch or share it from Google Drive.</p>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px auto 0;"><tr>
            <td align="center" class="wm-btn" style="background:${T.btn};border-radius:999px;">
              <a href="${esc(recUrl)}" class="wm-btn" style="display:inline-block;padding:12px 28px;font-family:${FONT};font-size:15px;line-height:24px;font-weight:500;color:${T.btnInk};text-decoration:none;border-radius:999px;">▶&nbsp; Watch recording</a>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td></tr>`);
  }

  // Attendees
  if (attendees.length) {
    blocks.push(`<tr><td class="wm-pad wm-font" style="padding:32px 32px 0;font-family:${FONT};">
      <p class="wm-muted" style="margin:0 0 6px;font-size:12px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:${T.muted};">Attendees</p>
      <p class="wm-ink" style="margin:0;font-size:14px;line-height:22px;color:${T.ink};">${attendees.map(esc).join('  ·  ')}</p>
    </td></tr>`);
  }

  const who = ownerName ? `${esc(ownerName)}'s Wingman` : 'Wingman';

  const html = `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="${isDark ? 'dark' : 'light dark'}">
  <meta name="supported-color-schemes" content="${isDark ? 'dark' : 'light dark'}">
  <title>${esc(title)} — notes</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Google+Sans+Flex:opsz,wght,ROND@6..144,300..700,0..100&display=swap">
  <style>
    body { margin:0; padding:0; width:100% !important; -webkit-text-size-adjust:100%; }
    table { border-collapse:collapse; }
    img { border:0; outline:none; text-decoration:none; -ms-interpolation-mode:bicubic; }
    a { color:${T.accent}; }
    .wm-font { font-family:${FONT}; font-variation-settings:'ROND' 100; }
    @media (max-width:620px) {
      .wm-container { width:100% !important; }
      .wm-gutter { padding-left:12px !important; padding-right:12px !important; }
      .wm-pad { padding-left:22px !important; padding-right:22px !important; }
      .wm-h1 { font-size:28px !important; line-height:34px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .wm-bg { background:#131313 !important; }
      .wm-hero, .wm-band { background:#222f4f !important; }
      .wm-panel { background:#191919 !important; }
      .wm-ink { color:#f4f4f4 !important; }
      .wm-muted { color:#a0a0a0 !important; }
      .wm-accent { color:#adcbff !important; }
      .wm-line { border-color:rgba(255,255,255,0.09) !important; }
      .wm-num { background:#223349 !important; color:#adcbff !important; border-color:#8ab4f8 !important; }
      .wm-chip { background:#2a2a2a !important; color:#f4f4f4 !important; }
      .wm-pri-High { background:${PRIORITY.High.dbg} !important; color:${PRIORITY.High.dfg} !important; }
      .wm-pri-Medium { background:${PRIORITY.Medium.dbg} !important; color:${PRIORITY.Medium.dfg} !important; }
      .wm-pri-Low { background:${PRIORITY.Low.dbg} !important; color:${PRIORITY.Low.dfg} !important; }
      .wm-btn { background:#8ab4f8 !important; color:#101014 !important; }
      .wm-link { color:#adcbff !important; }
      .wm-logo-light { display:none !important; }
      .wm-logo-dark { display:block !important; max-height:none !important; overflow:visible !important; }
    }
  </style>
</head>
<body class="wm-bg" style="margin:0;padding:0;background:${T.bg};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${esc(preheader)}&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;&#8199;&#65279;&#847;</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wm-bg" style="background:${T.bg};">
    <tr><td align="center" style="padding:24px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="wm-container" style="width:600px;max-width:600px;">

        <tr><td align="center" style="padding:8px 32px 24px;">
          <a href="https://imyourwingman.ai" style="text-decoration:none;">
            ${logoBlock(img, 30, 24)}
          </a>
        </td></tr>

        <tr><td class="wm-gutter" style="padding:0 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="wm-hero" style="background:${T.hero};border-radius:24px;">
            <tr><td class="wm-pad wm-font" style="padding:32px 32px 30px;font-family:${FONT};">
              <p class="wm-accent" style="margin:0;font-size:12px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;font-weight:600;color:${T.accent};">Meeting notes</p>
              <p class="wm-ink wm-h1" style="margin:10px 0 0;font-size:32px;line-height:38px;font-weight:400;letter-spacing:-0.02em;color:${T.ink};">${esc(title)}</p>
              ${metaLine ? `<p class="wm-ink" style="margin:10px 0 0;font-size:14px;line-height:21px;color:${T.ink};opacity:0.75;">${esc(metaLine)}</p>` : ''}
            </td></tr>
          </table>
        </td></tr>

        ${blocks.join('\n')}

        <tr><td class="wm-pad" style="padding:44px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr><td align="center" class="wm-line" style="border-top:1px solid ${T.line};padding-top:28px;">
              <a href="https://imyourwingman.ai" style="text-decoration:none;">
                ${logoBlock(img, 24, 19)}
              </a>
            </td></tr>
            <tr><td align="center" class="wm-font wm-muted" style="padding:14px 16px 32px;font-family:${FONT};font-size:12px;line-height:19px;color:${T.muted};">
              Notes taken by ${who}, your AI chief of staff.<br>
              Something missing? Just reply to this email.<br><br>
              <a href="https://imyourwingman.ai" class="wm-link" style="color:${T.accent};font-weight:500;text-decoration:none;">imyourwingman.ai</a>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  return { html, preheader };
}

module.exports = { renderNotesEmail };
