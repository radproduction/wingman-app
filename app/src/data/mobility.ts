import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'
import { api } from './api'


export type TravelMode = 'drive' | 'walk' | 'transit' | 'twowheeler'

export const MODE_LABEL: Record<TravelMode, string> = {
  drive: 'Driving',
  walk: 'Walking',
  transit: 'Public transport',
  twowheeler: 'Two-wheeler',
}

export const TRAVEL_MODES: TravelMode[] = ['drive', 'walk', 'transit', 'twowheeler']

export type TrafficLevel = 'light' | 'moderate' | 'heavy'

export const LEVEL_LABEL: Record<TrafficLevel, string> = {
  light: 'Light traffic',
  moderate: 'Moderate traffic',
  heavy: 'Heavy traffic',
}

export type TrafficLoad = 'flow' | 'slow' | 'heavy' | 'severe' | 'jam'

export type TrafficSpan = { w: number; load: TrafficLoad }


export type RouteSeg = { name: string; mins: string; level: TrafficLevel }
export type RouteAlt = { name: string; duration: string; note: string }

export type Route = {
  key: string
  origin: string
  dest: string
  mode: TravelMode
  distance: string
  duration: string
  normal: string
  level: TrafficLevel
  eta: string
  leaveBy: string
  delay: string
  segments: RouteSeg[]
  traffic: TrafficSpan[]
  alts: RouteAlt[]
  forEvent?: string
  originReason?: string
  late?: boolean
}

export const routes: Record<string, Route> = {
  office: {
    key: 'office',
    origin: 'Home',
    dest: 'Office',
    mode: 'drive',
    distance: '14 km',
    duration: '35 min',
    normal: '28 min',
    level: 'moderate',
    eta: '8:55 AM',
    leaveBy: '8:20 AM',
    delay: '7 min slower than usual',
    originReason: 'Home, because it is before your work hours',
    segments: [
      { name: 'DHA to Korangi Rd', mins: '9 min', level: 'light' },
      { name: 'Korangi Road', mins: '16 min', level: 'heavy' },
      { name: 'Shahra-e-Faisal', mins: '10 min', level: 'moderate' },
    ],
    traffic: [
      { w: 3, load: 'flow' },
      { w: 2.5, load: 'slow' },
      { w: 2, load: 'heavy' },
      { w: 2.5, load: 'severe' },
      { w: 1.5, load: 'jam' },
      { w: 1.5, load: 'severe' },
      { w: 2, load: 'flow' },
      { w: 2.5, load: 'flow' },
    ],
    alts: [
      { name: 'Via Qayyumabad', duration: '38 min', note: '3 min longer, avoids the bridge' },
      { name: 'Via University Rd', duration: '41 min', note: 'Longer but steady, no heavy stretch' },
    ],
  },
  clifton: {
    key: 'clifton',
    origin: 'Office',
    dest: 'Clifton',
    mode: 'drive',
    distance: '9 km',
    duration: '35 min',
    normal: '25 min',
    level: 'heavy',
    eta: '2:50 PM',
    leaveBy: '2:05 PM',
    delay: '10 min slower than usual',
    forEvent: 'Your 3:00 PM in Clifton',
    originReason: 'Office, because it is during your work hours',
    late: false,
    segments: [
      { name: 'Shahra-e-Faisal', mins: '12 min', level: 'moderate' },
      { name: 'Shaheed-e-Millat', mins: '15 min', level: 'heavy' },
      { name: 'Clifton Bridge', mins: '8 min', level: 'moderate' },
    ],
    traffic: [
      { w: 2, load: 'slow' },
      { w: 2.5, load: 'heavy' },
      { w: 2.5, load: 'severe' },
      { w: 2, load: 'jam' },
      { w: 2, load: 'severe' },
      { w: 2, load: 'heavy' },
      { w: 2, load: 'slow' },
      { w: 2, load: 'heavy' },
    ],
    alts: [
      { name: 'Via II Chundrigar', duration: '39 min', note: '4 min longer, misses the bridge jam' },
    ],
  },
}

export const routeByKey = (key?: string): Route => routes[key ?? 'office'] ?? routes.office


const MODE_FACTOR: Record<TravelMode, number> = {
  drive: 1,
  twowheeler: 0.82,
  transit: 1.55,
  walk: 3.2,
}

const minsOf = (label: string) => parseInt(label, 10) || 0

export const clockToMin = (s: string): number | null => {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)/i.exec(s)
  if (!m) return null
  return ((parseInt(m[1], 10) % 12) + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + parseInt(m[2], 10)
}

export const minToClock = (total: number): string => {
  const m = ((Math.round(total) % 1440) + 1440) % 1440
  const h24 = Math.floor(m / 60)
  return `${h24 % 12 || 12}:${String(m % 60).padStart(2, '0')} ${h24 < 12 ? 'AM' : 'PM'}`
}

const delayLabel = (duration: number, normal: number): string => {
  const d = duration - normal
  if (d >= 1) return `${d} min slower than usual`
  if (d <= -1) return `${-d} min faster than usual`
  return 'About usual'
}

export const routeForMode = (base: Route, mode: TravelMode): Route => {
  if (mode === base.mode) return base
  const scale = MODE_FACTOR[mode] / MODE_FACTOR[base.mode]
  const baseDur = minsOf(base.duration)
  const duration = Math.round(baseDur * scale)
  const normal = Math.round(minsOf(base.normal) * scale)
  const leaveMin = clockToMin(base.leaveBy)
  return {
    ...base,
    mode,
    duration: `${duration} min`,
    normal: `${normal} min`,
    leaveBy: leaveMin == null ? base.leaveBy : minToClock(leaveMin - (duration - baseDur)),
    delay: delayLabel(duration, normal),
    segments: base.segments.map((s) => ({ ...s, mins: `${Math.round(minsOf(s.mins) * scale)} min` })),
    alts: base.alts.map((a) => ({ ...a, duration: `${Math.round(minsOf(a.duration) * scale)} min` })),
  }
}


export type Place = {
  key: string
  name: string
  address: string
  mode: TravelMode
  departure: string
  notify: boolean
  icon: IconName
  tone: ChipTone
  builtin?: boolean
}

// Home/office addresses come from the backend (the SAME place the WhatsApp AI
// routes from) via hydratePlaces — never hardcode a fake address here, or the
// app would show one office while the AI uses another.
const SEED_PLACES: Place[] = [
  { key: 'home', name: 'Home', address: '', mode: 'drive', departure: '8:20 AM', notify: true, icon: 'home', tone: 'blue', builtin: true },
  { key: 'office', name: 'Office', address: '', mode: 'drive', departure: '6:00 PM', notify: true, icon: 'office', tone: 'lavender', builtin: true },
]


export type CommutePrefs = {
  workdays: string[]
  arrival: string
  departure: string
  mode: TravelMode
  avoidTolls: boolean
  avoidHighways: boolean
  lead: string
  buffer: string
}

export const WORKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
export const LEAD_TIMES = ['10 minutes', '15 minutes', '30 minutes', '60 minutes']
export const BUFFERS = ['5 minutes', '10 minutes', '15 minutes', '20 minutes']

const SEED_PREFS: CommutePrefs = {
  workdays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  arrival: '9:00 AM',
  departure: '6:00 PM',
  mode: 'drive',
  avoidTolls: false,
  avoidHighways: false,
  lead: '15 minutes',
  buffer: '10 minutes',
}


type Persisted = {
  places: Record<string, Place>
  removed: Record<string, true>
  prefs: Partial<CommutePrefs>
}

const KEY = 'wingman.mobility'

const fresh = (): Persisted => ({ places: {}, removed: {}, prefs: {} })

const read = (): Persisted => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...fresh(), ...JSON.parse(raw) } : fresh()
  } catch {
    return fresh()
  }
}

let state = read()
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const persist = (next: Persisted) => {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

const project = (s: Persisted): Place[] => {
  const bases = SEED_PLACES.map((p) => ({ ...p, ...s.places[p.key] }))
  const extras = Object.values(s.places).filter((p) => !SEED_PLACES.some((b) => b.key === p.key))
  return [...bases, ...extras].filter((p) => !s.removed[p.key])
}

let placesView = project(state)
let seen = state
const placesSnapshot = () => {
  if (seen !== state) {
    placesView = project(state)
    seen = state
  }
  return placesView
}

export const usePlaces = () => useSyncExternalStore(subscribe, placesSnapshot)
export const placeByKey = (key: string) => placesSnapshot().find((p) => p.key === key)

export const savePlace = (p: Place) => {
  persist({ ...state, places: { ...state.places, [p.key]: p } })
  // Home/office are what the WhatsApp AI routes from — persist them to the
  // backend (the single source of truth), not just localStorage.
  if ((p.key === 'home' || p.key === 'office') && p.address.trim()) {
    void api.savePlace(p.key, p.address.trim()).catch(() => {})
  }
}
export const removePlace = (key: string) => persist({ ...state, removed: { ...state.removed, [key]: true } })

/**
 * Pull the real home/office addresses from the backend (/me) into the store, so
 * the app shows exactly what the WhatsApp AI uses for routing. Best-effort.
 */
export const hydratePlaces = async (): Promise<void> => {
  try {
    const me = (await api.me()) as { home_address?: string | null; office_address?: string | null }
    const base = (key: string): Place | undefined => state.places[key] || SEED_PLACES.find((p) => p.key === key)
    const places: Record<string, Place> = {}
    if (me.home_address) {
      const b = base('home')
      if (b) places.home = { ...b, address: String(me.home_address) }
    }
    if (me.office_address) {
      const b = base('office')
      if (b) places.office = { ...b, address: String(me.office_address) }
    }
    if (Object.keys(places).length) persist({ ...state, places: { ...state.places, ...places } })
  } catch {
    /* keep what we have */
  }
}

export const useCommutePrefs = (): CommutePrefs => {
  useSyncExternalStore(subscribe, () => state)
  return { ...SEED_PREFS, ...state.prefs }
}
export const setPref = <K extends keyof CommutePrefs>(k: K, v: CommutePrefs[K]) =>
  persist({ ...state, prefs: { ...state.prefs, [k]: v } })
export const toggleWorkday = (day: string) => {
  const cur = { ...SEED_PREFS, ...state.prefs }.workdays
  const next = cur.includes(day) ? cur.filter((d) => d !== day) : [...cur, day]
  persist({ ...state, prefs: { ...state.prefs, workdays: next } })
}

export { NOW }
