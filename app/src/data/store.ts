import { useSyncExternalStore } from 'react'
import { profile as seed } from './mock'
import { api } from './api'

export type Profile = typeof seed

const KEY = 'wingman.profile'

const read = (): Profile => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...seed, ...JSON.parse(raw) } : seed
  } catch {
    return seed
  }
}

let current: Profile = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const useProfile = () => useSyncExternalStore(subscribe, () => current)

export const getProfile = () => current

export const saveProfile = (patch: Partial<Profile>) => {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

/** Drop the cached profile (used on sign-out / invalid token) so a stale name
 * (e.g. the mock user) never lingers on the Welcome/greeting screens. */
export const resetProfile = () => {
  current = seed
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* ignore */
  }
  listeners.forEach((fn) => fn())
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] || full

const fmtTime = (t?: unknown): string | undefined => {
  const s = typeof t === 'string' ? t : ''
  if (!s.includes(':')) return undefined
  const [hs, m] = s.split(':')
  let h = Number(hs)
  const ap = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ap}`
}

/**
 * Pull the real profile from the backend (/api/me) and merge it into the store,
 * so the greeting, header and settings read the actual user — not the seed. The
 * backend owns name, phone, timezone, work hours and briefing/wrap times; it
 * leaves the rest untouched. Best-effort: a failure keeps whatever we have.
 */
const sinceLabel = (iso?: unknown): string | undefined => {
  const s = typeof iso === 'string' ? iso : ''
  const d = new Date(s.includes('T') ? s : `${s}Z`)
  if (Number.isNaN(d.getTime())) return undefined
  return `With you since ${d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}`
}

export const hydrateProfile = async (): Promise<void> => {
  try {
    const me = (await api.me()) as Record<string, unknown>
    const patch: Partial<Profile> = {}
    if (me.name) patch.name = String(me.name)
    if (me.phone) patch.phone = String(me.phone).startsWith('+') ? String(me.phone) : `+${me.phone}`
    if (me.email) patch.email = String(me.email)
    if (typeof me.avatar_url === 'string' && me.avatar_url) patch.avatarUrl = me.avatar_url
    if (me.timezone) patch.timezone = String(me.timezone)
    if (me.work_hours_start && me.work_hours_end) patch.workday = `${me.work_hours_start} to ${me.work_hours_end}`
    const b = fmtTime(me.briefing_time)
    if (b) patch.briefing = b
    const w = fmtTime(me.debrief_time)
    if (w) patch.wrap = w
    if (me.runs_business != null) patch.workspace = me.runs_business ? 'Personal & business workspace' : 'Personal workspace'
    const since = sinceLabel(me.created_at)
    if (since) patch.since = since
    saveProfile(patch)
  } catch {
    /* keep what we have */
  }
}

// NOTE: no auto-hydrate on module load. App.tsx hydrates AFTER the token is
// validated (see the auth-heal effect), so a stale/invalid token never caches
// the mock user's name here.
