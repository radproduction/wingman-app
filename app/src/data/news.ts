import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'



export type Topic = {
  key: string
  name: string
  blurb: string
  icon: IconName
  tone: ChipTone
  followed: boolean
}

const SEED_TOPICS: Topic[] = [
  { key: 'business', name: 'Business', blurb: 'Deals, earnings and the companies you watch', icon: 'box', tone: 'peach', followed: true },
  { key: 'markets', name: 'Markets', blurb: 'Currencies, rates and what moves your costs', icon: 'card', tone: 'mint', followed: true },
  { key: 'tech', name: 'Technology', blurb: 'Product launches, AI and the tools you use', icon: 'grid', tone: 'lavender', followed: true },
  { key: 'world', name: 'World', blurb: 'The headlines worth a minute of your morning', icon: 'globe', tone: 'blue', followed: true },
  { key: 'local', name: 'Karachi', blurb: 'Your city: weather, roads and what is open', icon: 'pin', tone: 'sand', followed: true },
  { key: 'health', name: 'Health & living', blurb: 'Wellbeing, science and the odd good habit', icon: 'heart', tone: 'rose', followed: false },
  { key: 'sport', name: 'Sport', blurb: 'Scores and fixtures for the teams you name', icon: 'activity', tone: 'peach', followed: false },
]

export const topicByKey = (key: string): Topic | undefined => SEED_TOPICS.find((t) => t.key === key)


export type Story = {
  id: string
  topic: string
  headline: string
  source: string
  time: string
  summary: string
  why: string
  points: string[]
  forYou?: string
}

// Phase 1 (no backend yet): no fabricated stories. A real user sees an honest
// empty state until a real brief exists. Shape and exports are unchanged.
export const stories: Story[] = []

export const storyById = (id: string): Story | undefined => stories.find((s) => s.id === id)


export type Depth = 'Headlines' | 'Briefed' | 'Deep'

export const DEPTHS: { value: Depth; blurb: string }[] = [
  { value: 'Headlines', blurb: 'Just the lines, five or six of them' },
  { value: 'Briefed', blurb: 'A headline and my read on each' },
  { value: 'Deep', blurb: 'The brief, plus the facts under it' },
]

export const DELIVERY_TIMES = ['06:30', '07:00', '07:30', '08:00', '08:30']

export type NewsPrefs = {
  deliver: string
  depth: Depth
  breaking: boolean
  count: number
}

const SEED_PREFS: NewsPrefs = {
  deliver: '07:00',
  depth: 'Briefed',
  breaking: true,
  count: 6,
}


type Persisted = {
  follow: Record<string, boolean>
  added: Record<string, Topic>
  saved: Record<string, true>
  read: Record<string, true>
  prefs: Partial<NewsPrefs>
}

const KEY = 'wingman.news'

const fresh = (): Persisted => ({ follow: {}, added: {}, saved: {}, read: {}, prefs: {} })

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


const projectTopics = (s: Persisted): Topic[] => {
  const bases = SEED_TOPICS.map((t) => ({ ...t, followed: s.follow[t.key] ?? t.followed }))
  const extras = Object.values(s.added).map((t) => ({ ...t, followed: s.follow[t.key] ?? t.followed }))
  return [...bases, ...extras]
}

let topicsView = projectTopics(state)
let seen = state
const topicsSnapshot = () => {
  if (seen !== state) {
    topicsView = projectTopics(state)
    seen = state
  }
  return topicsView
}

export const useTopics = () => useSyncExternalStore(subscribe, topicsSnapshot)
export const useFollowedTopics = () => topicsSnapshot().filter((t) => t.followed)

export const toggleTopic = (key: string) => {
  const cur = topicsSnapshot().find((t) => t.key === key)
  persist({ ...state, follow: { ...state.follow, [key]: !(cur?.followed ?? false) } })
}
export const addTopic = (name: string) => {
  const key = `x-${name.toLowerCase().replace(/\s+/g, '-')}`
  const topic: Topic = { key, name, blurb: 'A topic you added', icon: 'spark', tone: 'lavender', followed: true }
  persist({ ...state, added: { ...state.added, [key]: topic }, follow: { ...state.follow, [key]: true } })
}


export const useSaved = () => {
  useSyncExternalStore(subscribe, () => state)
  return state.saved
}
export const isSaved = (id: string) => !!state.saved[id]
export const toggleSaved = (id: string) => {
  const next = { ...state.saved }
  if (next[id]) delete next[id]
  else next[id] = true
  persist({ ...state, saved: next })
}
export const isRead = (id: string) => !!state.read[id]
export const markRead = (id: string) => {
  if (state.read[id]) return
  persist({ ...state, read: { ...state.read, [id]: true } })
}

export const useBrief = (): Story[] => {
  const followed = new Set(useFollowedTopics().map((t) => t.key))
  const prefs = useNewsPrefs()
  const eligible = stories.filter((s) => followed.has(s.topic) || s.forYou)
  const forYou = eligible.filter((s) => s.forYou)
  const rest = eligible.filter((s) => !s.forYou)
  return [...forYou, ...rest].slice(0, Math.max(prefs.count, forYou.length))
}

export const useForYouCount = () => useBrief().filter((s) => s.forYou).length


export const useNewsPrefs = (): NewsPrefs => {
  useSyncExternalStore(subscribe, () => state)
  return { ...SEED_PREFS, ...state.prefs }
}
export const setNewsPref = <K extends keyof NewsPrefs>(k: K, v: NewsPrefs[K]) =>
  persist({ ...state, prefs: { ...state.prefs, [k]: v } })

export { NOW }
