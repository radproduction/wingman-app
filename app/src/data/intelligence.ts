import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'


export type ActivityState = 'auto' | 'approved' | 'recommended' | 'waiting' | 'insight' | 'not-done'

export const STATE_LABEL: Record<ActivityState, string> = {
  auto: 'Done automatically',
  approved: 'Done after approval',
  recommended: 'Recommended',
  waiting: 'Waiting for approval',
  insight: 'Insight',
  'not-done': 'Not performed',
}


export type WingmanActivity = { icon: IconName; tone: ChipTone; title: string; body: string }

// Phase 1: no real "what Wingman did today" feed exists yet, so this is empty.
// Shape is preserved (same keys/types) so consumers render an honest empty
// state instead of crashing or showing invented activity.
export const wingmanDay = {
  summary: '',
  counts: { actions: 0, recommendations: 0, decisions: 0 },
  activities: [] as WingmanActivity[],
}


export type IntelDecision = {
  id: string
  title: string
  body: string
  used: string[]
  permission: string
  at: string
  result: string
  undoable?: boolean
}

export type IntelAction = {
  id: string
  icon: IconName
  tone: ChipTone
  title: string
  body: string
  at: string
  trigger: string
  link?: { label: string; route: string }
  state: 'auto' | 'approved'
}

export type IntelRec = {
  id: string
  icon: IconName
  tone: ChipTone
  title: string
  reason: string
  suggestion: string
}

export type IntelInsight = {
  id: string
  icon: IconName
  tone: ChipTone
  title: string
  body: string
  action?: string
}

export type IntelSource = { name: string; note: string; icon: IconName; tone: ChipTone }

export type TimelineKind = 'decision' | 'completed' | 'recommendation' | 'approval' | 'insight'

export type TimelineItem = { at: string; text: string; kind: TimelineKind }

export const TIMELINE_FILTERS: { key: TimelineKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'decision', label: 'Decisions' },
  { key: 'completed', label: 'Completed' },
  { key: 'recommendation', label: 'Recommendations' },
  { key: 'approval', label: 'Approvals' },
  { key: 'insight', label: 'Insights' },
]

// Phase 1: the "what Wingman did today" timeline has no real data source yet,
// so every list is empty and the overview is zeroed. Shape (keys/types) is kept
// so DailyIntelligence renders honest empty states rather than invented activity.
export const dailyIntel = {
  overview: {
    text: '',
    date: '',
    updated: '',
    status: '',
    completed: 0,
    recommendations: 0,
    insights: 0,
  },
  decisions: [] as IntelDecision[],
  actions: [] as IntelAction[],
  recommendations: [] as IntelRec[],
  insights: [] as IntelInsight[],
  sources: [] as IntelSource[],
  notDone: [] as string[],
  timeline: [] as TimelineItem[],
}


export type SummaryLine = {
  icon: IconName
  tone: ChipTone
  title: string
  sub: string
  route?: string
  approval?: string
}

// Phase 1: the daily snapshot has no real data source yet, so intro text is
// empty and every group is empty. Shape (keys/types) is preserved so
// DailySummary renders an honest empty state instead of a scripted "morning".
export const dailySummary = {
  intro: '',
  updated: '',
  actNow: [] as SummaryLine[],
  prepare: [] as SummaryLine[],
  beAware: [] as SummaryLine[],
  handled: [] as SummaryLine[],
  evening: {
    intro: '',
    lines: [] as SummaryLine[],
  },
  sources: [] as string[],
}


type Persisted = {
  recs: Record<string, 'accepted' | 'dismissed'>
  undone: Record<string, true>
  reviewed: Record<'morning' | 'evening', boolean>
}

const KEY = 'wingman.intelligence'

const fresh = (): Persisted => ({ recs: {}, undone: {}, reviewed: { morning: false, evening: false } })

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

export const useIntel = () => useSyncExternalStore(subscribe, () => state)

export const recDecision = (id: string) => state.recs[id]
export const decideRec = (id: string, d: 'accepted' | 'dismissed') =>
  persist({ ...state, recs: { ...state.recs, [id]: d } })
export const resetRec = (id: string) => {
  const { [id]: _gone, ...rest } = state.recs
  persist({ ...state, recs: rest })
}

export const isUndone = (id: string) => !!state.undone[id]
export const undoDecision = (id: string) => persist({ ...state, undone: { ...state.undone, [id]: true } })
export const redoDecision = (id: string) => {
  const { [id]: _gone, ...rest } = state.undone
  persist({ ...state, undone: rest })
}

export const markReviewed = (which: 'morning' | 'evening') =>
  persist({ ...state, reviewed: { ...state.reviewed, [which]: true } })

export { NOW }
