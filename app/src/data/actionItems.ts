import { useSyncExternalStore } from 'react'


export type ActionPriority = 'High' | 'Medium' | 'Low'
export type ActionStatus = 'open' | 'blocked' | 'done'

export const NO_DUE = 999

export type ActionItem = {
  id: string
  title: string
  owner: string
  due: string
  dueIn: number
  priority: ActionPriority
  status: ActionStatus
  blockedBy?: string
  meetingId?: string
  meeting?: string
  project?: string
  note?: string
  seq: number
}

export const DUE_PRESETS: { label: string; dueIn: number }[] = [
  { label: 'Today', dueIn: 0 },
  { label: 'Tomorrow', dueIn: 1 },
  { label: 'This week', dueIn: 3 },
  { label: 'Next week', dueIn: 7 },
  { label: 'No date', dueIn: NO_DUE },
]

export const PRIORITIES: ActionPriority[] = ['High', 'Medium', 'Low']

export const ASSIGNEES = ['You', 'Wingman', 'Sarah Nadeem', 'Rai Aslam', 'Omar Farooq', 'Hina Qureshi', 'Bilal Ahmed']


const SEED: ActionItem[] = [
  {
    id: 'ai-1',
    title: 'Send Sarah the updated pricing document',
    owner: 'You',
    due: 'Tomorrow',
    dueIn: 1,
    priority: 'High',
    status: 'open',
    meetingId: 'product-strategy',
    meeting: 'Product Strategy Meeting',
    project: 'Pricing v2',
    seq: 9,
  },
  {
    id: 'ai-2',
    title: 'Brief Rai to start the billing work',
    owner: 'Rai Aslam',
    due: 'Today',
    dueIn: 0,
    priority: 'High',
    status: 'open',
    meetingId: 'product-strategy',
    meeting: 'Product Strategy Meeting',
    project: 'Pricing v2',
    seq: 8,
  },
  {
    id: 'ai-3',
    title: 'Confirm the launch timeline with Sarah',
    owner: '',
    due: 'Thu',
    dueIn: 3,
    priority: 'Medium',
    status: 'open',
    meetingId: 'product-strategy',
    meeting: 'Product Strategy Meeting',
    project: 'Pricing v2',
    seq: 7,
  },
  {
    id: 'ai-4',
    title: 'Send the icon licensing terms to Omar',
    owner: 'You',
    due: '2 days ago',
    dueIn: -2,
    priority: 'High',
    status: 'open',
    meetingId: 'design-sync',
    meeting: 'Design Partner Sync',
    project: 'Q3 Launch',
    note: 'Omar cannot brief his team until this lands.',
    seq: 6,
  },
  {
    id: 'ai-5',
    title: 'Confirm the 4 Aug handoff in the shared tracker',
    owner: 'You',
    due: 'Today',
    dueIn: 0,
    priority: 'Medium',
    status: 'open',
    meetingId: 'design-sync',
    meeting: 'Design Partner Sync',
    project: 'Q3 Launch',
    seq: 5,
  },
  {
    id: 'ai-6',
    title: 'Book the weekly sync series through August',
    owner: 'Wingman',
    due: 'Today',
    dueIn: 0,
    priority: 'Medium',
    status: 'blocked',
    blockedBy: 'Waiting on your approval to send the invites',
    meetingId: 'design-sync',
    meeting: 'Design Partner Sync',
    seq: 4,
  },
  {
    id: 'ai-7',
    title: 'Share the supplier terms comparison',
    owner: '',
    due: 'No date',
    dueIn: NO_DUE,
    priority: 'Low',
    status: 'open',
    meetingId: 'northwind-notes',
    meeting: 'Supplier Terms Call',
    seq: 3,
  },
  {
    id: 'ai-8',
    title: 'Circulate the Q3 board deck outline',
    owner: 'You',
    due: 'Next week',
    dueIn: 7,
    priority: 'Low',
    status: 'done',
    meetingId: 'investor-update',
    meeting: 'Investor Update',
    seq: 2,
  },
]


type Persisted = {
  created: ActionItem[]
  patch: Record<string, Partial<ActionItem>>
  removed: Record<string, true>
  next: number
}

const KEY = 'wingman.action-items'

const fresh = (): Persisted => ({ created: [], patch: {}, removed: {}, next: 1 })

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

const project = (s: Persisted): ActionItem[] =>
  [...SEED.filter((a) => !s.removed[a.id]).map((a) => ({ ...a, ...s.patch[a.id] })), ...s.created].sort(
    (a, b) => b.seq - a.seq,
  )

let view = project(state)
let seen = state
const snapshot = () => {
  if (seen !== state) {
    view = project(state)
    seen = state
  }
  return view
}

export const useActionItems = () => useSyncExternalStore(subscribe, snapshot)

export const actionItems = snapshot

export const actionItemById = (id: string) => snapshot().find((a) => a.id === id)

export const dueLabel = (dueIn: number) => DUE_PRESETS.find((p) => p.dueIn === dueIn)?.label ?? 'Today'

export type NewAction = {
  title: string
  owner?: string
  dueIn?: number
  priority?: ActionPriority
  note?: string
  meetingId?: string
  meeting?: string
  project?: string
}

export const addActionItem = (a: NewAction): string => {
  const n = state.next
  const dueIn = a.dueIn ?? NO_DUE
  const item: ActionItem = {
    id: `ai-new-${n}`,
    title: a.title.trim(),
    owner: a.owner ?? '',
    due: dueLabel(dueIn),
    dueIn,
    priority: a.priority ?? 'Medium',
    status: 'open',
    note: a.note?.trim() || undefined,
    meetingId: a.meetingId,
    meeting: a.meeting,
    project: a.project,
    seq: 100 + n,
  }
  persist({ ...state, created: [...state.created, item], next: n + 1 })
  return item.id
}

export const updateActionItem = (id: string, patch: Partial<ActionItem>) => {
  const full = patch.dueIn === undefined ? patch : { ...patch, due: dueLabel(patch.dueIn) }
  const made = state.created.find((a) => a.id === id)
  if (made) {
    persist({ ...state, created: state.created.map((a) => (a.id === id ? { ...a, ...full } : a)) })
    return
  }
  persist({ ...state, patch: { ...state.patch, [id]: { ...state.patch[id], ...full } } })
}

export const toggleActionItem = (id: string) => {
  const item = actionItemById(id)
  if (!item) return
  updateActionItem(id, { status: item.status === 'done' ? (item.blockedBy ? 'blocked' : 'open') : 'done' })
}

export const removeActionItem = (id: string) => {
  if (state.created.some((a) => a.id === id)) {
    persist({ ...state, created: state.created.filter((a) => a.id !== id) })
    return
  }
  persist({ ...state, removed: { ...state.removed, [id]: true } })
}


export const isOverdue = (a: ActionItem) => a.status !== 'done' && a.dueIn < 0
export const isUnassigned = (a: ActionItem) => a.status !== 'done' && a.owner === ''
export const isBlocked = (a: ActionItem) => a.status === 'blocked'
export const isUrgent = (a: ActionItem) => a.status !== 'done' && a.priority === 'High' && a.dueIn <= 0

export const openActionItems = (list: ActionItem[] = snapshot()) => list.filter((a) => a.status !== 'done')

export const actionItemsOfMeeting = (meetingId: string, list: ActionItem[] = snapshot()) =>
  list.filter((a) => a.meetingId === meetingId).sort((a, b) => a.seq - b.seq)
