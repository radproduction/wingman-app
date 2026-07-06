import type {
  Me, CalendarEvent, EmailItem, Task, Bill, Delivery, Trip, Health,
  Contact, Followup, Briefing, DashboardSummary,
  RequestOtpResponse, VerifyOtpResponse, SettingsPatch,
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
