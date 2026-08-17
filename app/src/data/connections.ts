import { useSyncExternalStore } from 'react'
import { connectors as seed, type Connector, type ConnectorStatus } from './mock'

type Overrides = Record<string, boolean>

const KEY = 'wingman.connections'

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

const statusOf = (o: Overrides, c: Connector): ConnectorStatus => {
  if (c.status === 'soon') return 'soon'
  const on = o[c.key] ?? c.status === 'connected'
  return on ? 'connected' : 'connect'
}

export const connect = (key: string) => write({ ...current, [key]: true })
export const disconnect = (key: string) => write({ ...current, [key]: false })

export type ConnectionView = {
  items: Connector[]
  connected: number
  linkable: number
}

const project = (o: Overrides): ConnectionView => {
  const items = seed.map((c) => ({ ...c, status: statusOf(o, c) }))
  return {
    items,
    connected: items.filter((c) => c.status === 'connected').length,
    linkable: items.filter((c) => c.status === 'connect').length,
  }
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

export const useConnections = () => useSyncExternalStore(subscribe, snapshot)
