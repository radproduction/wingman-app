import { useSyncExternalStore } from 'react'
import { api } from './api'

// Live health readings from /api/health-data (the SAME source the WhatsApp
// briefing / health analyst reads). Powers the dashboard "Health" tile AND the
// Health detail screen. Null until loaded; `connected:false` means no data yet.
export type MetricRead = { value: number | null; baseline: number | null; series: number[] }

export type Vitals = {
  connected: boolean
  sleepHours: number | null
  hrv: number | null
  recovery: number | null
  restingHr: number | null
  steps: number | null
  summary: string | null
  reads: {
    sleep: MetricRead
    hrv: MetricRead
    recovery: MetricRead
    restingHr: MetricRead
    steps: MetricRead
  }
  week: { day: string; hours: number }[]
}

let vitals: Vitals | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const snapshot = (): Vitals | null => vitals
export const useVitals = () => useSyncExternalStore(subscribe, snapshot)

const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null)

/** Format sleep hours (7.17 → "7h 10m"). */
export const fmtSleep = (h: number): string => {
  const hrs = Math.floor(h)
  const mins = Math.round((h - hrs) * 60)
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`
}

const readOf = (obj: unknown): MetricRead => {
  const r = (obj || {}) as Record<string, unknown>
  return {
    value: num(r.value),
    baseline: num(r.baseline),
    series: Array.isArray(r.series) ? (r.series as unknown[]).map((x) => Number(x)).filter((x) => Number.isFinite(x)) : [],
  }
}

const DAY_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const dayLetter = (iso: string): string => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '·' : DAY_LETTERS[d.getDay()]
}

/** Load the user's real health readings. Best-effort — stays null on error. */
export const hydrateVitals = async (): Promise<void> => {
  try {
    const res = await api.health()
    const h = (res.health || {}) as Record<string, unknown>
    const reads = (h.reads || {}) as Record<string, unknown>
    const week = Array.isArray(h.week) ? (h.week as { at?: string; hours?: number }[]) : []
    vitals = {
      connected: !!h.connected,
      sleepHours: num(h.sleep_hours),
      hrv: num(h.hrv),
      recovery: num(h.recovery),
      restingHr: num(h.resting_heart_rate),
      steps: num(h.steps),
      summary: typeof h.summary === 'string' ? h.summary : null,
      reads: {
        sleep: readOf(reads.sleep_hours),
        hrv: readOf(reads.hrv),
        recovery: readOf(reads.recovery),
        restingHr: readOf(reads.resting_heart_rate),
        steps: readOf(reads.steps),
      },
      week: week
        .filter((d) => typeof d.hours === 'number')
        .map((d) => ({ day: dayLetter(String(d.at || '')), hours: Number(d.hours) })),
    }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep null → tile shows the connect prompt */
  }
}
