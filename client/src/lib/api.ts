import type {
  Me, CalendarEvent, EmailItem, Task, Bill, Delivery, Trip, Health, HealthConnectInfo,
  Contact, Followup, Briefing, DashboardSummary,
  RequestOtpResponse, VerifyOtpResponse, SettingsPatch, GoogleAccount,
} from '../types';

const BASE = '/api';
const TOKEN_KEY = 'wingman_token';

// ── Session token storage ─────────────────────────────────────────────
export function getToken(): string | null {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token: string | null) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

function authHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: authHeaders() });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} → ${res.status}`);
  return res.json() as Promise<T>;
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    try { const j = await res.json(); if (j?.error) msg = j.error; } catch { /* ignore */ }
    throw new ApiError(res.status, msg);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // ── Auth ──
  requestOtp: (phone: string) =>
    send<RequestOtpResponse>('POST', '/auth/request-otp', { phone }),
  verifyOtp: (phone: string, code: string) =>
    send<VerifyOtpResponse>('POST', '/auth/verify-otp', { phone, code }),
  authMe: () => get<{ user: Me }>('/auth/me'),
  logout: () => send<{ ok: boolean }>('POST', '/auth/logout'),

  // ── Profile / settings ──
  me: () => get<Me>('/me'),
  updateSettings: (patch: SettingsPatch) =>
    send<{ user: Me }>('PATCH', '/me', patch),
  completeOnboarding: (patch: SettingsPatch) =>
    send<{ user: Me }>('POST', '/onboarding/complete', patch),

  // ── Google accounts (multi-account) ──
  googleAccounts: () => get<{ accounts: GoogleAccount[] }>('/google/accounts'),
  googleDisconnect: (id: string) =>
    send<{ accounts: GoogleAccount[] }>('POST', `/google/accounts/${id}/disconnect`),
  googleSetPrimary: (id: string) =>
    send<{ accounts: GoogleAccount[] }>('POST', `/google/accounts/${id}/primary`),

  // ── Places (home / office for traffic) ──
  savePlace: (which: 'home' | 'office', address: string) =>
    send<{ saved: boolean; which: string; address: string }>('POST', '/places', { which, address }),

  // ── Health (private ingest link for phone automations) ──
  healthConnect: () =>
    get<HealthConnectInfo>('/health/connect'),
  healthResetLink: () => send<{ ingest_url: string }>('POST', '/health/reset-link'),

  // ── Google Health (one-click OAuth: Android, Pixel Watch, Fitbit, Wear OS) ──
  healthGoogle: () =>
    get<{ connected: boolean; last_synced_at: string | null; connect_url: string }>('/health/google'),
  healthGoogleSync: () =>
    send<{ ok: boolean; saved: number; skipped: number; errors: string[] }>('POST', '/health/google/sync'),
  healthGoogleDisconnect: () =>
    send<{ ok: boolean; connected: boolean }>('POST', '/health/google/disconnect'),

  // ── Work clock (attendance / HRMS) ──
  workConnect: () =>
    get<{
      webhook_url: string;
      connected: boolean;
      status: { clocked_in?: boolean; since?: string | null; worked_today?: string | null };
      action_configured: boolean;
      action_url: string | null;
      employee_ref: string | null;
    }>('/work/connect'),
  workResetLink: () => send<{ webhook_url: string }>('POST', '/work/reset-link'),
  workSetAction: (body: { url: string; secret: string; employee_ref?: string | null }) =>
    send<{ ok: boolean; configured: boolean; url: string }>('POST', '/work/action', body),
  workClearAction: () => send<{ ok: boolean; configured: boolean }>('POST', '/work/action', { disconnect: true }),
  workTestAction: (event: 'clock_in' | 'clock_out') =>
    send<{ ok: boolean; event: string; at: string }>('POST', '/work/action/test', { event }),

  // ── Business email (IMAP/SMTP) ──
  webmailDetect: (address: string) =>
    get<{ imapHost: string; imapPort: number; smtpHost: string; smtpPort: number; note: string | null; guessed: boolean }>(
      '/webmail/detect?address=' + encodeURIComponent(address)),
  webmailConnect: (body: {
    address: string; password: string;
    imap_host?: string; imap_port?: number; smtp_host?: string; smtp_port?: number; from_name?: string;
  }) => send<{ connected: boolean; address: string }>('POST', '/webmail/connect', body),
  webmailDisconnect: () => send<{ connected: boolean }>('POST', '/webmail/disconnect'),

  // ── Shopify ──
  shopifyConnect: (domain: string, token: string) =>
    send<{ connected: boolean; shop: string; domain: string; currency: string }>(
      'POST', '/shopify/connect', { domain, token },
    ),
  shopifyDisconnect: () => send<{ connected: boolean }>('POST', '/shopify/disconnect'),

  // ── Data ──
  dashboard: () => get<DashboardSummary>('/dashboard'),
  calendar: () => get<{ events: CalendarEvent[]; mock: boolean }>('/calendar'),
  emails: () => get<{ emails: EmailItem[]; mock: boolean }>('/emails'),
  tasks: () => get<{ tasks: Task[]; mock: boolean }>('/tasks'),
  bills: () => get<{ bills: Bill[]; mock: boolean }>('/bills'),
  deliveries: () => get<{ deliveries: Delivery[]; mock: boolean }>('/deliveries'),
  travel: () => get<{ trips: Trip[]; mock: boolean }>('/travel'),
  health: () => get<{ health: Health; mock: boolean }>('/health-data'),
  contacts: () => get<{ contacts: Contact[]; mock: boolean }>('/contacts'),
  followups: () => get<{ followups: Followup[]; mock: boolean }>('/followups'),
  briefings: () => get<{ briefings: Briefing[]; mock: boolean }>('/briefings'),
  completeTask: (id: string) => send<{ ok: boolean }>('POST', `/tasks/${id}/complete`),
  payBill: (id: string) => send<{ ok: boolean }>('POST', `/bills/${id}/pay`),
};
