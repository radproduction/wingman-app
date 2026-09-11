import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'

export type ApprovalState = 'pending' | 'approved' | 'edited' | 'executed' | 'dismissed' | 'failed'

export type ApprovalSource = 'email' | 'calendar' | 'bills' | 'travel' | 'people' | 'commerce'

export type Approval = {
  id: string
  source: ApprovalSource
  tone: ChipTone
  icon: IconName
  cta: string
  title: string
  why: string
  facts: { label: string; value: string }[]
  edit?: {
    label: string
    value: string
    long?: boolean
    hint?: string
  }
  approveLabel: string
  executed: string
  worth?: string
  fails?: string
  raised: string
  seed?: Decision
}

export type Decision = {
  state: ApprovalState
  at: string
  note?: string
  value?: string
}


// Phase 1 (no backend yet): no fabricated approvals. A real user sees an honest
// empty state until real decisions are raised. Shape and exports are unchanged.
export const approvals: Approval[] = []

export const approvalById = (id: string) => approvals.find((a) => a.id === id)


const KEY = 'wingman.approvals'

const seeded = (): Record<string, Decision> =>
  Object.fromEntries(approvals.filter((a) => a.seed).map((a) => [a.id, a.seed!]))

const read = (): Record<string, Decision> => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...seeded(), ...JSON.parse(raw) } : seeded()
  } catch {
    return seeded()
  }
}

let decisions = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const write = (next: Record<string, Decision>) => {
  decisions = next
  try {
    localStorage.setItem(KEY, JSON.stringify(decisions))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

export const useDecisions = () => useSyncExternalStore(subscribe, () => decisions)

export const decisionOf = (id: string): Decision =>
  decisions[id] ?? { state: 'pending', at: '' }

export const useDecision = (id: string) => useDecisions()[id] ?? { state: 'pending' as const, at: '' }

const set = (id: string, d: Decision) => write({ ...decisions, [id]: d })

export const approve = (id: string, value?: string) => {
  const a = approvalById(id)
  if (!a) return
  const changed = value !== undefined && value.trim() !== a.edit?.value
  set(id, { state: changed ? 'edited' : 'approved', at: NOW, value: changed ? value : undefined })
  window.setTimeout(() => {
    const held = decisionOf(id)
    if (held.state !== 'approved' && held.state !== 'edited') return
    set(id, { ...held, state: a.fails ? 'failed' : 'executed' })
  }, 1400)
}

export const dismiss = (id: string, reason: string) => set(id, { state: 'dismissed', at: NOW, note: reason })

export const reopen = (id: string) => {
  const { [id]: _gone, ...rest } = decisions
  write(rest)
}

export const DISMISS_REASONS = ['Not now', "I'll do this myself", "You've read this wrong"]


export const isSettled = (s: ApprovalState) => s === 'executed' || s === 'dismissed' || s === 'failed'
export const isWorking = (s: ApprovalState) => s === 'approved' || s === 'edited'

export const useWaiting = () => {
  const d = useDecisions()
  return approvals.filter((a) => (d[a.id]?.state ?? 'pending') === 'pending')
}
