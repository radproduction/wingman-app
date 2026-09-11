import { useSyncExternalStore } from 'react'
import type { Notice } from './mock'

const KEY = 'wingman.notices'

// Phase 1: there is no real notification feed yet, so we do NOT read the mock
// seed. The list is empty and the unread badge is 0 until a real source exists.
// Shape (today/earlier/unread/handledQuietly) is kept so consumers don't change.
export const notifications = {
  unread: 0,
  handledQuietly: 0,
  today: [] as Notice[],
  earlier: [] as Notice[],
}

const ALL = [...notifications.today, ...notifications.earlier]

const SEEDED = ALL.filter((n) => !n.unread).map((n) => n.id)

const read = (): string[] => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : SEEDED
  } catch {
    return SEEDED
  }
}

let current: string[] = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const write = (next: string[]) => {
  current = next
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

export const useRead = () => useSyncExternalStore(subscribe, () => current)

export const markRead = (id: string) => {
  if (current.includes(id)) return
  write([...current, id])
}

export const markAllRead = () => write(ALL.map((n) => n.id))

export const useUnreadCount = () => {
  const r = useRead()
  return notifications.today.filter((n) => !r.includes(n.id)).length
}
