import { useSyncExternalStore } from 'react'
import { api } from './api'

// Real follow-ups (promises Wingman tracked from your mail) from /api/followups.
// Surfaced as active + overdue counts on the Business Center. Null until loaded.
export type FollowupStats = { active: number; overdue: number }

let stats: FollowupStats | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const snapshot = (): FollowupStats | null => stats
export const useFollowups = () => useSyncExternalStore(subscribe, snapshot)

type ServerFollowup = { status?: string; due_date?: string | null }

const todayKey = (): string => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

/** Load the user's real follow-ups. Best-effort — stays on the seed on error. */
export const hydrateFollowups = async (): Promise<void> => {
  try {
    const res = await api.followups()
    const list = (res.followups as ServerFollowup[]) || []
    const open = list.filter((f) => (f.status || 'open') === 'open')
    const today = todayKey()
    const overdue = open.filter((f) => f.due_date && String(f.due_date).slice(0, 10) < today)
    stats = { active: open.length, overdue: overdue.length }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep the seed */
  }
}
