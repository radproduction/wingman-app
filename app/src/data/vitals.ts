import { useSyncExternalStore } from 'react'
import { api } from './api'

// Live health readings from /api/health-data (the SAME source the WhatsApp
// briefing / health analyst reads). Surfaced on the dashboard "Health" tile.
// Null until loaded; `connected:false` means there's no data yet.
export type Vitals = {
  connected: boolean
  sleepHours: number | null
  hrv: number | null
  recovery: number | null
  restingHr: number | null
  steps: number | null
  summary: string | null
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

/** Load the user's real health readings. Best-effort — stays null on error. */
export const hydrateVitals = async (): Promise<void> => {
  try {
    const res = await api.health()
    const h = (res.health || {}) as Record<string, unknown>
    vitals = {
      connected: !!h.connected,
      sleepHours: num(h.sleep_hours),
      hrv: num(h.hrv),
      recovery: num(h.recovery),
      restingHr: num(h.resting_heart_rate),
      steps: num(h.steps),
      summary: typeof h.summary === 'string' ? h.summary : null,
    }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep null → tile shows the connect prompt */
  }
}
