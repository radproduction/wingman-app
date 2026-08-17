import { useSyncExternalStore } from 'react'
import type { IconName } from '../app/icons'
import type { ChipTone } from './mock'


export type WidgetSize = 'sm' | 'md' | 'lg'

export type WidgetType =
  | 'snapshot'
  | 'attention'
  | 'meetings'
  | 'tasks'
  | 'actions'
  | 'focus'
  | 'counts'
  | 'business'
  | 'wday'
  | 'news'
  | 'commute'
  | 'watching'

export type WidgetDef = {
  type: WidgetType
  name: string
  desc: string
  icon: IconName
  tone: ChipTone
  sizes: WidgetSize[]
  defaultSize: WidgetSize
}

export const WIDGETS: WidgetDef[] = [
  {
    type: 'snapshot',
    name: "Today's snapshot",
    desc: 'The count still on you, and the meter of what I have handled',
    icon: 'sun',
    tone: 'blue',
    sizes: ['sm', 'md'],
    defaultSize: 'md',
  },
  {
    type: 'attention',
    name: 'Needs attention',
    desc: 'Overdue, blocked, unassigned and waiting on you',
    icon: 'alert',
    tone: 'rose',
    sizes: ['sm', 'md', 'lg'],
    defaultSize: 'lg',
  },
  {
    type: 'meetings',
    name: 'Recent meetings',
    desc: 'Your last three, and what each one needs next',
    icon: 'users',
    tone: 'lavender',
    sizes: ['sm', 'md', 'lg'],
    defaultSize: 'lg',
  },
  {
    type: 'tasks',
    name: 'Recent tasks',
    desc: 'The three nearest, ticked off in place',
    icon: 'task',
    tone: 'mint',
    sizes: ['sm', 'md', 'lg'],
    defaultSize: 'lg',
  },
  {
    type: 'actions',
    name: 'Action items',
    desc: 'The latest commitments from your meetings',
    icon: 'checkCircle',
    tone: 'blue',
    sizes: ['sm', 'md', 'lg'],
    defaultSize: 'lg',
  },
  {
    type: 'focus',
    name: 'Focus',
    desc: 'The one thing to do first',
    icon: 'spark',
    tone: 'lavender',
    sizes: ['md', 'lg'],
    defaultSize: 'md',
  },
  {
    type: 'counts',
    name: 'At a glance',
    desc: 'Email, calendar and task counts, with the progress on each',
    icon: 'grid',
    tone: 'blue',
    sizes: ['sm', 'md'],
    defaultSize: 'md',
  },
  {
    type: 'business',
    name: 'Business',
    desc: 'Your store, and a meeting you can start now',
    icon: 'briefcase',
    tone: 'peach',
    sizes: ['sm', 'md'],
    defaultSize: 'md',
  },
  {
    type: 'wday',
    name: "Wingman's day",
    desc: 'What I understood and did today',
    icon: 'spark',
    tone: 'sand',
    sizes: ['md', 'lg'],
    defaultSize: 'lg',
  },
  {
    type: 'news',
    name: 'In the news',
    desc: 'The top of your morning brief',
    icon: 'news',
    tone: 'blue',
    sizes: ['md'],
    defaultSize: 'md',
  },
  {
    type: 'commute',
    name: 'Getting around',
    desc: 'Traffic and when to leave',
    icon: 'pin',
    tone: 'sand',
    sizes: ['md'],
    defaultSize: 'md',
  },
  {
    type: 'watching',
    name: 'Watching for you',
    desc: 'Bills, deliveries, travel, people and health',
    icon: 'grid',
    tone: 'peach',
    sizes: ['md', 'lg'],
    defaultSize: 'lg',
  },
]

export const widgetDef = (type: WidgetType) => WIDGETS.find((w) => w.type === type)

export type Widget = { id: string; type: WidgetType; size: WidgetSize }

const DEFAULT: { type: WidgetType; size: WidgetSize }[] = [
  { type: 'attention', size: 'lg' },
  { type: 'focus', size: 'md' },
  { type: 'meetings', size: 'lg' },
  { type: 'tasks', size: 'lg' },
  { type: 'actions', size: 'lg' },
  { type: 'watching', size: 'lg' },
]

const defaultItems = (): Widget[] => DEFAULT.map((d, i) => ({ id: `w-${d.type}-${i}`, ...d }))

type Persisted = {
  items: Widget[] | null
  next: number
}

const KEY = 'wingman.dashboard'

const fresh = (): Persisted => ({ items: null, next: 1 })

const read = (): Persisted => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return fresh()
    const parsed = { ...fresh(), ...JSON.parse(raw) } as Persisted
    if (parsed.items) parsed.items = parsed.items.filter((w) => !!widgetDef(w.type))
    return parsed
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

let view = state.items ?? defaultItems()
let seen = state
const snapshot = () => {
  if (seen !== state) {
    view = state.items ?? defaultItems()
    seen = state
  }
  return view
}

export const useDashboard = () => useSyncExternalStore(subscribe, snapshot)

export const dashboard = snapshot

export const isDefaultDashboard = () => state.items === null

export const useIsDefaultDashboard = () => {
  useDashboard()
  return isDefaultDashboard()
}

export const availableWidgets = (current: Widget[]) =>
  WIDGETS.filter((d) => !current.some((w) => w.type === d.type))

const writeItems = (items: Widget[], next = state.next) => persist({ items, next })

export const addWidget = (type: WidgetType, size?: WidgetSize) => {
  const def = widgetDef(type)
  if (!def) return
  const items = snapshot()
  if (items.some((w) => w.type === type)) return
  const n = state.next
  writeItems([...items, { id: `w-${type}-n${n}`, type, size: size ?? def.defaultSize }], n + 1)
}

export const removeWidget = (id: string) => writeItems(snapshot().filter((w) => w.id !== id))

export const resizeWidget = (id: string, size: WidgetSize) =>
  writeItems(snapshot().map((w) => (w.id === id ? { ...w, size } : w)))

export const moveWidget = (from: number, to: number) => {
  const items = snapshot()
  if (from === to || from < 0 || to < 0 || from >= items.length || to >= items.length) return
  const next = [...items]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  writeItems(next)
}

export const resetDashboard = () => persist(fresh())

export const nextSize = (type: WidgetType, size: WidgetSize): WidgetSize => {
  const sizes = widgetDef(type)?.sizes ?? ['md']
  const i = sizes.indexOf(size)
  return sizes[(i + 1) % sizes.length]
}

export const SIZE_LABEL: Record<WidgetSize, string> = { sm: 'Small', md: 'Medium', lg: 'Large' }
