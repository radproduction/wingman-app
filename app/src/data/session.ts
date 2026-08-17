import { useSyncExternalStore } from 'react'

export type Session = { onboarded: boolean; signedIn: boolean }

const KEY = 'wingman.session'

const FRESH: Session = { onboarded: false, signedIn: false }

const read = (): Session => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...FRESH, ...JSON.parse(raw) } : FRESH
  } catch {
    return FRESH
  }
}

let current: Session = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const write = (patch: Partial<Session>) => {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

export const useSession = () => useSyncExternalStore(subscribe, () => current)

export const getSession = () => current

export const completeOnboarding = () => write({ onboarded: true, signedIn: true })

export const signIn = () => write({ signedIn: true })

export const signOut = () => write({ signedIn: false })

export const startFresh = () => write({ onboarded: false, signedIn: false })
