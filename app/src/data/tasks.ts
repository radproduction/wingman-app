import { useSyncExternalStore } from 'react'
import { tasks as seed, type TaskItem } from './mock'

type Overrides = Record<string, boolean>

const KEY = 'wingman.tasks'

const read = (): Overrides => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

let current: Overrides = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const write = (next: Overrides) => {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

const ALL: { item: TaskItem; group: string }[] = [
  ...seed.groups.flatMap((g) => g.items.map((item) => ({ item, group: g.title }))),
  ...seed.done.map((item) => ({ item, group: 'Done' })),
]

const isDone = (o: Overrides, title: string, group: string) => o[title] ?? group === 'Done'

export const toggleTask = (title: string) => {
  const entry = ALL.find((e) => e.item.title === title)
  if (!entry) return
  write({ ...current, [title]: !isDone(current, title, entry.group) })
}

export type TaskView = {
  groups: { title: string; items: TaskItem[] }[]
  done: TaskItem[]
  openCount: number
  progress: number
}

const project = (o: Overrides): TaskView => {
  const fallback = seed.groups[0]?.title ?? 'Today'
  const open = new Map<string, TaskItem[]>(seed.groups.map((g) => [g.title, []]))
  for (const { item, group } of ALL) {
    if (isDone(o, item.title, group)) continue
    open.get(open.has(group) ? group : fallback)!.push(item)
  }
  const groups = seed.groups.map((g) => ({ title: g.title, items: open.get(g.title)! }))
  const done = [
    ...seed.done.filter((t) => isDone(o, t.title, 'Done')),
    ...seed.groups.flatMap((g) => g.items.filter((t) => isDone(o, t.title, g.title))),
  ]
  const openCount = groups.reduce((n, g) => n + g.items.length, 0)
  const total = openCount + done.length
  return { groups, done, openCount, progress: total ? done.length / total : 0 }
}

let view = project(current)
let seen = current
const snapshot = () => {
  if (seen !== current) {
    view = project(current)
    seen = current
  }
  return view
}

export const useTasks = () => useSyncExternalStore(subscribe, snapshot)

export const taskView = snapshot
