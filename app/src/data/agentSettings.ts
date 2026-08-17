import { useSyncExternalStore } from 'react'
import { agent as agentSeed, privacy, agentActions } from './mock'

export type AgentSettings = {
  tone: string
  detail: string
  proactivity: string
  skills: string[]
  access: string[]
  language: LanguageCode
  autonomy: string
  actions: string[]
  quiet: { from: string; to: string }
}

export const LANGUAGES = [
  { code: 'en', native: 'English', name: 'English' },
  { code: 'ar', native: 'العربية', name: 'Arabic' },
  { code: 'ur', native: 'اردو', name: 'Urdu' },
  { code: 'hi', native: 'हिन्दी', name: 'Hindi' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

export const languageName = (code: LanguageCode) =>
  LANGUAGES.find((l) => l.code === code)?.name ?? LANGUAGES[0].name

const KEY = 'wingman.agent'

const DEFAULTS: AgentSettings = {
  tone: agentSeed.tone,
  detail: agentSeed.detail,
  proactivity: agentSeed.proactivity,
  skills: agentSeed.skills,
  access: privacy.access.filter((p) => p.on).map((p) => p.key),
  language: 'en',
  autonomy: 'Small things',
  actions: agentActions.filter((a) => a.on).map((a) => a.key),
  quiet: { from: '22:00', to: '07:00' },
}

const read = (): AgentSettings => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS
  } catch {
    return DEFAULTS
  }
}

let current: AgentSettings = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const useAgent = () => useSyncExternalStore(subscribe, () => current)

export const getAgent = () => current

export const setAgent = (patch: Partial<AgentSettings>) => {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

export const toggleSkill = (name: string) =>
  setAgent({
    skills: current.skills.includes(name) ? current.skills.filter((s) => s !== name) : [...current.skills, name],
  })

export const toggleAccess = (key: string) =>
  setAgent({
    access: current.access.includes(key) ? current.access.filter((k) => k !== key) : [...current.access, key],
  })


export const setAutonomy = (autonomy: string) => setAgent({ autonomy })

export const toggleAction = (key: string) =>
  setAgent({
    actions: current.actions.includes(key) ? current.actions.filter((k) => k !== key) : [...current.actions, key],
  })

export const setQuiet = (patch: Partial<AgentSettings['quiet']>) => setAgent({ quiet: { ...current.quiet, ...patch } })
