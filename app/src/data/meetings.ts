import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'
import { api, type ServerMeetingSummary, type ServerMeeting, type EmailResult } from './api'


export type MeetingStatus =
  | 'prep-available'
  | 'brief-ready'
  | 'assist-requested'
  | 'assist-approved'
  | 'recording-scheduled'
  | 'in-progress'
  | 'processing'
  | 'summary-ready'
  | 'follow-up'
  | 'completed'
  | 'cancelled'

export type MeetingFilter = 'upcoming' | 'today' | 'in-progress' | 'processing' | 'completed' | 'follow-up'

export const MEETING_FILTERS: { key: MeetingFilter; label: string }[] = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'today', label: 'Today' },
  { key: 'in-progress', label: 'In progress' },
  { key: 'processing', label: 'Processing' },
  { key: 'completed', label: 'Completed' },
  { key: 'follow-up', label: 'Follow-up' },
]

export const MEETING_STATUS: Record<MeetingStatus, { label: string; tone: 'go' | 'wait' | 'live' | 'done' | 'off' }> = {
  'prep-available': { label: 'Preparation available', tone: 'go' },
  'brief-ready': { label: 'Brief ready', tone: 'go' },
  'assist-requested': { label: 'Assistance requested', tone: 'wait' },
  'assist-approved': { label: 'Assistance approved', tone: 'go' },
  'recording-scheduled': { label: 'Recording scheduled', tone: 'wait' },
  'in-progress': { label: 'Meeting in progress', tone: 'live' },
  processing: { label: 'Processing notes', tone: 'wait' },
  'summary-ready': { label: 'Summary ready', tone: 'go' },
  'follow-up': { label: 'Follow-up required', tone: 'wait' },
  completed: { label: 'Completed', tone: 'done' },
  cancelled: { label: 'Cancelled', tone: 'off' },
}

export type Attendee = { name: string; initial: string; role?: string; person?: boolean; email?: string }

export type BriefSection = {
  key: string
  title: string
  body?: string
  items?: string[]
}

export type MeetingBrief = {
  objective: string
  sections: BriefSection[]
  files?: { name: string; from: string }[]
}

export type ActionItem = {
  task: string
  owner: string
  due: string
  priority: 'High' | 'Medium' | 'Low'
  project?: string
  done?: boolean
}

export type ProposedAction = {
  id: string
  kind: 'tasks' | 'email' | 'meeting' | 'whatsapp'
  label: string
  detail: string
  tone: ChipTone
  icon: IconName
  external?: boolean
}

export type MeetingSummary = {
  overview: string
  discussion: string[]
  decisions: string[]
  actions: ActionItem[]
  openQuestions: string[]
  followUps: string[]
  nextMeeting?: { date: string; time: string; participants: string; objective: string }
  transcript: { at: string; speaker: string; text: string }[]
  recorded?: boolean
  recording: { duration: string; retention: string }
  proposedActions: ProposedAction[]
}

export type Meeting = {
  id: string
  title: string
  instant?: boolean
  when: string
  at: string
  day: string
  today?: boolean
  attendees: Attendee[]
  company: string
  location: string
  virtual?: boolean
  type: 'Product' | 'Client' | 'Internal' | 'Sales' | 'Partner'
  project?: string
  status: MeetingStatus
  tone: ChipTone
  icon: IconName
  context: string[]
  travelRoute?: string
  brief?: MeetingBrief
  summary?: MeetingSummary
  serverId?: string
}


const SARAH: Attendee = { name: 'Sarah Nadeem', initial: 'S', role: 'Head of Product, Meridian', person: true }
const YOU: Attendee = { name: 'You', initial: 'Y', person: true }

export const meetings: Meeting[] = [
  {
    id: 'design-sync',
    title: 'Design Partner Sync',
    when: '9:30 - 10:15 AM',
    at: '09:30',
    day: 'Today',
    today: true,
    attendees: [{ name: 'Omar Farooq', initial: 'O', role: 'Northwind', person: true }, YOU],
    company: 'Northwind',
    location: 'Google Meet',
    virtual: true,
    type: 'Partner',
    project: 'Q3 Launch',
    status: 'summary-ready',
    tone: 'blue',
    icon: 'grid',
    context: [
      'Recording and transcript captured with consent',
      'Four previous syncs on file',
      'Two open commitments from last month',
    ],
    summary: {
      overview:
        'Northwind confirmed they can hit the 4 August handoff for the launch assets. Omar raised a licensing question on the icon set that needs your sign-off, and you agreed to a shorter weekly cadence through the launch.',
      discussion: [
        'Launch asset handoff timing and dependencies',
        'Icon licensing for the marketing site',
        'Moving the sync to weekly through August',
      ],
      decisions: [
        'Handoff date confirmed for 4 August',
        'Sync moves to weekly until launch',
      ],
      actions: [
        { task: 'Send the icon licensing terms to Omar', owner: 'You', due: 'Tomorrow', priority: 'High', project: 'Q3 Launch' },
        { task: 'Confirm the 4 Aug handoff in the shared tracker', owner: 'You', due: 'Today', priority: 'Medium', project: 'Q3 Launch' },
        { task: 'Book the weekly sync series through August', owner: 'Wingman', due: 'Today', priority: 'Medium' },
      ],
      openQuestions: ['Whether the extended icon license covers the app store screenshots'],
      followUps: ['Omar is waiting on the licensing terms before he can brief his team'],
      nextMeeting: {
        date: 'Thu 24 Jul',
        time: '9:30 AM',
        participants: 'Omar Farooq, you',
        objective: 'First weekly launch sync - asset status and open licensing',
      },
      transcript: [
        { at: '9:31', speaker: 'Omar', text: "We're good for the 4th on the asset pack, assuming the icon license is sorted." },
        { at: '9:34', speaker: 'You', text: "I'll get you the licensing terms tomorrow so you can brief the team." },
        { at: '9:52', speaker: 'Omar', text: 'Can we go weekly until launch? Monthly is too slow this close in.' },
        { at: '9:53', speaker: 'You', text: 'Works for me. Same time on Thursdays.' },
      ],
      recording: { duration: '44 min', retention: 'Kept for 30 days, then deleted automatically' },
      proposedActions: [
        {
          id: 'ds-tasks',
          kind: 'tasks',
          label: 'Create 3 tasks',
          detail: 'Add the three action items to Tasks, with the owners and deadlines agreed in the meeting.',
          tone: 'violet' as ChipTone,
          icon: 'task',
        },
        {
          id: 'ds-email',
          kind: 'email',
          label: 'Draft email to Omar',
          detail: 'Draft a follow-up to Omar with the licensing terms attached and the confirmed 4 Aug handoff. Held for your review - nothing sends until you approve it.',
          tone: 'blue' as ChipTone,
          icon: 'mail',
          external: true,
        },
        {
          id: 'ds-meeting',
          kind: 'meeting',
          label: 'Book the weekly sync',
          detail: 'Create a weekly Thursday 9:30 AM sync with Omar through 28 August, with the agreed agenda in the invite.',
          tone: 'lavender' as ChipTone,
          icon: 'calendar',
          external: true,
        },
        {
          id: 'ds-whatsapp',
          kind: 'whatsapp',
          label: 'Send summary to WhatsApp',
          detail: 'Send this meeting summary to your WhatsApp so you have it on your phone.',
          tone: 'mint' as ChipTone,
          icon: 'chat',
        },
      ],
    },
  },
  {
    id: 'product-strategy',
    title: 'Product Strategy Meeting',
    when: '11:00 AM - 12:00 PM',
    at: '11:00',
    day: 'Today',
    today: true,
    attendees: [SARAH, { name: 'Rai Aslam', initial: 'R', role: 'Engineering', person: true }, YOU],
    company: 'Meridian',
    location: 'Google Meet',
    virtual: true,
    type: 'Product',
    project: 'Pricing v2',
    status: 'brief-ready',
    tone: 'lavender',
    icon: 'spark',
    context: [
      'Six emails with Sarah since the last meeting',
      'Previous meeting summary from 8 July',
      'Three unresolved pricing questions',
      'Related: Pricing v2 project, two open tasks',
    ],
    brief: {
      objective:
        'Agree the pricing tiers for v2 and settle the three questions Sarah raised, so engineering can start the billing work this week.',
      sections: [
        {
          key: 'attendees',
          title: 'Attendee context',
          items: [
            'Sarah Nadeem - Head of Product at Meridian. Pushed for a lower entry tier last time; owns the launch date.',
            'Rai Aslam - Engineering. Needs the tiers final before he can scope the billing changes.',
          ],
        },
        {
          key: 'previous',
          title: 'Previous discussion',
          body: 'On 8 July you agreed the three-tier shape but left the entry price open. Sarah wanted AED 99, you wanted AED 129. You said you would bring usage data to decide.',
        },
        {
          key: 'unresolved',
          title: 'Important unresolved matters',
          items: [
            'Entry tier price - AED 99 vs AED 129',
            'Whether the middle tier includes the meeting assistant',
            'Annual discount depth',
          ],
        },
        {
          key: 'talking',
          title: 'Recommended talking points',
          items: [
            'Lead with the usage data: 80% of trials stay under the AED 129 usage cap',
            'Propose the meeting assistant as the middle-tier hook',
            'Hold annual discount at 20% to protect the margin floor',
          ],
        },
        {
          key: 'questions',
          title: 'Questions to ask',
          items: [
            'What launch date is Sarah committed to externally?',
            'Does Meridian have a competitor moving on price first?',
          ],
        },
        {
          key: 'risks',
          title: 'Risks or concerns',
          items: ['A lower entry price undercuts the AED 240,000 monthly goal if conversion does not lift with it'],
        },
        {
          key: 'decisions',
          title: 'Decisions required',
          items: ['Final entry price', 'Middle-tier contents', 'Annual discount'],
        },
        {
          key: 'commitments',
          title: 'Open commitments',
          items: ['You owe Sarah the final deck (day 8)', 'Rai is blocked until the tiers are final'],
        },
      ],
      files: [
        { name: 'Pricing v2 model.xlsx', from: 'Google Drive' },
        { name: 'Trial usage, June.pdf', from: 'Analytics export' },
        { name: 'Meeting summary, 8 Jul', from: 'Wingman' },
      ],
    },
    summary: {
      overview:
        'You settled the v2 pricing: AED 129 entry, the meeting assistant as the middle-tier hook, and a 20% annual discount. Rai is unblocked to start the billing work, and you still owe Sarah the final deck before the follow-up.',
      discussion: [
        'Entry tier price, decided against the trial usage data',
        'Whether the middle tier includes the meeting assistant',
        'Depth of the annual discount',
        'External launch timing',
      ],
      decisions: [
        'Entry tier set at AED 129',
        'Middle tier includes the meeting assistant',
        'Annual discount held at 20%',
      ],
      actions: [
        { task: 'Send Sarah the updated pricing document', owner: 'You', due: 'Tomorrow', priority: 'High', project: 'Pricing v2' },
        { task: 'Confirm the launch timeline with Sarah', owner: 'You', due: 'Thu', priority: 'Medium', project: 'Pricing v2' },
        { task: 'Brief Rai to start the billing work', owner: 'Rai Aslam', due: 'Today', priority: 'High', project: 'Pricing v2' },
      ],
      openQuestions: ['Whether a competitor moves on price before Meridian launches'],
      followUps: ['Sarah is waiting on the final deck - day 8 on your promise'],
      nextMeeting: {
        date: 'Tomorrow',
        time: '11:00 AM',
        participants: 'Sarah Nadeem, you',
        objective: 'Walk through the final deck and confirm the launch',
      },
      transcript: [
        { at: '11:06', speaker: 'You', text: '80% of trials stay under the AED 129 cap, so the higher entry holds.' },
        { at: '11:19', speaker: 'Sarah', text: 'If the assistant is in the middle tier, I can sell that.' },
        { at: '11:38', speaker: 'Rai', text: "Once the tiers are final I can scope the billing this week." },
        { at: '11:52', speaker: 'Sarah', text: 'Send me the final deck and let us reconvene tomorrow.' },
      ],
      recording: { duration: '58 min', retention: 'Kept for 30 days, then deleted automatically' },
      proposedActions: [
        {
          id: 'ps-tasks',
          kind: 'tasks',
          label: 'Create 3 tasks',
          detail: 'Add the three action items to Tasks, with owners and deadlines set from the discussion.',
          tone: 'violet' as ChipTone,
          icon: 'task',
        },
        {
          id: 'ps-email',
          kind: 'email',
          label: 'Draft email to Sarah',
          detail: 'The draft includes the three agreed action items and proposes tomorrow at 11:00 AM for the follow-up. Held for your review - nothing sends until you approve it.',
          tone: 'blue' as ChipTone,
          icon: 'mail',
          external: true,
        },
        {
          id: 'ps-meeting',
          kind: 'meeting',
          label: 'Schedule the follow-up',
          detail: 'Create a follow-up with Sarah tomorrow at 11:00 AM and include the agreed action items in the invitation.',
          tone: 'lavender' as ChipTone,
          icon: 'calendar',
          external: true,
        },
        {
          id: 'ps-whatsapp',
          kind: 'whatsapp',
          label: 'Send summary to WhatsApp',
          detail: 'Send this meeting summary to your WhatsApp so you have it on your phone.',
          tone: 'mint' as ChipTone,
          icon: 'chat',
        },
      ],
    },
  },
  {
    id: 'zero-review',
    title: 'Client Review · Zero Lifestyle',
    when: '2:00 - 2:45 PM',
    at: '14:00',
    day: 'Today',
    today: true,
    attendees: [{ name: 'Hina Qureshi', initial: 'H', role: 'Zero Lifestyle', person: true }, YOU],
    company: 'Zero Lifestyle',
    location: 'Clifton office',
    type: 'Client',
    project: 'Account onboarding',
    status: 'prep-available',
    tone: 'sand',
    icon: 'users',
    context: [
      'Invoice 2214 was overdue and cleared yesterday',
      'Bank verification confirmed on Friday',
      'No previous meeting summary yet',
    ],
    travelRoute: 'clifton',
  },
  {
    id: 'ops-weekly',
    title: 'Ops Weekly',
    when: '10:00 - 10:30 AM',
    at: '10:00',
    day: 'Today',
    today: true,
    attendees: [{ name: 'Team', initial: 'T', role: '5 people' }, YOU],
    company: 'Callus Rad',
    location: 'Google Meet',
    virtual: true,
    type: 'Internal',
    status: 'in-progress',
    tone: 'mint',
    icon: 'users',
    context: ['Recurring weekly', 'Recording and live notes running'],
  },
  {
    id: 'northwind-notes',
    title: 'Supplier Terms Call',
    when: '8:45 - 9:10 AM',
    at: '08:45',
    day: 'Today',
    today: true,
    attendees: [{ name: 'Bilal Ahmed', initial: 'B', role: 'Meridian', person: true }, YOU],
    company: 'Meridian',
    location: 'Phone',
    type: 'Sales',
    status: 'processing',
    tone: 'blue',
    icon: 'phone',
    context: ['Recording captured', 'Transcript processing - summary in a few minutes'],
  },
  {
    id: 'investor-update',
    title: 'Investor Update',
    when: '3:30 - 4:15 PM',
    at: '15:30',
    day: 'Tomorrow',
    attendees: [{ name: 'Ayesha Khan', initial: 'A', role: 'Board', person: true }, YOU],
    company: 'Board',
    location: 'Google Meet',
    virtual: true,
    type: 'Internal',
    project: 'Q3 Board',
    status: 'prep-available',
    tone: 'peach',
    icon: 'spark',
    context: ['Last quarter deck on file', 'Business performance snapshot available'],
  },
  {
    id: 'supplier-renewal',
    title: 'Packaging Supplier Renewal',
    when: '4:30 - 5:00 PM',
    at: '16:30',
    day: 'Wed 22 Jul',
    attendees: [{ name: 'Kamal Rizvi', initial: 'K', role: 'Supplier', person: true }, YOU],
    company: 'BoxCo',
    location: 'Phone',
    type: 'Sales',
    status: 'cancelled',
    tone: 'rose',
    icon: 'box',
    context: ['Cancelled by the supplier', 'Rescheduling proposed for next week'],
  },
]

// Real meetings loaded from the backend (null until hydrated). Once loaded, the
// list is the user's real meetings (local instants + server), no seed samples.
let serverMeetings: Meeting[] | null = null

export const allMeetings = (): Meeting[] => {
  const instants = instantMeetings()
  if (serverMeetings === null) return [...instants, ...meetings] // seed until loaded
  const syncedIds = new Set(instants.map((m) => m.serverId).filter(Boolean))
  const server = serverMeetings.filter((m) => !syncedIds.has(m.serverId))
  return [...instants, ...server]
}

export const meetingById = (id: string) => allMeetings().find((m) => m.id === id)

export const meetingInFilter = (m: Meeting, f: MeetingFilter): boolean => {
  switch (f) {
    case 'today':
      return !!m.today && m.status !== 'cancelled'
    case 'in-progress':
      return m.status === 'in-progress'
    case 'processing':
      return m.status === 'processing'
    case 'completed':
      return m.status === 'completed' || m.status === 'summary-ready'
    case 'follow-up':
      return m.status === 'follow-up' || (m.status === 'summary-ready' && (m.summary?.followUps.length ?? 0) > 0)
    case 'upcoming':
      return ['prep-available', 'brief-ready', 'assist-approved', 'assist-requested', 'recording-scheduled'].includes(
        m.status,
      )
  }
}


export type AssistOption = { key: string; label: string; external?: boolean }

export const ASSIST_OPTIONS: AssistOption[] = [
  { key: 'brief', label: 'Prepare meeting brief' },
  { key: 'remind', label: 'Remind me before the meeting' },
  { key: 'notes', label: 'Take live notes' },
  { key: 'record', label: 'Record the meeting' },
  { key: 'transcribe', label: 'Transcribe the meeting' },
  { key: 'topics', label: 'Detect important discussion points' },
  { key: 'decisions', label: 'Detect decisions' },
  { key: 'actions', label: 'Extract action items' },
  { key: 'owners', label: 'Identify owners and deadlines' },
  { key: 'tasks', label: 'Create tasks after the meeting' },
  { key: 'draft', label: 'Draft follow-up email', external: true },
  { key: 'next', label: 'Suggest the next meeting' },
  { key: 'invite', label: 'Prepare a calendar invitation', external: true },
  { key: 'whatsapp', label: 'Send the summary to WhatsApp' },
  { key: 'crm', label: 'Add attendees to People CRM' },
  { key: 'reminders', label: 'Create follow-up reminders' },
]

const DEFAULT_ASSIST: Record<string, boolean> = {
  brief: true,
  remind: true,
  notes: true,
  record: true,
  transcribe: true,
  topics: true,
  decisions: true,
  actions: true,
  owners: true,
  tasks: true,
  draft: true,
  next: true,
  invite: false,
  whatsapp: true,
  crm: false,
  reminders: true,
}

export type ApprovalLevel = 'ask' | 'approved' | 'auto'

export const APPROVAL_LEVELS: { key: ApprovalLevel; label: string; desc: string }[] = [
  { key: 'ask', label: 'Always ask before acting', desc: 'Nothing happens without a tap from you first.' },
  { key: 'approved', label: 'Approved for this meeting', desc: "I'll do what you've enabled here, for this meeting only." },
  {
    key: 'auto',
    label: 'Automatically perform approved actions',
    desc: 'I run the enabled actions on my own. External actions still wait for you.',
  },
]

export const REMINDER_LEADS = ['10 minutes', '15 minutes', '30 minutes', '60 minutes'] as const

export type MeetingConfig = {
  assist: Record<string, boolean>
  level: ApprovalLevel
  lead: string
}

const defaultConfig = (): MeetingConfig => ({ assist: { ...DEFAULT_ASSIST }, level: 'approved', lead: '60 minutes' })


type Persisted = {
  configs: Record<string, Partial<MeetingConfig>>
  actions: Record<string, 'approved' | 'rejected' | 'saved'>
  instants: Meeting[]
  nextInstant: number
}

const KEY = 'wingman.meetings'

const EMPTY: Persisted = { configs: {}, actions: {}, instants: [], nextInstant: 1 }

const read = (): Persisted => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY }
  } catch {
    return { ...EMPTY }
  }
}

let state = read()
let live: Record<string, LiveSession> = {}
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const emit = () => listeners.forEach((fn) => fn())

const persist = (next: Persisted) => {
  state = next
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
  }
  emit()
}

const snapshot = () => state
const liveSnapshot = () => live

export const useMeetingState = () => useSyncExternalStore(subscribe, snapshot)
export const useLiveState = () => useSyncExternalStore(subscribe, liveSnapshot)

export const meetingConfig = (id: string): MeetingConfig => ({ ...defaultConfig(), ...state.configs[id], assist: { ...defaultConfig().assist, ...state.configs[id]?.assist } })

export const useMeetingConfig = (id: string): MeetingConfig => {
  useMeetingState()
  return meetingConfig(id)
}

export const setAssist = (id: string, key: string, on: boolean) => {
  const cfg = meetingConfig(id)
  persist({ ...state, configs: { ...state.configs, [id]: { ...cfg, assist: { ...cfg.assist, [key]: on } } } })
}

export const setLevel = (id: string, level: ApprovalLevel) => {
  const cfg = meetingConfig(id)
  persist({ ...state, configs: { ...state.configs, [id]: { ...cfg, level } } })
}

export const setLead = (id: string, lead: string) => {
  const cfg = meetingConfig(id)
  persist({ ...state, configs: { ...state.configs, [id]: { ...cfg, lead } } })
}


export type RecPhase = 'idle' | 'arming' | 'recording' | 'paused' | 'processing' | 'ready' | 'error'

export type MicState = 'unknown' | 'granted' | 'denied' | 'unavailable' | 'off'

export type LiveNote = { at: string; text: string; moment?: boolean }

export type LiveSession = {
  phase: RecPhase
  mic: MicState
  seconds: number
  since: number | null
  notes: LiveNote[]
  problem?: string
}

const IDLE: LiveSession = { phase: 'idle', mic: 'unknown', seconds: 0, since: null, notes: [] }

const sessionOf = (id: string): LiveSession => live[id] ?? IDLE

const setSession = (id: string, patch: Partial<LiveSession>) => {
  live = { ...live, [id]: { ...sessionOf(id), ...patch } }
  emit()
}

export const useLive = (id: string) => {
  useLiveState()
  const s = sessionOf(id)
  return {
    ...s,
    started: s.phase === 'arming' || s.phase === 'recording' || s.phase === 'paused',
    recording: s.phase === 'recording',
    ended: s.phase === 'processing' || s.phase === 'ready',
  }
}

export const liveSession = sessionOf

export const liveSeconds = (s: LiveSession) =>
  s.seconds + (s.phase === 'recording' && s.since ? Math.floor((Date.now() - s.since) / 1000) : 0)

export const clock = (total: number) =>
  `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(Math.max(0, total) % 60).padStart(2, '0')}`

export const requestMic = async (): Promise<MicState> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return 'unavailable'
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((tr) => tr.stop())
    return 'granted'
  } catch (e) {
    const name = (e as { name?: string })?.name
    return name === 'NotFoundError' || name === 'NotSupportedError' ? 'unavailable' : 'denied'
  }
}

// ── Real audio capture (MediaRecorder) ──────────────────────────────────────
type Rec = { rec: MediaRecorder; chunks: BlobPart[]; stream: MediaStream; mime: string }
const recorders: Record<string, Rec> = {}

const pickAudioMime = (): string => {
  if (typeof MediaRecorder === 'undefined') return ''
  for (const m of ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/aac', 'audio/ogg']) {
    try {
      if (MediaRecorder.isTypeSupported?.(m)) return m
    } catch {
      /* ignore */
    }
  }
  return ''
}

/** Get the mic AND start recording, keeping the stream open. Returns mic state. */
const startRecording = async (id: string): Promise<MicState> => {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return 'unavailable'
  if (typeof MediaRecorder === 'undefined') return 'unavailable'
  let stream: MediaStream
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  } catch (e) {
    const name = (e as { name?: string })?.name
    return name === 'NotFoundError' || name === 'NotSupportedError' ? 'unavailable' : 'denied'
  }
  try {
    const mime = pickAudioMime()
    const rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream)
    const chunks: BlobPart[] = []
    rec.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunks.push(e.data)
    }
    rec.start()
    recorders[id] = { rec, chunks, stream, mime: rec.mimeType || mime || 'audio/webm' }
    return 'granted'
  } catch {
    stream.getTracks().forEach((tr) => tr.stop())
    return 'unavailable'
  }
}

/** Stop recording and return the captured audio (null if nothing / no recorder). */
const stopRecording = (id: string): Promise<{ blob: Blob; mime: string } | null> => {
  const r = recorders[id]
  if (!r) return Promise.resolve(null)
  delete recorders[id]
  return new Promise((resolve) => {
    const finish = () => {
      try {
        r.stream.getTracks().forEach((tr) => tr.stop())
      } catch {
        /* ignore */
      }
      const blob = new Blob(r.chunks, { type: r.mime })
      resolve(blob.size > 0 ? { blob, mime: r.mime } : null)
    }
    r.rec.onstop = finish
    try {
      if (r.rec.state !== 'inactive') r.rec.stop()
      else finish()
    } catch {
      finish()
    }
  })
}

const micProblem = (mic: MicState) =>
  mic === 'denied'
    ? 'I could not reach your microphone. Allow microphone access for this site, then try again.'
    : 'I could not find a microphone on this device.'

export const startAssist = async (id: string, recording: boolean) => {
  if (!recording) {
    setSession(id, { phase: 'recording', mic: 'off', seconds: 0, since: Date.now(), notes: [] })
    return 'off' as MicState
  }
  setSession(id, { phase: 'arming', mic: 'unknown', seconds: 0, since: null, notes: [] })
  const mic = await startRecording(id)
  if (mic === 'granted') setSession(id, { phase: 'recording', mic, since: Date.now() })
  else setSession(id, { phase: 'error', mic, problem: micProblem(mic) })
  return mic
}

export const retryMic = async (id: string) => {
  setSession(id, { phase: 'arming' })
  const mic = await startRecording(id)
  if (mic === 'granted') setSession(id, { phase: 'recording', mic, since: Date.now() })
  else
    setSession(id, {
      phase: 'error',
      mic,
      problem:
        mic === 'denied'
          ? 'Still blocked. Microphone access is granted in your browser settings for this site.'
          : 'I could not find a microphone on this device.',
    })
  return mic
}

export const continueWithoutMic = (id: string) =>
  setSession(id, { phase: 'recording', mic: 'off', since: Date.now(), problem: undefined })

export const pauseRecording = (id: string) => {
  const s = sessionOf(id)
  if (s.phase === 'recording') {
    setSession(id, { phase: 'paused', seconds: liveSeconds(s), since: null })
  } else if (s.phase === 'paused') {
    setSession(id, { phase: 'recording', since: Date.now() })
  }
}

export const addLiveNote = (id: string, text: string, moment = false) => {
  const s = sessionOf(id)
  setSession(id, { notes: [...s.notes, { at: clock(liveSeconds(s)), text, moment }] })
}

export const endAssist = (id: string) => {
  const s = sessionOf(id)
  const total = liveSeconds(s)
  setSession(id, { phase: 'processing', seconds: total, since: null })
  // Stop the recording, then process: recorded audio → transcribe on the backend,
  // otherwise typed notes → Claude. Local fallback if the backend is unreachable.
  void (async () => {
    const audio = await stopRecording(id)
    await processInstant(id, total, s.notes, s.mic !== 'off', audio)
    if (sessionOf(id).phase === 'processing') setSession(id, { phase: 'ready' })
  })()
}

export const cancelAssist = (id: string) => {
  void stopRecording(id) // stop + discard any recording
  live = { ...live, [id]: IDLE }
  emit()
}


export const instantMeetings = (): Meeting[] => state.instants

export const useInstantMeetings = () => {
  useMeetingState()
  return state.instants
}

const nowLabel = () => {
  const d = new Date()
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return { display: `${h12}:${m} ${ampm}`, at: `${String(h).padStart(2, '0')}:${m}` }
}

export type InstantDraft = {
  title: string
  attendees: { name: string; email?: string }[]
  type?: Meeting['type']
  project?: string
}

export const createInstantMeeting = (d: InstantDraft): string => {
  const n = state.nextInstant
  const id = `instant-${n}`
  const { display, at } = nowLabel()
  const names = d.attendees.map((a) => ({
    name: a.name,
    initial: a.name.trim().charAt(0).toUpperCase() || '?',
    person: true,
    ...(a.email ? { email: a.email } : {}),
  }))
  const m: Meeting = {
    id,
    instant: true,
    title: d.title.trim() || 'Quick meeting',
    when: `${display} · started now`,
    at,
    day: 'Today',
    today: true,
    attendees: [...names, { name: 'You', initial: 'Y', person: true }],
    company: 'Unplanned',
    location: 'In person or call',
    type: d.type ?? 'Internal',
    project: d.project,
    status: 'in-progress',
    tone: 'mint',
    icon: 'phone',
    context: ['Started on the spot', 'No calendar invitation, so no prior context'],
  }
  persist({ ...state, instants: [m, ...state.instants], nextInstant: n + 1 })
  return id
}

const patchInstant = (id: string, patch: Partial<Meeting>) =>
  persist({ ...state, instants: state.instants.map((m) => (m.id === id ? { ...m, ...patch } : m)) })

export const renameInstantMeeting = (id: string, title: string) =>
  patchInstant(id, { title: title.trim() || 'Quick meeting' })

const INSTANT_ACTIONS: ProposedAction[] = [
  {
    id: 'ins-whatsapp',
    kind: 'whatsapp',
    label: 'Send summary to WhatsApp',
    detail: 'Send these notes and action items to your WhatsApp so you have them on your phone.',
    tone: 'mint',
    icon: 'chat',
  },
  {
    id: 'ins-email',
    kind: 'email',
    label: 'Email the notes',
    detail: 'Email these notes and action items to the attendees who have an address, and to you.',
    tone: 'blue',
    icon: 'mail',
    external: true,
  },
]

const retentionLine = (recorded: boolean) =>
  recorded
    ? 'The audio was turned into a transcript, then discarded — nothing is stored.'
    : 'Notes only - no audio was captured, so there is nothing to keep or delete.'

// The fabricated, notes-only summary — the graceful fallback used when the
// backend is unreachable (offline / not yet deployed), so finishing never breaks.
const localSummary = (seconds: number, notes: LiveNote[], recorded: boolean): MeetingSummary => {
  const marks = notes.filter((n) => n.moment)
  const plain = notes.filter((n) => !n.moment)
  const mins = Math.max(1, Math.round(seconds / 60))
  return {
    overview: plain.length
      ? `You captured ${plain.length} note${plain.length === 1 ? '' : 's'} and marked ${marks.length} moment${
          marks.length === 1 ? '' : 's'
        } across ${mins} minute${mins === 1 ? '' : 's'}. Everything below is what you wrote down - I have not added anything you did not say.`
      : recorded
        ? `A ${mins} minute meeting with nothing written down. The recording is here if you need it, and you can still add action items yourself.`
        : `A ${mins} minute meeting with nothing written down, and no audio captured. You can still add action items yourself.`,
    discussion: plain.map((n) => n.text),
    decisions: marks.map((n) => n.text),
    actions: [],
    openQuestions: [],
    followUps: [],
    transcript: notes.map((n) => ({ at: n.at, speaker: 'Note', text: n.text })),
    recorded,
    recording: { duration: `${mins} min`, retention: retentionLine(recorded) },
    proposedActions: INSTANT_ACTIONS,
  }
}

// Map the backend's structured summary onto the app's richer shape (transcript
// from the local notes; recording metadata from the session).
const serverToSummary = (
  s: ServerMeetingSummary | null | undefined,
  seconds: number,
  notes: LiveNote[],
  recorded: boolean,
): MeetingSummary => {
  const mins = Math.max(1, Math.round(seconds / 60))
  const actions: ActionItem[] = (s?.actions ?? []).map((a) => ({
    task: a.task,
    owner: a.owner || '',
    due: a.due || '',
    priority: a.priority === 'High' || a.priority === 'Low' ? a.priority : 'Medium',
  }))
  return {
    overview: s?.overview || localSummary(seconds, notes, recorded).overview,
    discussion: s?.discussion ?? [],
    decisions: s?.decisions ?? [],
    actions,
    openQuestions: s?.openQuestions ?? [],
    followUps: s?.followUps ?? [],
    transcript: notes.map((n) => ({ at: n.at, speaker: 'Note', text: n.text })),
    recorded,
    recording: { duration: `${mins} min`, retention: retentionLine(recorded) },
    proposedActions: INSTANT_ACTIONS,
  }
}

const applyInstantSummary = (id: string, mins: number, summary: MeetingSummary, serverId?: string) => {
  const m = state.instants.find((x) => x.id === id)
  if (!m || m.summary) return
  patchInstant(id, {
    status: 'summary-ready',
    when: `${m.when.split(' · ')[0]} · ${mins} min`,
    summary,
    ...(serverId ? { serverId } : {}),
  })
}

// Turn the finished session into a summary: send the typed notes to the backend
// so Claude produces the real summary + action items; fall back to the local
// notes-only summary if the backend is unreachable.
const processInstant = async (
  id: string,
  seconds: number,
  notes: LiveNote[],
  recorded: boolean,
  audio?: { blob: Blob; mime: string } | null,
): Promise<void> => {
  const m = state.instants.find((x) => x.id === id)
  if (!m || m.summary) return
  const mins = Math.max(1, Math.round(seconds / 60))
  const notesText = notes.map((n) => (n.moment ? `[decision] ${n.text}` : n.text)).join('\n')

  try {
    const created = await api.createMeeting({
      title: m.title,
      type: m.type,
      attendees: m.attendees.map((a) => ({ name: a.name, email: a.email, role: a.role })),
      notes: notesText,
      status: 'processing',
      meetingAt: new Date().toISOString(),
    })
    // Recorded audio → transcribe on the backend (Whisper) then summarize; else
    // the typed notes → Claude. If transcription fails, fall back to the notes.
    let serverSummary: ServerMeetingSummary | null | undefined
    if (audio && audio.blob.size > 0) {
      try {
        const res = await api.transcribeMeeting(created.meeting.id, audio.blob, audio.mime)
        serverSummary = res.meeting.summary
      } catch {
        const res = await api.finalizeMeeting(created.meeting.id)
        serverSummary = res.meeting.summary
      }
    } else {
      const res = await api.finalizeMeeting(created.meeting.id)
      serverSummary = res.meeting.summary
    }
    applyInstantSummary(id, mins, serverToSummary(serverSummary, seconds, notes, recorded || !!audio), created.meeting.id)
  } catch {
    applyInstantSummary(id, mins, localSummary(seconds, notes, recorded))
  }
}

export const deleteInstantMeeting = (id: string) =>
  persist({ ...state, instants: state.instants.filter((m) => m.id !== id) })

/**
 * Email the meeting's notes to the attendees who have an address, and to the
 * user, via the backend (which sends from the user's connected Gmail). Only
 * possible for meetings that synced to the server (have a serverId). Returns the
 * result, or null if it can't send (not synced / offline / Gmail not connected).
 */
export const sendMeetingSummary = async (id: string): Promise<EmailResult | null> => {
  const m = state.instants.find((x) => x.id === id)
  if (!m?.serverId) return null
  try {
    const res = await api.sendMeeting(m.serverId)
    return res.email
  } catch {
    return null
  }
}

// ── Real meetings from the backend (/api/meetings) ──────────────────────────
const MEETING_TYPES: Meeting['type'][] = ['Product', 'Client', 'Internal', 'Sales', 'Partner']
const two = (n: number) => String(n).padStart(2, '0')

const meetingWhen = (iso?: string): { when: string; at: string; day: string; today: boolean } => {
  const d = iso ? new Date(iso) : null
  if (!d || Number.isNaN(d.getTime())) return { when: 'Recently', at: '00:00', day: 'Earlier', today: false }
  const h = d.getHours()
  const m = two(d.getMinutes())
  const ampm = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  const today = d.toDateString() === new Date().toDateString()
  return {
    when: `${h12}:${m} ${ampm}`,
    at: `${two(h)}:${m}`,
    day: today ? 'Today' : d.toLocaleDateString(undefined, { weekday: 'short' }),
    today,
  }
}

const mapServerSummaryFull = (s: ServerMeetingSummary | null | undefined): MeetingSummary | undefined => {
  if (!s) return undefined
  const actions: ActionItem[] = (s.actions ?? []).map((a) => ({
    task: a.task,
    owner: a.owner || '',
    due: a.due || '',
    priority: a.priority === 'High' || a.priority === 'Low' ? a.priority : 'Medium',
  }))
  return {
    overview: s.overview || '',
    discussion: s.discussion ?? [],
    decisions: s.decisions ?? [],
    actions,
    openQuestions: s.openQuestions ?? [],
    followUps: s.followUps ?? [],
    transcript: [],
    recorded: false,
    recording: { duration: '', retention: 'Notes only - no audio was captured.' },
    proposedActions: INSTANT_ACTIONS,
  }
}

const serverToMeeting = (s: ServerMeeting): Meeting => {
  const w = meetingWhen(s.meeting_at)
  const summary = mapServerSummaryFull(s.summary)
  const status: MeetingStatus =
    s.status === 'processing'
      ? 'processing'
      : summary || s.status === 'summary-ready'
        ? 'summary-ready'
        : s.status === 'in-progress'
          ? 'in-progress'
          : 'completed'
  return {
    id: `srv-${s.id}`,
    serverId: s.id,
    title: s.title || 'Meeting',
    when: w.when,
    at: w.at,
    day: w.day,
    today: w.today,
    attendees: (s.attendees ?? []).map((a) => {
      const name = a.name || a.email || 'Someone'
      return {
        name,
        initial: name.trim().charAt(0).toUpperCase() || '?',
        person: true,
        ...(a.email ? { email: a.email } : {}),
      }
    }),
    company: s.company || 'Meeting',
    location: s.location || '',
    virtual: !!s.virtual,
    type: MEETING_TYPES.includes(s.type as Meeting['type']) ? (s.type as Meeting['type']) : 'Internal',
    status,
    tone: 'lavender',
    icon: 'users',
    context: [],
    summary,
  }
}

/** Load the user's real meetings from the backend. Best-effort — keeps the seed on error. */
export const hydrateMeetings = async (): Promise<void> => {
  try {
    const res = await api.meetings()
    serverMeetings = (res.meetings || []).map(serverToMeeting)
    persist({ ...state }) // new state ref → subscribers re-render, allMeetings() recomputes
  } catch {
    /* keep the seed */
  }
}

// Bridges for other stores that derive from meetings (e.g. action items).
export const subscribeMeetings = subscribe
export const meetingsLoaded = () => serverMeetings !== null


export type ActionDecision = 'pending' | 'approved' | 'rejected' | 'saved'

export const actionKey = (meetingId: string, actionId: string) => `${meetingId}:${actionId}`

export const decisionOfAction = (meetingId: string, actionId: string): ActionDecision =>
  state.actions[actionKey(meetingId, actionId)] ?? 'pending'

export const useActionDecision = (meetingId: string, actionId: string): ActionDecision => {
  useMeetingState()
  return decisionOfAction(meetingId, actionId)
}

export const decideAction = (meetingId: string, actionId: string, d: 'approved' | 'rejected' | 'saved') =>
  persist({ ...state, actions: { ...state.actions, [actionKey(meetingId, actionId)]: d } })

export const resetAction = (meetingId: string, actionId: string) => {
  const { [actionKey(meetingId, actionId)]: _gone, ...rest } = state.actions
  persist({ ...state, actions: rest })
}

export const approveAllActions = (meetingId: string, ids: string[]) =>
  persist({
    ...state,
    actions: { ...state.actions, ...Object.fromEntries(ids.map((id) => [actionKey(meetingId, id), 'approved' as const])) },
  })

export const actionDone: Record<ProposedAction['kind'], string> = {
  tasks: 'Tasks created',
  email: 'Email draft prepared',
  meeting: 'Follow-up meeting scheduled',
  whatsapp: 'Summary sent to WhatsApp',
}

export { NOW }
