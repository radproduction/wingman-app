// The one door to the Wingman backend — the SAME API that WhatsApp and the
// existing web client already run on. This app's src/data/* modules call
// through here so the exact UI carries real, dynamic data. Nothing on the
// server changes.
//
// Base URL: VITE_API_BASE if set (e.g. http://localhost:3000 for a local
// backend), otherwise the live server. CORS on the backend is open, so the
// app can call it straight from the browser with a Bearer token.

const BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, '') ?? 'https://imyourwingman.ai'

const TOKEN_KEY = 'wingman.token'

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export const setToken = (token: string | null) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* ignore */
  }
}

export const isSignedIn = (): boolean => !!getToken()

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const token = getToken()
  return token ? { ...extra, Authorization: `Bearer ${token}` } : extra
}

async function req<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE}/api${path}`, {
    method,
    headers: headers(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    let msg = `${method} ${path} → ${res.status}`
    try {
      const j = (await res.json()) as { error?: string }
      if (j?.error) msg = j.error
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg)
  }
  // some endpoints (logout) may return empty
  const text = await res.text()
  return (text ? JSON.parse(text) : {}) as T
}

const get = <T>(path: string) => req<T>('GET', path)

export const api = {
  base: BASE,

  // ── Auth (real OTP over WhatsApp, from the backend) ──
  requestOtp: (phone: string) => req<{ ok: boolean; devCode?: string }>('POST', '/auth/request-otp', { phone }),
  verifyOtp: async (phone: string, code: string) => {
    const res = await req<{ token: string; user: unknown }>('POST', '/auth/verify-otp', { phone, code })
    if (res.token) setToken(res.token)
    return res
  },
  authMe: () => get<{ user: unknown }>('/auth/me'),
  logout: async () => {
    try {
      await req('POST', '/auth/logout')
    } finally {
      setToken(null)
    }
  },

  // ── Profile / settings ──
  me: () => get<Record<string, unknown>>('/me'),
  updateMe: (patch: Record<string, unknown>) => req<{ user: unknown }>('PATCH', '/me', patch),
  completeOnboarding: (patch: Record<string, unknown>) => req<{ user: unknown }>('POST', '/onboarding/complete', patch),

  // ── Data (domain modules map these onto the UI's shapes) ──
  dashboard: () => get<Record<string, unknown>>('/dashboard'),
  calendar: () => get<{ events: unknown[]; mock?: boolean }>('/calendar'),
  emails: () => get<{ emails: unknown[]; mock?: boolean }>('/emails'),
  tasks: () => get<{ tasks: unknown[]; mock?: boolean }>('/tasks'),
  bills: () => get<{ bills: unknown[]; mock?: boolean }>('/bills'),
  deliveries: () => get<{ deliveries: unknown[]; mock?: boolean }>('/deliveries'),
  travel: () => get<{ trips: unknown[]; mock?: boolean }>('/travel'),
  health: () => get<{ health: unknown; mock?: boolean }>('/health-data'),
  contacts: () => get<{ contacts: unknown[]; mock?: boolean }>('/contacts'),
  followups: () => get<{ followups: unknown[]; mock?: boolean }>('/followups'),
  briefings: () => get<{ briefings: unknown[]; mock?: boolean }>('/briefings'),

  // ── Places (home / office — separate from the settings allow-list) ──
  savePlace: (which: 'home' | 'office', address: string) =>
    req<{ saved: boolean; which: string; address: string }>('POST', '/places', { which, address }),

  // ── Actions ──
  completeTask: (id: string) => req<{ ok: boolean }>('POST', `/tasks/${id}/complete`),
  payBill: (id: string) => req<{ ok: boolean }>('POST', `/bills/${id}/pay`),
}

export type Api = typeof api
