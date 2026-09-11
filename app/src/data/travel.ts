import { useSyncExternalStore } from 'react'
import type { IconName } from '../app/icons'
import type { ChipTone } from './mock'
import { api } from './api'

// Real trips (detected from the user's mail) from /api/travel, mapped onto the
// shape the Travel screen renders. Null until loaded — the screen shows an
// honest empty state until then, and if no upcoming trips come back.
//
// Only the trip's own fields are shown. The old screen also had "What I'm
// watching" (fare monitoring, passport) and "Before you go" (approval actions)
// sections; the backend has no data behind either, so they are not rendered
// (no fiction). Any extra upcoming trips surface under "Also coming up".

export type TripCard = {
  from: string
  to: string
  city: string
  dates: string
  away: string
  state: string
}

export type TripRow = {
  name: string
  value: string
  tone: ChipTone
  icon: IconName
  note?: string
}

export type TravelData = {
  next: TripCard | null
  more: TripRow[]
}

type ServerTrip = {
  id: string
  trip_name?: string | null
  type?: string | null
  provider?: string | null
  confirmation_code?: string | null
  origin?: string | null
  destination?: string | null
  depart_time?: string | null
  arrive_time?: string | null
  return_time?: string | null
  status?: string | null
  price?: number | null
  currency?: string | null
  hotel_name?: string | null
  hotel_checkin?: string | null
  hotel_checkout?: string | null
}

let data: TravelData | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const snapshot = (): TravelData | null => data
export const useTravel = () => useSyncExternalStore(subscribe, snapshot)

const TONES: ChipTone[] = ['blue', 'lavender', 'mint', 'peach', 'sand']

// "Dubai (DXB)" → "DXB"; falls back to the first 3 letters.
const code = (place?: string | null): string => {
  const s = String(place || '')
  const m = /\(([^)]+)\)/.exec(s)
  if (m) return m[1].toUpperCase()
  return s.trim().slice(0, 3).toUpperCase() || '—'
}
// "Dubai (DXB)" → "Dubai".
const cityName = (place?: string | null): string => {
  const s = String(place || '')
  return s.replace(/\s*\([^)]*\)\s*/g, '').trim() || s.trim()
}

const timeMs = (iso?: string | null): number => new Date(String(iso || '')).getTime()

const shortDate = (iso?: string | null): string => {
  const t = timeMs(iso)
  if (Number.isNaN(t)) return ''
  return new Date(t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const daysUntil = (iso?: string | null): number => {
  const t = timeMs(iso)
  if (Number.isNaN(t)) return NaN
  const d = new Date(t)
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const awayLabel = (iso?: string | null): string => {
  const n = daysUntil(iso)
  if (Number.isNaN(n)) return 'Dates to confirm'
  if (n < 0) return 'In progress'
  if (n === 0) return 'Today'
  if (n === 1) return 'Tomorrow'
  return `In ${n} days`
}

const datesLabel = (dep?: string | null, ret?: string | null): string => {
  const d = shortDate(dep)
  const r = shortDate(ret)
  if (d && r) return `${d} – ${r}`
  return d || r || 'Dates to confirm'
}

const cap = (s?: string | null): string => {
  const x = String(s || '').replace(/_/g, ' ').trim()
  return x ? x[0].toUpperCase() + x.slice(1) : ''
}

const label = (provider?: string | null, code?: string | null, status?: string | null): string =>
  [cap(provider), code || ''].filter(Boolean).join(' ') || cap(status) || 'Booked'

/** Load the user's real trips. Best-effort — stays empty on error. */
export const hydrateTravel = async (): Promise<void> => {
  try {
    const res = await api.travel()
    const rows = (res.trips as ServerTrip[]) || []

    // Upcoming = trip whose return (or departure) is today or later. Trips with
    // no parseable dates are kept (better shown than dropped), sorted last.
    const todayMs = (() => {
      const d = new Date()
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })()

    const upcoming = rows
      .filter((r) => {
        const retMs = timeMs(r.return_time)
        const ref = Number.isNaN(retMs) ? timeMs(r.depart_time) : retMs
        if (Number.isNaN(ref)) return true
        return ref >= todayMs
      })
      .sort((a, b) => {
        const ta = timeMs(a.depart_time)
        const tb = timeMs(b.depart_time)
        if (Number.isNaN(ta)) return 1
        if (Number.isNaN(tb)) return -1
        return ta - tb
      })

    const first = upcoming[0]
    const next: TripCard | null = first
      ? {
          from: code(first.origin),
          to: code(first.destination),
          city: cityName(first.destination) || cityName(first.origin) || first.trip_name || 'Trip',
          dates: datesLabel(first.depart_time, first.return_time),
          away: awayLabel(first.depart_time),
          state: label(first.provider, first.confirmation_code, first.status),
        }
      : null

    const more: TripRow[] = upcoming.slice(1).map((r, i) => ({
      name: r.trip_name || `${cityName(r.origin)} → ${cityName(r.destination)}`,
      value: datesLabel(r.depart_time, r.return_time),
      tone: TONES[i % TONES.length],
      icon: 'plane' as IconName,
      note: label(r.provider, r.confirmation_code, r.status) || undefined,
    }))

    data = { next, more }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep empty — honest empty state */
  }
}
