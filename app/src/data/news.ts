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

export const stories: Story[] = [
  {
    id: 'fx-aed',
    topic: 'markets',
    headline: 'Rupee steadies against the dirham after a week of slips',
    source: 'Business Recorder',
    time: 'Today, 6:40 AM',
    summary:
      'The rupee held near 78 to the dirham this morning after three sessions of small losses, as the central bank signalled it is comfortable at current levels.',
    why: "You price a Dubai trip and pay two AED suppliers, so this is the number under your costs. It is steady for now, which is why I'm noting it, not flagging it.",
    points: [
      'PKR/AED near 78, roughly flat on the week',
      'State Bank comment read as a floor by traders',
      'Your DXB fare watch is unaffected at this level',
    ],
    forYou: 'Touches your Dubai trip and your AED suppliers',
  },
  {
    id: 'shopify-fees',
    topic: 'business',
    headline: 'Shopify trims payment fees for stores in the Gulf',
    source: 'TechCrunch',
    time: 'Today, 5:15 AM',
    summary:
      'Shopify announced a lower processing rate for merchants billing in AED and SAR, effective next month, alongside faster payout timing for the region.',
    why: 'Your store runs on Shopify and bills in AED, so this lands straight on your margin. When it takes effect I can work out what it saves you against last month.',
    points: [
      'Lower card rate for AED and SAR billing',
      'Payouts move to next-day in the region',
      'Takes effect at the start of next month',
    ],
    forYou: 'Your store bills in AED on Shopify',
  },
  {
    id: 'ai-assistants',
    topic: 'tech',
    headline: 'The big platforms are racing to put an assistant in every inbox',
    source: 'The Verge',
    time: 'Yesterday, 9:20 PM',
    summary:
      'Three major suites shipped inbox assistants this week that draft replies and summarise threads, pushing the feature from novelty to default across email.',
    why: "It's the category you're living in with me. Nothing to do - I just think you'd want to know where the rest of the field is heading.",
    points: [
      'Draft-and-summarise now shipping by default',
      'Pricing is folding into existing plans',
      'Privacy terms vary widely between them',
    ],
  },
  {
    id: 'karachi-roads',
    topic: 'local',
    headline: 'Shahra-e-Faisal lane closures start Thursday for resurfacing',
    source: 'Dawn',
    time: 'Today, 7:05 AM',
    summary:
      'Two lanes on Shahra-e-Faisal near the airport interchange close from Thursday for a week of night resurfacing, with daytime traffic expected to bunch at peak.',
    why: "That's your commute. I've already factored it into Thursday's leave-by time, so you don't need to do anything - just don't be surprised when I nudge you earlier.",
    points: [
      'Two lanes shut near the airport interchange',
      'Work runs nights for about a week',
      'I moved Thursday’s leave-by 10 minutes earlier',
    ],
    forYou: 'On your Home to Office route',
  },
  {
    id: 'world-summit',
    topic: 'world',
    headline: 'Gulf leaders set a regional trade meeting for next month',
    source: 'Reuters',
    time: 'Yesterday, 6:00 PM',
    summary:
      'Six Gulf states agreed to convene on cross-border trade and customs next month, with small-business export rules on the agenda for the first time.',
    why: "Export rules for small businesses are on the table, and you've asked before about selling into the UAE. I'll watch for anything concrete that comes out of it.",
    points: [
      'Meeting set for next month',
      'Small-business export rules on the agenda',
      'Nothing binding yet - this is the setup',
    ],
  },
  {
    id: 'sleep-study',
    topic: 'health',
    headline: 'A large study links a steady sleep schedule to sharper afternoons',
    source: 'Nature',
    time: 'Yesterday, 2:30 PM',
    summary:
      'Researchers tracking 40,000 people found that a consistent bedtime predicted afternoon focus better than total hours slept, even by a small margin.',
    why: "You follow this one, and it's a fair nudge: your bedtime wandered by two hours last week. Connect Health and I can hold you to the steadier end of it.",
    points: [
      'Consistency beat raw hours for afternoon focus',
      'Even a 30-minute drift showed up',
      'Weekends were where most people slipped',
    ],
  },
]

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
