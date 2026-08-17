import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'


export type ActivityState = 'auto' | 'approved' | 'recommended' | 'waiting' | 'insight' | 'not-done'

export const STATE_LABEL: Record<ActivityState, string> = {
  auto: 'Done automatically',
  approved: 'Done after approval',
  recommended: 'Recommended',
  waiting: 'Waiting for approval',
  insight: 'Insight',
  'not-done': 'Not performed',
}


export type WingmanActivity = { icon: IconName; tone: ChipTone; title: string; body: string }

export const wingmanDay = {
  summary:
    'You had a busy morning with three meetings. I moved two lower-priority tasks, prepared your client brief, created four follow-ups and adjusted your departure reminder because traffic increased.',
  counts: { actions: 6, recommendations: 3, decisions: 4 },
  activities: [
    {
      icon: 'spark',
      tone: 'lavender',
      title: 'Prepared your meeting',
      body: 'I reviewed your previous emails with Sarah and added three unresolved pricing questions to your brief.',
    },
    {
      icon: 'pin',
      tone: 'blue',
      title: 'Adjusted your departure reminder',
      body: 'Traffic became heavier, so I moved your leave reminder from 2:20 PM to 2:05 PM.',
    },
    {
      icon: 'task',
      tone: 'mint',
      title: 'Created follow-up tasks',
      body: 'I created four tasks from your Product Strategy meeting and assigned deadlines based on the discussion.',
    },
  ] as WingmanActivity[],
}


export type IntelDecision = {
  id: string
  title: string
  body: string
  used: string[]
  permission: string
  at: string
  result: string
  undoable?: boolean
}

export type IntelAction = {
  id: string
  icon: IconName
  tone: ChipTone
  title: string
  body: string
  at: string
  trigger: string
  link?: { label: string; route: string }
  state: 'auto' | 'approved'
}

export type IntelRec = {
  id: string
  icon: IconName
  tone: ChipTone
  title: string
  reason: string
  suggestion: string
}

export type IntelInsight = {
  id: string
  icon: IconName
  tone: ChipTone
  title: string
  body: string
  action?: string
}

export type IntelSource = { name: string; note: string; icon: IconName; tone: ChipTone }

export type TimelineKind = 'decision' | 'completed' | 'recommendation' | 'approval' | 'insight'

export type TimelineItem = { at: string; text: string; kind: TimelineKind }

export const TIMELINE_FILTERS: { key: TimelineKind | 'all'; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'decision', label: 'Decisions' },
  { key: 'completed', label: 'Completed' },
  { key: 'recommendation', label: 'Recommendations' },
  { key: 'approval', label: 'Approvals' },
  { key: 'insight', label: 'Insights' },
]

export const dailyIntel = {
  overview: {
    text: 'Today you attended three meetings, completed five tasks and received two urgent emails. I prepared two meeting briefs, adjusted one travel reminder, created four follow-up tasks and drafted an email to Sarah. One suggested calendar change is still waiting for you.',
    date: 'Tue, 21 Jul',
    updated: '2:35 PM',
    status: 'On track',
    completed: 6,
    recommendations: 3,
    insights: 2,
  },
  decisions: [
    {
      id: 'move-task',
      title: 'Moved your task reminder',
      body: "I moved 'Review campaign report' from 1:00 PM to 4:30 PM because your client meeting ran longer than expected and the task was marked medium priority.",
      used: ['Calendar meeting duration', 'Task priority', 'Free time after 4:00 PM'],
      permission: 'Reschedule my own reminders',
      at: '1:12 PM',
      result: 'Reminder moved to 4:30 PM.',
      undoable: true,
    },
    {
      id: 'move-departure',
      title: 'Adjusted your departure reminder',
      body: 'Traffic on your route to Clifton was heavier than usual, so I moved your leave reminder 15 minutes earlier to keep your ten-minute arrival buffer.',
      used: ['Live traffic', 'Meeting start time', 'Your usual arrival buffer'],
      permission: 'Adjust my own reminders',
      at: '8:20 AM',
      result: 'Leave reminder moved to 2:05 PM.',
      undoable: true,
    },
    {
      id: 'reorder-tasks',
      title: 'Reordered your morning',
      body: "I put the bank reply first because your 10:00 depended on it, and pushed two low-priority tasks to the afternoon.",
      used: ['Task priority', 'Meeting dependencies'],
      permission: 'Order my own task list',
      at: '7:58 AM',
      result: 'Bank reply surfaced first; two tasks moved to the afternoon.',
    },
  ] as IntelDecision[],
  actions: [
    {
      id: 'a-brief',
      icon: 'spark',
      tone: 'lavender',
      title: 'Prepared meeting brief',
      body: 'For your Product Strategy meeting with Sarah, built from six emails and the 8 July summary.',
      at: '9:10 AM',
      trigger: 'Calendar meeting 60 min out',
      link: { label: 'View meeting', route: 'meetings/product-strategy' },
      state: 'auto',
    },
    {
      id: 'a-tasks',
      icon: 'task',
      tone: 'mint',
      title: 'Created four follow-up tasks',
      body: 'From your Product Strategy meeting with Sarah, with deadlines set from the discussion.',
      at: '11:45 AM',
      trigger: 'Meeting ended',
      link: { label: 'View tasks', route: 'tasks' },
      state: 'auto',
    },
    {
      id: 'a-reminder',
      icon: 'pin',
      tone: 'blue',
      title: 'Updated departure reminder',
      body: 'Moved your leave time to 2:05 PM after traffic increased on the Clifton route.',
      at: '8:20 AM',
      trigger: 'Traffic changed',
      link: { label: 'View route', route: 'route/clifton' },
      state: 'auto',
    },
    {
      id: 'a-wa',
      icon: 'chat',
      tone: 'mint',
      title: 'Sent your morning summary to WhatsApp',
      body: 'Your day in a message, at your usual briefing time.',
      at: '8:05 AM',
      trigger: 'Morning briefing time',
      state: 'auto',
    },
    {
      id: 'a-standup',
      icon: 'calendar',
      tone: 'blue',
      title: 'Moved the daily standup to 9:45',
      body: "Sent Rai the new time and moved the recurring invite, after you approved it.",
      at: '9:22 AM',
      trigger: 'You approved the change',
      link: { label: 'Open approvals', route: 'approvals' },
      state: 'approved',
    },
  ] as IntelAction[],
  recommendations: [
    {
      id: 'r-review',
      icon: 'calendar',
      tone: 'lavender',
      title: "Move tomorrow's internal review",
      reason: 'Your morning has three meetings back to back, and your Health summary shows below-average sleep.',
      suggestion: 'Move the review from 11:30 AM to 3:00 PM.',
    },
    {
      id: 'r-client',
      icon: 'users',
      tone: 'sand',
      title: 'Follow up with Hina',
      reason: 'Invoice 2214 cleared yesterday but you have not confirmed receipt, and she asked twice.',
      suggestion: 'Send a one-line acknowledgement.',
    },
    {
      id: 'r-break',
      icon: 'heart',
      tone: 'rose',
      title: 'Take a break after your 2:00',
      reason: 'You have been in meetings since 9:30 with no gap, and your recovery is below your seven-day average.',
      suggestion: 'Hold 3:00 to 3:20 PM clear.',
    },
  ] as IntelRec[],
  insights: [
    {
      id: 'i-meetings',
      icon: 'clock',
      tone: 'blue',
      title: 'Your product meetings run long',
      body: 'Your last three product meetings ran an average of 18 minutes over schedule.',
      action: 'Add a 20-minute buffer after future product meetings',
    },
    {
      id: 'i-conversion',
      icon: 'globe',
      tone: 'peach',
      title: 'Traffic is up, conversion slipped',
      body: 'Website traffic rose 18% this week while conversion fell 0.3 points. Most visitors leave before the pricing page.',
      action: "Add to Today's Snapshot",
    },
  ] as IntelInsight[],
  sources: [
    { name: 'Calendar', note: 'Used meeting times, locations and free schedule space.', icon: 'calendar', tone: 'blue' },
    { name: 'Gmail', note: 'Used sender, urgency and conversation context.', icon: 'mail', tone: 'lavender' },
    { name: 'Tasks', note: 'Used priority and due dates to order your day.', icon: 'task', tone: 'mint' },
    { name: 'Traffic', note: 'Used route duration, estimated delay and arrival time.', icon: 'pin', tone: 'sand' },
    { name: 'Meeting notes', note: 'Used decisions and action items from completed meetings.', icon: 'spark', tone: 'lavender' },
    { name: 'Business analytics', note: 'Used visitors and conversion for this week.', icon: 'globe', tone: 'peach' },
    { name: 'Health', note: 'Used sleep and recovery, only to pace your schedule.', icon: 'heart', tone: 'rose' },
  ] as IntelSource[],
  notDone: [
    'I did not reschedule your 4:00 PM meeting because it includes an external participant, and your permissions require confirmation before changing external meetings.',
    'I did not send the follow-up email to Sarah because sending mail always waits for your review.',
    'I did not record your 8:45 call because participant consent was not confirmed.',
    'I did not send a news alert about the market dip because it is outside your topic preferences.',
  ],
  timeline: [
    { at: '8:05 AM', text: 'Morning summary sent to WhatsApp.', kind: 'completed' },
    { at: '8:20 AM', text: 'Departure reminder moved 15 minutes earlier because traffic increased.', kind: 'decision' },
    { at: '9:10 AM', text: 'Product Strategy meeting brief prepared.', kind: 'completed' },
    { at: '9:22 AM', text: 'Daily standup moved to 9:45, after you approved it.', kind: 'approval' },
    { at: '11:45 AM', text: 'Four action items created from the completed meeting.', kind: 'completed' },
    { at: '12:00 PM', text: 'Follow-up email to Sarah drafted, approval requested.', kind: 'approval' },
    { at: '1:12 PM', text: "Task reminder 'Review campaign report' moved to 4:30 PM.", kind: 'decision' },
    { at: '2:30 PM', text: 'A drop in campaign conversion was detected.', kind: 'insight' },
    { at: '2:34 PM', text: "Recommended moving tomorrow's internal review.", kind: 'recommendation' },
  ] as TimelineItem[],
}


export type SummaryLine = {
  icon: IconName
  tone: ChipTone
  title: string
  sub: string
  route?: string
  approval?: string
}

export const dailySummary = {
  intro:
    'Good morning, John. You have three meetings today, one urgent email and four open tasks. Traffic to the office is moderate, so you should leave by 8:20 AM. Your Product Strategy meeting brief is ready.',
  updated: '8:05 AM',
  actNow: [
    { icon: 'mail', tone: 'sand', title: 'Reply to the bank', sub: 'Your 10:00 depends on it', approval: 'bank-forward' },
    { icon: 'checkCircle', tone: 'blue', title: 'One approval waiting', sub: "Sarah's demo move to 2:00 PM", route: 'approvals' },
  ] as SummaryLine[],
  prepare: [
    { icon: 'spark', tone: 'lavender', title: 'Product Strategy, 11:00 AM', sub: 'Brief ready, with Sarah', route: 'meetings/product-strategy' },
    { icon: 'pin', tone: 'blue', title: 'Leave by 2:05 PM for Clifton', sub: 'Moderate traffic, 35 min', route: 'route/clifton' },
    { icon: 'users', tone: 'sand', title: 'Client Review, 2:00 PM', sub: 'Prep available, Zero Lifestyle', route: 'meetings/zero-review' },
  ] as SummaryLine[],
  beAware: [
    { icon: 'globe', tone: 'peach', title: 'Store traffic up 18%', sub: 'Conversion slipped slightly', route: 'business/performance' },
    { icon: 'receipt', tone: 'sand', title: 'Car insurance renews 14 Aug', sub: 'One tap when you are ready', route: 'bills' },
    { icon: 'box', tone: 'peach', title: 'Headphones arrive Thursday', sub: 'Out for delivery', route: 'deliveries' },
  ] as SummaryLine[],
  handled: [
    { icon: 'chat', tone: 'mint', title: 'Morning summary sent to WhatsApp', sub: 'At 8:05 AM' },
    { icon: 'task', tone: 'mint', title: 'Reordered your task list', sub: 'Bank reply first' },
    { icon: 'spark', tone: 'lavender', title: 'Meeting brief prepared', sub: 'Product Strategy' },
  ] as SummaryLine[],
  evening: {
    intro:
      'You completed three meetings and five tasks today. Two follow-ups remain open. Your first meeting tomorrow is at 10:00 AM, and I have already prepared the briefing.',
    lines: [
      { icon: 'checkCircle', tone: 'mint', title: 'Three meetings completed', sub: 'Two decisions, four action items' },
      { icon: 'task', tone: 'mint', title: 'Five tasks done', sub: 'Three still open for tomorrow' },
      { icon: 'users', tone: 'sand', title: 'Two follow-ups still open', sub: 'Sarah and Hina' },
      { icon: 'mail', tone: 'blue', title: 'One message waiting on you', sub: 'Draft email to Sarah' },
      { icon: 'calendar', tone: 'lavender', title: "Tomorrow's first meeting, 10:00 AM", sub: 'Briefing already prepared' },
    ] as SummaryLine[],
  },
  sources: ['Calendar', 'Gmail', 'Tasks', 'Traffic', 'Business analytics', 'Meeting notes'],
}


type Persisted = {
  recs: Record<string, 'accepted' | 'dismissed'>
  undone: Record<string, true>
  reviewed: Record<'morning' | 'evening', boolean>
}

const KEY = 'wingman.intelligence'

const fresh = (): Persisted => ({ recs: {}, undone: {}, reviewed: { morning: false, evening: false } })

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

export const useIntel = () => useSyncExternalStore(subscribe, () => state)

export const recDecision = (id: string) => state.recs[id]
export const decideRec = (id: string, d: 'accepted' | 'dismissed') =>
  persist({ ...state, recs: { ...state.recs, [id]: d } })
export const resetRec = (id: string) => {
  const { [id]: _gone, ...rest } = state.recs
  persist({ ...state, recs: rest })
}

export const isUndone = (id: string) => !!state.undone[id]
export const undoDecision = (id: string) => persist({ ...state, undone: { ...state.undone, [id]: true } })
export const redoDecision = (id: string) => {
  const { [id]: _gone, ...rest } = state.undone
  persist({ ...state, undone: rest })
}

export const markReviewed = (which: 'morning' | 'evening') =>
  persist({ ...state, reviewed: { ...state.reviewed, [which]: true } })

export { NOW }
