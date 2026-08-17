import { useSyncExternalStore } from 'react'
import { profile as seed } from './mock'

export type Profile = typeof seed

const KEY = 'wingman.profile'

const read = (): Profile => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...seed, ...JSON.parse(raw) } : seed
  } catch {
    return seed
  }
}

let current: Profile = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const useProfile = () => useSyncExternalStore(subscribe, () => current)

export const getProfile = () => current

export const saveProfile = (patch: Partial<Profile>) => {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

export const firstName = (full: string) => full.trim().split(/\s+/)[0] || full
