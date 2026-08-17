import Constants from 'expo-constants';
import { getToken, setToken } from '../lib/auth';
import type { Me, RequestOtpResponse, VerifyOtpResponse, DashboardSummary } from './types';

/**
 * The app's single door to the Wingman backend — the SAME API the web client
 * and WhatsApp already run on. The native app is just a new client; nothing on
 * the server changes. Base URL comes from app.json > expo.extra.apiBaseUrl.
 */
const BASE =
  (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl ??
  'https://imyourwingman.ai';

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function authHeaders(extra: Record<string, string> = {}): Promise<Record<string, string>> {
  const token = await getToken();
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra;
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, { headers: await authHeaders() });
  if (!res.ok) throw new ApiError(res.status, `GET ${path} → ${res.status}`);
  return (await res.json()) as T;
}

async function send<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: await authHeaders(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

export const api = {
  // ── Auth ──
  requestOtp: (phone: string) => send<RequestOtpResponse>('POST', '/auth/request-otp', { phone }),
  verifyOtp: async (phone: string, code: string) => {
    const res = await send<VerifyOtpResponse>('POST', '/auth/verify-otp', { phone, code });
    if (res.token) await setToken(res.token);
    return res;
  },
  authMe: () => get<{ user: Me }>('/auth/me'),
  logout: async () => {
    try {
      await send<{ ok: boolean }>('POST', '/auth/logout');
    } finally {
      await setToken(null);
    }
  },

  // ── Profile / data (add per screen as you wire them) ──
  me: () => get<Me>('/me'),
  dashboard: () => get<DashboardSummary>('/dashboard'),
  calendar: () => get<{ events: unknown[]; mock: boolean }>('/calendar'),
  emails: () => get<{ emails: unknown[]; mock: boolean }>('/emails'),
  tasks: () => get<{ tasks: unknown[]; mock: boolean }>('/tasks'),
};

export { BASE };
