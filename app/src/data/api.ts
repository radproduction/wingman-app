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

// ── Meetings shapes (backend /api/meetings) ──
export type ServerMeetingSummary = {
  overview?: string
  discussion?: string[]
  decisions?: string[]
  actions?: { task: string; owner?: string; due?: string; priority?: 'High' | 'Medium' | 'Low' }[]
  openQuestions?: string[]
  followUps?: string[]
}
export type ServerMeeting = {
  id: string
  title?: string
  type?: string
  company?: string
  location?: string
  virtual?: boolean
  attendees?: { name?: string; email?: string; role?: string; phone?: string }[]
  notes?: string
  summary?: ServerMeetingSummary | null
  status?: string
  meeting_at?: string
  emailed_at?: string
  recording_url?: string | null
}
export type EmailResult = { sent: string[]; failed: string[]; skipped: boolean; reason?: string }
export type AttendeeNotify = { sent: string[]; failed: { name: string; reason: string }[]; skipped?: string }

export type GoogleAccount = { id: string; email: string | null; is_primary: boolean; connected_at: string }

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

  // ── Meetings (notes → AI summary + action items → email attendees + user) ──
  meetings: () => get<{ meetings: ServerMeeting[] }>('/meetings'),
  createMeeting: (body: Record<string, unknown>) => req<{ meeting: ServerMeeting }>('POST', '/meetings', body),
  updateMeeting: (id: string, body: Record<string, unknown>) =>
    req<{ meeting: ServerMeeting }>('PATCH', `/meetings/${encodeURIComponent(id)}`, body),
  finalizeMeeting: (id: string, body: Record<string, unknown> = {}) =>
    req<{ meeting: ServerMeeting; email: EmailResult | null }>('POST', `/meetings/${encodeURIComponent(id)}/finalize`, body),
  sendMeeting: (id: string) =>
    req<{ email: EmailResult | null }>('POST', `/meetings/${encodeURIComponent(id)}/send`),
  // Turn the meeting's action items into real tasks (which then get reminders).
  createMeetingTasks: (id: string) =>
    req<{ created: number; tasks: { id: string; title: string; due_date: string | null }[] }>(
      'POST', `/meetings/${encodeURIComponent(id)}/create-tasks`,
    ),
  // Send the summary to attendees' WhatsApp numbers.
  notifyAttendees: (id: string) =>
    req<AttendeeNotify>('POST', `/meetings/${encodeURIComponent(id)}/notify-attendees`),
  // Upload a meeting recording → backend transcribes (Whisper) + summarizes (Claude).
  transcribeMeeting: async (id: string, blob: Blob, mime: string) => {
    const res = await fetch(`${BASE}/api/meetings/${encodeURIComponent(id)}/transcribe`, {
      method: 'POST',
      headers: headers({ 'Content-Type': mime || 'application/octet-stream' }),
      body: blob,
    })
    if (!res.ok) throw new ApiError(res.status, `transcribe → ${res.status}`)
    return (await res.json()) as { meeting: ServerMeeting; transcript?: string }
  },

  // ── Connections ──
  // One Google consent connects Calendar + Gmail + Tasks + Drive together
  // (the backend's combined scopes). The flow is keyed by phone.
  googleConnectUrl: (phone: string) =>
    `${BASE}/auth/google?phone=${encodeURIComponent(phone.replace(/\D/g, ''))}`,
  // Multiple Google accounts: list, set which sends/creates, unlink one.
  googleAccounts: () => get<{ accounts: GoogleAccount[] }>('/google/accounts'),
  setPrimaryGoogleAccount: (id: string) =>
    req<{ accounts: GoogleAccount[] }>('POST', `/google/accounts/${encodeURIComponent(id)}/primary`),
  disconnectGoogleAccount: (id: string) =>
    req<{ accounts: GoogleAccount[] }>('POST', `/google/accounts/${encodeURIComponent(id)}/disconnect`),
  // Real connection state, read from /me.
  connections: async () => {
    const me = await get<Record<string, unknown>>('/me')
    return {
      calendar: !!me.calendar_connected,
      gmail: !!me.gmail_connected,
      health: !!me.health_connected,
    }
  },

  // ── Places (home / office — separate from the settings allow-list) ──
  savePlace: (which: 'home' | 'office', address: string) =>
    req<{ saved: boolean; which: string; address: string }>('POST', '/places', { which, address }),

  // ── Webmail (IMAP/SMTP business email — creds verified + encrypted server-side) ──
  webmailConnect: (body: {
    address: string
    password: string
    imap_host?: string
    imap_port?: number
    smtp_host?: string
    smtp_port?: number
    from_name?: string
  }) =>
    req<{ connected: boolean; address: string; imap_host: string; smtp_host: string; can_send: boolean; send_note: string | null }>(
      'POST',
      '/webmail/connect',
      body,
    ),
  webmailDisconnect: () => req<{ connected: boolean }>('POST', '/webmail/disconnect'),

  // ── Location (device geolocation → traffic origin + "use my location") ──
  saveLocation: (lat: number, lng: number) =>
    req<{ ok: boolean; label: string | null }>('POST', '/location', { lat, lng }),
  reverseGeocode: (lat: number, lng: number) =>
    req<{ address: string }>('POST', '/location/reverse', { lat, lng }),

  // ── Actions ──
  completeTask: (id: string) => req<{ ok: boolean }>('POST', `/tasks/${id}/complete`),
  payBill: (id: string) => req<{ ok: boolean }>('POST', `/bills/${id}/pay`),
}

export type Api = typeof api
