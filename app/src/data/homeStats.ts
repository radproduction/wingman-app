import { useSyncExternalStore } from 'react'
import { api } from './api'

// The landing "counts" widget shows Email / Calendar / Tasks numbers. Tasks is
// already live (useTasks); this fills the Email and Calendar counts from the
// real /api/dashboard aggregate. Null until loaded, so the seed shows meanwhile.
export type HomeStats = { emailToReply: number; calToday: number }

let stats: HomeStats | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

// stats is set once and then stable, so getSnapshot is safe for useSyncExternalStore.
export const useHomeStats = () => useSyncExternalStore(subscribe, () => stats)

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** Load the real Email/Calendar counts. Best-effort — keeps the seed on error. */
export const hydrateHomeStats = async (): Promise<void> => {
  try {
    const d = (await api.dashboard()) as {
      email?: { need_reply?: number; total_unread?: number }
      calendar?: { count?: number }
    }
    stats = {
      emailToReply: num(d?.email?.need_reply ?? d?.email?.total_unread),
      calToday: num(d?.calendar?.count),
    }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep the seed */
  }
}
