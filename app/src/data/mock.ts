import type { IconName } from '../app/icons'

export type ChipTone = 'blue' | 'lavender' | 'mint' | 'peach' | 'sand' | 'rose'
export type MetricTone = 'teal' | 'amber' | 'violet'

// Real "now", resolved once at load — so the calendar grid, the agenda "now"
// line and every relative date the app computes are the user's actual today.
const _pad = (n: number) => String(n).padStart(2, '0')
const _now = new Date()
export const TODAY = `${_now.getFullYear()}-${_pad(_now.getMonth() + 1)}-${_pad(_now.getDate())}`
export const NOW = `${_pad(_now.getHours())}:${_pad(_now.getMinutes())}`


export const channel = {
  name: 'WhatsApp',
  online: true,
  number: '+1 202 555 0100',
}


export type Notice = {
  id: string
  tone: ChipTone
  icon: IconName
  title: string
  body: string
  time: string
  unread?: boolean
  approval?: string
}

export const notifications = {
  unread: 3,
  handledQuietly: 12,
  today: [
    {
      id: 'bank',
      tone: 'sand',
      icon: 'mail',
      title: 'Zero Lifestyle replied',
      body: 'The bank confirmation landed. I can forward it to accounts and close this off.',
      time: '9:04',
      unread: true,
      approval: 'bank-forward',
    },
    {
      id: 'sarah',
      tone: 'lavender',
      icon: 'calendar',
      title: 'Sarah asked to move Thursday',
      body: 'She wants 2:00 PM instead of 11:00. Your afternoon is clear either way.',
      time: '8:41',
      unread: true,
      approval: 'sarah-move',
    },
    {
      id: 'delivery',
      tone: 'peach',
      icon: 'box',
      title: 'Your delivery has a window',
      body: 'Thursday, 9:00 AM to 1:00 PM. I put it on your calendar as a hold.',
      time: '8:12',
      unread: true,
    },
  ] as Notice[],
  earlier: [
    {
      id: 'bill',
      tone: 'mint',
      icon: 'receipt',
      title: 'Internet bill paid',
      body: 'AED 42 left your account on time. Nothing needed from you.',
      time: 'Yesterday',
    },
    {
      id: 'fare',
      tone: 'blue',
      icon: 'globe',
      title: 'DXB fares dipped 8%',
      body: "Still above your target, so I'm holding. I'll say the word when it's worth booking.",
      time: 'Yesterday',
    },
    {
      id: 'recap',
      tone: 'mint',
      icon: 'spark',
      title: 'Your evening recap is ready',
      body: 'Three things I handled while you were out, and one for the morning.',
      time: 'Yesterday',
    },
  ] as Notice[],
}


export const profile = {
  name: 'John Doe',
  workspace: 'Personal & business workspace',
  phone: '+92 300 8412 210',
  email: 'aamir@callusrad.com',
  timezone: 'Asia/Karachi',
  workday: '09:00 to 18:00',
  briefing: '7:00 AM',
  wrap: '8:00 PM',
  since: 'With you since July 2026',
}

export const agent = {
  tone: 'Friendly',
  detail: 'Concise',
  proactivity: 'Moderate',
  skills: ['Travel Assistant', 'Bill Tracker', 'Delivery Tracker', 'People CRM', 'Follow-up Tracker'],
}


export type Permission = {
  key: string
  name: string
  desc: string
  tone: ChipTone
  icon: IconName
  on: boolean
}

export const privacy = {
  access: [
    { key: 'email', name: 'Email content', desc: 'So I can triage and draft replies', tone: 'blue', icon: 'mail', on: true },
    { key: 'cal', name: 'Calendar details', desc: 'Titles, guests and locations for prep', tone: 'mint', icon: 'calendar', on: true },
    { key: 'people', name: 'People memory', desc: 'Who you talk to, and what you promised', tone: 'lavender', icon: 'users', on: true },
    { key: 'orders', name: 'Orders & deliveries', desc: 'Receipts and shipping mail only', tone: 'peach', icon: 'box', on: false },
  ] as Permission[],
}

export type AgentAction = {
  key: string
  name: string
  desc: string
  tone: ChipTone
  icon: IconName
  on: boolean
}

export const agentActions = [
  { key: 'draftReplies', name: 'Draft replies for you', desc: 'I write them, you press send', tone: 'blue', icon: 'mail', on: true },
  { key: 'sortInbox', name: 'Sort and label your inbox', desc: 'Move the noise out of the way', tone: 'lavender', icon: 'grid', on: true },
  { key: 'reschedule', name: 'Nudge small meetings', desc: 'Suggest a better time and tell you', tone: 'mint', icon: 'calendar', on: true },
  { key: 'leaveReminders', name: 'Send leave-by reminders', desc: 'When traffic says to go early', tone: 'sand', icon: 'pin', on: true },
  { key: 'payAutopay', name: 'Pay bills on autopay', desc: 'Only the ones you set to automatic', tone: 'peach', icon: 'receipt', on: false },
  { key: 'reorderStock', name: 'Reorder low stock', desc: 'I only ever flag it, never buy on my own', tone: 'rose', icon: 'box', on: false },
] as AgentAction[]

export const AUTONOMY_LEVELS = [
  { value: 'Ask me first', blurb: 'I check with you before I do anything at all.' },
  { value: 'Small things', blurb: 'I handle the low-stakes bits and tell you. Money or people, I ask.' },
  { value: 'Act and update me', blurb: 'I act on most things and keep you posted. Only the big calls wait.' },
]


export type HelpArticle = {
  id: string
  q: string
  tone: ChipTone
  icon: IconName
  body: string[]
  list?: { name: string; desc: string }[]
  ask: string
}

export const help = {
  questions: [
    {
      id: 'briefings',
      q: 'How do morning briefings work?',
      tone: 'peach',
      icon: 'sun',
      body: [
        "Every morning at the time you picked, I read everything that landed overnight and send you one message on WhatsApp. It leads with what needs you today, in the order I'd do it, and ends with what I handled while you were asleep.",
        "It is never a list of everything. If a bill was paid on time, a parcel moved a step or a newsletter arrived, you'll see it counted, not spelled out. The briefing is the shortest true version of your morning.",
        "Reply to it like a person. Ask me to move something, draft a reply, or go quiet until lunch, and it happens in the same thread.",
      ],
      ask: 'About my morning briefing',
    },
    {
      id: 'timing',
      q: 'Change when I message you',
      tone: 'blue',
      icon: 'clock',
      body: [
        'Your briefing time lives in Account, under Morning briefing. Change it there and tomorrow arrives on the new schedule.',
        "Outside the briefing I only start a conversation when something genuinely needs you, and how often that happens is set by proactivity in Agent personality. On Low I hold everything for the briefing unless it is urgent; on High I speak up as things happen.",
        "You can also just tell me. \"Don't message me before 8\" or \"nothing after 7pm\" works, and I'll remember it.",
      ],
      ask: 'Change when you message me',
    },
    {
      id: 'whatsapp',
      q: 'What can I do on WhatsApp?',
      tone: 'mint',
      icon: 'spark',
      body: [
        "Talk to me the way you'd talk to someone who has read all your mail. Ask a question, hand me a job, or tell me a preference and I'll keep it.",
        'Anything that spends money, replies to a person or moves something in your calendar comes back to you as a card to approve first. I never act on those alone.',
      ],
      list: [
        { name: 'Ask', desc: '"What do I owe Sarah?" or "How much is due this month?"' },
        { name: 'Hand over', desc: '"Reply to Bilal and tell him Monday works."' },
        { name: 'Set a watch', desc: '"Tell me if the Dubai fare drops under 1,200."' },
        { name: 'Teach me', desc: '"Never book me before 10 on a Monday."' },
      ],
      ask: 'What can you do for me?',
    },
    {
      id: 'connect',
      q: 'Connect a new service',
      tone: 'lavender',
      icon: 'plus',
      body: [
        'Open More, find the service in Connectors and tap Connect. You sign in with that service, choose what I can read, and I start watching from that moment on. I never reach back into your history without asking.',
        'Everything I can see is listed in Privacy and data, one switch per thing, and turning a switch off stops it immediately. Disconnecting a service removes what I learned from it.',
      ],
      ask: 'Help me connect a service',
    },
  ] as HelpArticle[],
  version: 'Wingman 0.3.1 · build 7 Aug 2026',
}

export const helpArticle = (id: string) => help.questions.find((q) => q.id === id)


export type MemoryNote = {
  id: string
  group: string
  text: string
  source: string
}

export const memory = {
  groups: ['About you', 'How you work', 'People', 'Money and admin'],
  notes: [
    { id: 'm1', group: 'About you', text: "You're up before 6:30 most days.", source: 'Your first replies to me, three weeks running' },
    { id: 'm2', group: 'About you', text: 'You would rather have a call than a long thread.', source: 'You told me this in June' },
    { id: 'm3', group: 'About you', text: 'Karachi is home; Dubai is work.', source: 'Your last four trips' },
    { id: 'm4', group: 'About you', text: 'You read long mail properly, and only in the evening.', source: 'When you open things' },
    { id: 'm5', group: 'How you work', text: 'No meetings before 10:00 on a Monday.', source: 'You told me on 2 June' },
    { id: 'm6', group: 'How you work', text: 'Thursday afternoons are for demos.', source: 'Your calendar, since April' },
    { id: 'm7', group: 'How you work', text: 'You want the briefing at 7:00, before the house is up.', source: 'Set at signup' },
    { id: 'm8', group: 'How you work', text: 'You want to see anything over AED 1,000 before I do it.', source: 'You told me in May' },
    { id: 'm9', group: 'How you work', text: 'Short replies. You cut everything I write down anyway.', source: 'The edits you make to my drafts' },
    { id: 'm10', group: 'People', text: 'Sarah Nadeem leads the Meridian demo.', source: 'Your mail with her' },
    { id: 'm11', group: 'People', text: 'Bilal Ahmed handles anything with a contract in it.', source: 'Your mail with him' },
    { id: 'm12', group: 'People', text: 'Mum calls on Sundays. You always take it.', source: 'Six months of Sundays' },
    { id: 'm13', group: 'People', text: 'Zero Lifestyle is a client, not a supplier.', source: 'You corrected me on 4 July' },
    { id: 'm14', group: 'Money and admin', text: 'Internet and phone are paid automatically. Everything else you see first.', source: 'Set when you connected your bills' },
    { id: 'm15', group: 'Money and admin', text: 'Your target fare to Dubai is AED 1,200.', source: 'You told me on 9 July' },
    { id: 'm16', group: 'Money and admin', text: 'The car insurance renews in August, and you renew rather than switch.', source: 'Last year, and the year before' },
  ] as MemoryNote[],
}


export type ModuleKey = 'bills' | 'deliveries' | 'travel' | 'people' | 'health'

export type BusinessKey = 'commerce' | 'pipeline' | 'traffic'

export type ModuleHead = {
  key: ModuleKey | BusinessKey
  title: string
  tone: ChipTone
  icon: IconName
  value: string
  sub: string
  brief: string
  ask: string
  askText?: string
  unset?: boolean
}

export const moduleHeads = [
  {
    key: 'bills',
    title: 'Bills',
    tone: 'sand',
    icon: 'receipt',
    value: 'One needs you',
    sub: 'Car insurance renews 14 Aug',
    brief: "Nothing is late. I pay the ones you've set to automatic, and the renewal below is the one call I won't make for you.",
    ask: 'your bills',
    askText: 'About my bills',
  },
  {
    key: 'deliveries',
    title: 'Deliveries',
    tone: 'mint',
    icon: 'box',
    value: '1 in transit',
    sub: 'Arrives Thursday',
    brief: "One on the way, one still inside its return window. I'm watching both.",
    ask: 'a delivery',
    askText: 'About my delivery',
  },
  {
    key: 'travel',
    title: 'Travel',
    tone: 'blue',
    icon: 'globe',
    value: 'DXB in 12 days',
    sub: 'Fares steady, still watching',
    brief: "Nothing to book yet. I'm watching the fare and I'll say the word when it's worth it.",
    ask: 'this trip',
    askText: 'About my Dubai trip',
  },
  {
    key: 'people',
    title: 'People',
    tone: 'lavender',
    icon: 'users',
    value: '2 follow-ups',
    sub: 'Sarah, day 8',
    brief: "Two people are waiting on something you said you'd do. I'm holding both for you.",
    ask: 'someone',
    askText: 'About someone I owe a reply',
  },
  {
    key: 'health',
    title: 'Health',
    tone: 'rose',
    icon: 'heart',
    value: 'Get started',
    sub: 'Sleep, recovery, movement',
    brief: "I can't see any of this yet. Here's what I'd do with it once you connect it.",
    ask: 'health',
    unset: true,
  },
] as ModuleHead[]

export const businessHeads = [
  {
    key: 'commerce',
    title: 'Commerce',
    tone: 'peach',
    icon: 'box',
    value: 'AED 18,240 today',
    sub: 'Up 12% on last Tuesday',
    brief: "The store is running fine. Three decisions are waiting on you; I'm handling the rest quietly.",
    ask: 'the store',
    askText: 'About my store',
  },
  {
    key: 'pipeline',
    title: 'Pipeline',
    tone: 'lavender',
    icon: 'users',
    value: 'Get started',
    sub: 'Coming soon',
    brief: "I can't see your deals yet. Here's what I'd do with them once I can.",
    ask: 'your pipeline',
    unset: true,
  },
  {
    key: 'traffic',
    title: 'Traffic',
    tone: 'blue',
    icon: 'globe',
    value: 'Ready to connect',
    sub: 'Google Analytics, one tap',
    brief: "Nothing to read yet. Connect Analytics and I'll start watching where your customers come from.",
    ask: 'your traffic',
    unset: true,
  },
] as ModuleHead[]

export const moduleHead = (key: ModuleKey | BusinessKey) =>
  [...moduleHeads, ...businessHeads].find((m) => m.key === key)!

export type HomeTile = {
  key: string
  title: string
  tone: ChipTone
  icon: IconName
  value: string
  sub: string
}

export const businessTile: HomeTile = {
  key: 'business',
  title: 'Business',
  tone: 'peach',
  icon: 'briefcase',
  value: 'All clear',
  sub: 'Your store, traffic up 18%',
}


export type Bill = {
  name: string
  amount: string
  when: string
  tone: ChipTone
  icon: IconName
  auto?: boolean
  approval?: string
}

export const bills = {
  dueThisMonth: 'AED 1,612',
  paidThisMonth: 'AED 366',
  upcoming: [
    { name: 'Internet', amount: 'AED 42', when: 'Due in 6 days', tone: 'blue', icon: 'globe', auto: true },
    { name: 'Phone', amount: 'AED 120', when: 'Due in 11 days', tone: 'lavender', icon: 'phone', auto: true },
    {
      name: 'Car insurance',
      amount: 'AED 1,450',
      when: 'Renews 14 Aug',
      tone: 'sand',
      icon: 'shield',
      approval: 'car-insurance',
    },
  ] as Bill[],
  paid: [
    { name: 'Electricity', amount: 'AED 310', when: 'Paid 14 Jul', tone: 'peach', icon: 'home' },
    { name: 'Streaming', amount: 'AED 56', when: 'Paid 9 Jul', tone: 'mint', icon: 'grid' },
  ] as Bill[],
}


export const DELIVERY_STEPS = ['Ordered', 'Shipped', 'In transit', 'Delivered']

export type Delivery = {
  item: string
  from: string
  tone: ChipTone
  icon: IconName
  step: number
  when: string
  window?: string
  closed?: boolean
}

export const deliveries = {
  transit: [
    {
      item: 'Sony WH-1000XM5',
      from: 'Amazon.ae',
      tone: 'peach',
      icon: 'truck',
      step: 2,
      when: 'Thursday, 9:00 AM to 1:00 PM',
    },
  ] as Delivery[],
  landed: [
    {
      item: 'Desk lamp',
      from: 'IKEA',
      tone: 'sand',
      icon: 'box',
      step: 3,
      when: 'Delivered 16 Jul',
      window: 'You can still return this for 9 days',
    },
    {
      item: 'Running shoes',
      from: 'Nike',
      tone: 'mint',
      icon: 'box',
      step: 3,
      when: 'Delivered 2 Jul',
      window: 'Return window closed',
      closed: true,
    },
  ] as Delivery[],
}


export type TripLine = {
  name: string
  value: string
  tone: ChipTone
  icon: IconName
  note?: string
  approval?: string
}

export const travel = {
  trip: {
    city: 'Dubai',
    from: 'KHI',
    to: 'DXB',
    dates: '2 to 6 Aug',
    away: '12 days away',
    state: 'Nothing booked yet',
  },
  watching: [
    {
      name: 'Fares',
      value: 'AED 1,310',
      tone: 'blue',
      icon: 'plane',
      note: "Down 8% this week. Your target is AED 1,200, so I'm holding.",
    },
    {
      name: 'Where you stay',
      value: '3 saved',
      tone: 'lavender',
      icon: 'hotel',
      note: "None held yet. Say the word and I'll hold the one near the venue.",
    },
    {
      name: 'Passport',
      value: 'Valid to 2029',
      tone: 'mint',
      icon: 'passport',
      note: 'Visa on arrival for this one. Nothing for you to do.',
    },
  ] as TripLine[],
  before: [
    {
      name: 'Book the flight',
      value: 'Waiting on your target fare',
      tone: 'blue',
      icon: 'plane',
      approval: 'flight-book',
    },
    {
      name: 'Airport pickup',
      value: 'I can arrange it the night before',
      tone: 'peach',
      icon: 'pin',
      approval: 'airport-pickup',
    },
  ] as TripLine[],
}


export type Contact = {
  name: string
  initial: string
  person?: boolean
  tone: ChipTone
  when: string
  context: string
  promise?: string
  approval?: string
}

export const people = {
  waiting: [
    {
      name: 'Sarah Nadeem',
      initial: 'S',
      person: true,
      tone: 'lavender',
      when: 'Day 8',
      context: 'Thursday demo',
      promise: "You said you'd send the final deck",
      approval: 'sarah-reply',
    },
    {
      name: 'Zero Lifestyle',
      initial: 'Z',
      tone: 'sand',
      when: 'Day 3',
      context: 'Bank verification',
      promise: "You said you'd confirm the account details",
      approval: 'zero-details',
    },
  ] as Contact[],
  recent: [
    { name: 'Mum', initial: 'M', person: true, tone: 'peach', when: 'Spoke Sunday', context: 'Asked about a call this weekend' },
    { name: 'Rahul Mehta', initial: 'R', person: true, tone: 'blue', when: '2 weeks ago', context: 'Nothing open' },
  ] as Contact[],
}


export const health = {
  would: [
    { name: 'Sleep', desc: 'A rough night moves your morning, not just your briefing.', tone: 'lavender', icon: 'moon' },
    { name: 'Recovery', desc: "When your HRV dips I'll keep the day as light as I can.", tone: 'rose', icon: 'heart' },
    { name: 'Movement', desc: "A nudge when you've been at the desk since the 9:30.", tone: 'peach', icon: 'activity' },
  ] as { name: string; desc: string; tone: ChipTone; icon: IconName }[],
  promise: "I only read this once you connect it, and you can disconnect it whenever you like, in a single tap.",
}


export const business = {
  store: 'Callus Rad',
  brief: 'One store connected. I read it every hour and only speak up when a number moves enough to matter.',
  commerce: {
    today: [
      { label: 'Orders', value: '86', delta: 'up 9', up: true },
      { label: 'Average order', value: 'AED 212', delta: 'steady' },
      { label: 'Refunds', value: '1.8%', delta: 'below usual', up: true },
    ] as { label: string; value: string; delta: string; up?: boolean }[],
    watching: [
      {
        name: 'Signature Tee',
        value: '38 left',
        tone: 'peach',
        icon: 'box',
        note: 'Nine days of stock at this rate, and your supplier needs fourteen.',
      },
      {
        name: 'Summer bundle',
        value: '4 sold',
        tone: 'mint',
        icon: 'card',
        note: 'Twelve days at AED 280. The same items sell fine on their own.',
      },
      {
        name: 'Abandoned carts',
        value: '34',
        tone: 'lavender',
        icon: 'chat',
        note: 'AED 9,140 left behind in the last two days, all of it in stock.',
      },
    ] as { name: string; value: string; tone: ChipTone; icon: IconName; note: string; approval?: string }[],
    decisions: ['restock-tee', 'bundle-price', 'cart-nudge'],
    quiet: 'I also reconciled 86 orders, filed 12 receipts and answered 9 delivery questions this morning.',
  },
  pipeline: {
    would: [
      { name: 'Stalled deals', desc: 'The ones that have gone quiet, before your quarter does.', tone: 'blue', icon: 'clock' },
      { name: 'Who to chase', desc: "A short list each morning, ranked by what's actually closeable.", tone: 'lavender', icon: 'users' },
      { name: 'Drafted follow-ups', desc: 'Written in your voice, waiting for you to approve or change.', tone: 'mint', icon: 'chat' },
    ] as { name: string; desc: string; tone: ChipTone; icon: IconName }[],
    promise: 'Read-only. I never write to your CRM, I only tell you what it says.',
  },
  traffic: {
    would: [
      { name: 'Where they come from', desc: 'Which channel is carrying you this week, and which one slipped.', tone: 'sand', icon: 'globe' },
      { name: 'What converts', desc: 'The pages doing the work, and the ones taking the traffic and wasting it.', tone: 'mint', icon: 'spark' },
      { name: 'Spend that stopped paying', desc: "An ad set below your target return gets flagged, not paused, until you say so.", tone: 'peach', icon: 'card' },
    ] as { name: string; desc: string; tone: ChipTone; icon: IconName }[],
    promise: 'I read your Analytics. I never touch your ad accounts without a card you approve.',
  },
}


export const businessCenter = {
  summary:
    "You have three business meetings today. Two need preparation, one client follow-up is overdue, and website traffic is up 18% this week.",
  cards: [
    { key: 'meetings', label: 'Meetings', value: '3 today', sub: 'Two need prep', tone: 'lavender', icon: 'calendar', route: 'meetings' },
    { key: 'prep', label: 'To prep', value: '2 meetings', sub: 'One brief ready', tone: 'blue', icon: 'spark', route: 'meetings' },
    { key: 'followups', label: 'Follow-ups', value: '4 active', sub: 'One overdue', tone: 'sand', icon: 'clock', route: 'people' },
    { key: 'tasks', label: 'Tasks', value: '7 open', sub: 'From meetings and mail', tone: 'mint', icon: 'task', route: 'tasks' },
    { key: 'approvals', label: 'Approvals', value: '3 waiting', sub: 'Price, restock, carts', tone: 'peach', icon: 'checkCircle', route: 'approvals' },
    { key: 'performance', label: 'Store', value: 'Up 18%', sub: 'Traffic vs last week', tone: 'blue', icon: 'globe', route: 'business/performance' },
  ] as { key: string; label: string; value: string; sub: string; tone: ChipTone; icon: IconName; route: string }[],
  completed: { title: 'Design Partner Sync', sub: 'Summary ready · 4 action items', meeting: 'design-sync' },
  insight: {
    tag: 'Business insight',
    title: 'Traffic is up, conversion slipped',
    body: "Website traffic increased after Tuesday's campaign, but conversion is slightly lower. You also have two product meetings today. I can prepare briefs and assist with both.",
    cta: 'Ask about this week',
  },
  performance: {
    period: 'This week vs last',
    metrics: [
      { label: 'Visitors', value: '12,480', delta: 'up 18%', up: true },
      { label: 'New leads', value: '42', delta: 'up 6', up: true },
      { label: 'Orders', value: '86', delta: 'up 9', up: true },
      { label: 'Revenue', value: 'AED 8,720', delta: 'up 11%', up: true },
      { label: 'Conversion', value: '3.4%', delta: 'down 0.3pt' },
    ] as { label: string; value: string; delta: string; up?: boolean }[],
    read: 'Traffic increased this week, but most visitors are leaving before they reach the pricing page.',
    actions: ['View details', 'Ask Wingman', "Add to Today's Snapshot", 'Create follow-up task', 'Save insight'],
  },
  sync: {
    gcal: 'Synced 4 min ago',
    gmail: 'Synced 6 min ago',
    shopify: 'Synced 12 min ago',
    ga: 'Not connected',
    crm: 'Coming soon',
  } as Record<string, string>,
  integrations: ['gcal', 'gmail', 'shopify', 'ga', 'crm'],
}


export type BrainFact = {
  id: string
  name: string
  value: string
  source: string
  tone: ChipTone
  icon: IconName
  hint?: string
}

export const brain = {
  brief: 'These are the rules I check every recommendation against. Change one and I use the new number from the next card on.',
  facts: [
    { id: 'margin', name: 'Margin floor', value: '38%', source: 'You told me at setup', tone: 'mint', icon: 'card', hint: 'I refuse any price that breaks this.' },
    { id: 'price', name: 'Never price below', value: 'AED 210', source: 'The three times you overruled me in June', tone: 'peach', icon: 'receipt' },
    { id: 'lead', name: 'Restock lead time', value: '14 days', source: "Your supplier's last four orders", tone: 'blue', icon: 'truck' },
    { id: 'roas', name: 'Target return on ad spend', value: '3.2x', source: 'You set this in May', tone: 'lavender', icon: 'globe' },
    { id: 'goal', name: 'Monthly revenue goal', value: 'AED 240,000', source: 'Your July plan', tone: 'sand', icon: 'spark' },
    { id: 'season', name: 'Busy season', value: 'October to January', source: 'Two years of your own numbers', tone: 'mint', icon: 'calendar' },
  ] as BrainFact[],
}


export type HomeMetric = {
  key: string
  tone: MetricTone
  icon: IconName
  label: string
  value: string
  unit: string
  fill: number
}

export const home = {
  date: 'Tue, 21 Jul',
  handled: 26,
  total: 51,
  metrics: [
    { key: 'email', tone: 'teal', icon: 'mail', label: 'Email', value: '8', unit: 'to reply', fill: 0.69 },
    { key: 'cal', tone: 'amber', icon: 'calendar', label: 'Calendar', value: '6', unit: 'today', fill: 0.33 },
    { key: 'tasks', tone: 'violet', icon: 'task', label: 'Tasks', value: '17', unit: 'open', fill: 0.32 },
  ] as HomeMetric[],
  focus: {
    tag: 'Focus',
    title: 'Chase the bank reply first',
    body: 'Your 10:00 depends on it. The rest of the day is yours.',
    item: {
      tone: 'blue' as ChipTone,
      icon: 'mail' as IconName,
      title: 'Bank · Zero Lifestyle',
      sub: 'Reply before noon',
    },
    cta: 'Ask Wingman about this',
  },
  watching: [...moduleHeads, businessTile] as HomeTile[],
}


export type CalEvent = {
  time: string
  dur: string
  title: string
  sub: string
  tone: ChipTone
  icon: IconName
  avatars?: string[]
  flag?: string
  prep?: string
  place?: string
}

export type CalDay = {
  brief?: { title: string; body: string }
  events: CalEvent[]
}

const MORNING_BRIEF: CalEvent = {
  time: '08:30',
  dur: '2 min',
  title: 'Morning brief',
  sub: 'Wingman · your day in 2 min',
  tone: 'mint',
  icon: 'spark',
}
const STANDUP: CalEvent = {
  time: '09:30',
  dur: '15 min',
  title: 'Team standup',
  sub: 'Design sync · Google Meet',
  tone: 'blue',
  icon: 'users',
  avatars: ['A', 'S', 'R', '+2'],
}
const GYM: CalEvent = {
  time: '18:30',
  dur: '1 hr',
  title: 'Gym',
  sub: 'Strength · evening slot',
  tone: 'rose',
  icon: 'heart',
}
const WEEK_WRAP: CalEvent = {
  time: '16:30',
  dur: '30 min',
  title: 'Week wrap',
  sub: 'What moved, what did not',
  tone: 'sand',
  icon: 'task',
}

export const calendarDays: Record<string, CalDay> = {
  '2026-06-03': {
    events: [STANDUP, { time: '14:00', dur: '1 hr', title: 'Quarter kickoff', sub: 'Goals for Q3', tone: 'blue', icon: 'task' }],
  },
  '2026-06-08': {
    events: [
      STANDUP,
      { time: '11:00', dur: '45 min', title: 'Store health review', sub: 'Shopify · June numbers', tone: 'peach', icon: 'box' },
    ],
  },
  '2026-06-11': {
    events: [
      STANDUP,
      { time: '15:00', dur: '30 min', title: 'Accountant call', sub: 'Year-end paperwork', tone: 'sand', icon: 'receipt' },
      GYM,
    ],
  },
  '2026-06-15': {
    events: [
      STANDUP,
      { time: '13:00', dur: '1 hr', title: 'Lunch with Omar', sub: 'Catch-up, long overdue', tone: 'lavender', icon: 'users' },
    ],
  },
  '2026-06-17': {
    events: [
      STANDUP,
      { time: '11:30', dur: '45 min', title: 'Website copy pass', sub: 'Landing page rewrite', tone: 'blue', icon: 'task' },
    ],
  },
  '2026-06-19': {
    events: [STANDUP, WEEK_WRAP],
  },

  '2026-06-22': {
    brief: { title: 'A planning-heavy Monday', body: "Two long sessions back to back. I've held your afternoon clear." },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr 30 min', title: 'Quarter planning', sub: 'Whole team · offsite room', tone: 'blue', icon: 'task', avatars: ['A', 'S', 'R', '+4'] },
      { time: '16:00', dur: '45 min', title: 'Invoice run', sub: 'June billing · 9 clients', tone: 'sand', icon: 'receipt' },
    ],
  },
  '2026-06-23': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:00', dur: '30 min', title: '1:1 with Rai', sub: 'Weekly · his agenda', tone: 'lavender', icon: 'user', avatars: ['R'] },
      GYM,
    ],
  },
  '2026-06-24': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '15:30', dur: '30 min', title: 'Call · Zero Lifestyle', sub: 'First conversation about the account', tone: 'sand', icon: 'phone' },
    ],
  },
  '2026-06-25': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:30', dur: '1 hr', title: 'Design review', sub: 'Three flows, one call', tone: 'blue', icon: 'grid', avatars: ['A', 'S', '+2'] },
      GYM,
    ],
  },
  '2026-06-26': {
    events: [MORNING_BRIEF, STANDUP, WEEK_WRAP],
  },
  '2026-06-27': {
    events: [
      { time: '10:00', dur: '1 hr', title: 'Farmers market', sub: 'Weekend run', tone: 'mint', icon: 'sun' },
      GYM,
    ],
  },
  '2026-06-28': { events: [] },

  '2026-06-29': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr', title: 'Shopify store audit', sub: 'Listings, stock, shipping rules', tone: 'peach', icon: 'box' },
      { time: '17:00', dur: '45 min', title: 'Dentist', sub: 'Six-month check', tone: 'rose', icon: 'heart' },
    ],
  },
  '2026-06-30': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:00', dur: '1 hr', title: 'Board update draft', sub: 'Numbers and the one risk', tone: 'sand', icon: 'task' },
      GYM,
    ],
  },
  '2026-07-01': {
    brief: { title: 'New month, clean slate', body: "I've pulled June's numbers into your board draft already." },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '10:00', dur: '45 min', title: 'July kickoff', sub: 'What we are shipping this month', tone: 'blue', icon: 'spark', avatars: ['A', 'S', 'R', '+3'] },
      { time: '15:00', dur: '30 min', title: 'Bank paperwork', sub: 'Zero Lifestyle · forms to sign', tone: 'sand', icon: 'receipt' },
    ],
  },
  '2026-07-02': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '13:00', dur: '45 min', title: 'Client intro · Meridian', sub: 'First call, no deck needed', tone: 'blue', icon: 'phone' },
      GYM,
    ],
  },
  '2026-07-03': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '15:00', dur: '30 min', title: 'Payroll sign-off', sub: 'June · needs your approval', tone: 'sand', icon: 'receipt', flag: 'Approve' },
    ],
  },
  '2026-07-04': {
    events: [{ time: '11:00', dur: '1 hr', title: 'Coffee with Omar', sub: 'He is asking about the new role', tone: 'lavender', icon: 'users' }],
  },
  '2026-07-05': { events: [] },

  '2026-07-06': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr', title: 'Roadmap review', sub: 'Cut two things, keep one', tone: 'blue', icon: 'task', avatars: ['A', 'S', '+3'] },
      { time: '16:00', dur: '30 min', title: 'Meridian follow-up', sub: 'What they need to see next', tone: 'blue', icon: 'phone' },
    ],
  },
  '2026-07-07': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:00', dur: '1 hr', title: 'Deck kickoff with Sarah', sub: 'Structure before slides', tone: 'lavender', icon: 'users', avatars: ['S'] },
      GYM,
    ],
  },
  '2026-07-08': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr', title: 'Analytics deep dive', sub: 'Where the traffic actually goes', tone: 'sand', icon: 'globe' },
    ],
  },
  '2026-07-09': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '13:00', dur: '1 hr', title: 'Demo dry-run 1', sub: 'Rough pass, no polish', tone: 'blue', icon: 'task', avatars: ['A', 'S'] },
      GYM,
    ],
  },
  '2026-07-10': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      WEEK_WRAP,
      { time: '17:30', dur: '30 min', title: 'Dubai fare check', sub: 'Shortlist for the August trip', tone: 'blue', icon: 'plane' },
    ],
  },
  '2026-07-11': {
    events: [
      { time: '09:00', dur: '1 hr', title: 'Gym', sub: 'Weekend session', tone: 'rose', icon: 'heart' },
      { time: '20:00', dur: '2 hr', title: 'Dinner with the Khans', sub: 'Their place', tone: 'lavender', icon: 'users' },
    ],
  },
  '2026-07-12': { events: [] },

  '2026-07-13': {
    brief: { title: 'The bank account lands today', body: 'Zero Lifestyle confirmed this morning. I will watch for the paperwork.' },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '30 min', title: 'Zero Lifestyle · account opened', sub: 'Confirmation call', tone: 'sand', icon: 'phone' },
      { time: '15:00', dur: '45 min', title: 'Supplier call', sub: 'August restock quantities', tone: 'peach', icon: 'box' },
    ],
  },
  '2026-07-14': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:00', dur: '1 hr', title: 'Deck v2 with Sarah', sub: 'Story is right, visuals are not', tone: 'lavender', icon: 'users', avatars: ['S'] },
      GYM,
    ],
  },
  '2026-07-15': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '13:00', dur: '1 hr', title: 'Team lunch', sub: 'Nobody talks about work', tone: 'mint', icon: 'users', avatars: ['A', 'S', 'R', '+4'] },
      { time: '16:00', dur: '45 min', title: 'Q3 numbers', sub: 'Halfway checkpoint', tone: 'sand', icon: 'task' },
    ],
  },
  '2026-07-16': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '13:00', dur: '1 hr', title: 'Demo dry-run 2', sub: 'Timed, start to finish', tone: 'blue', icon: 'task', avatars: ['A', 'S'] },
      GYM,
    ],
  },
  '2026-07-17': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:30', dur: '30 min', title: 'Zero Lifestyle · verification', sub: 'They need one more document', tone: 'sand', icon: 'shield', flag: 'Blocked' },
      WEEK_WRAP,
    ],
  },
  '2026-07-18': {
    events: [{ time: '09:00', dur: '1 hr', title: 'Gym', sub: 'Weekend session', tone: 'rose', icon: 'heart' }],
  },
  '2026-07-19': {
    events: [{ time: '17:00', dur: '30 min', title: 'Call Mum', sub: 'Sunday, like always', tone: 'peach', icon: 'phone' }],
  },

  '2026-07-20': {
    brief: { title: 'Demo week starts here', body: 'I have blocked prep time each morning so Thursday is not a scramble.' },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr', title: 'Demo prep kickoff', sub: 'Who says what, in what order', tone: 'blue', icon: 'task', avatars: ['A', 'S'] },
      { time: '16:00', dur: '20 min', title: 'Chased the bank', sub: 'Zero Lifestyle · no reply yet', tone: 'sand', icon: 'phone' },
    ],
  },
  '2026-07-21': {
    brief: {
      title: "You're clear till 11:00",
      body: "I've prepped your demo notes. The Zero Lifestyle call needs a bank reply first.",
    },
    events: [
      { time: '08:30', dur: '2 min', title: 'Morning brief', sub: 'Wingman · your day in 2 min', tone: 'mint', icon: 'spark' },
      { time: '09:30', dur: '15 min', title: 'Team standup', sub: 'Design sync · Google Meet', tone: 'blue', icon: 'users', avatars: ['A', 'S', 'R', '+2'] },
      { time: '11:00', dur: '45 min', title: 'Demo prep', sub: 'Client walkthrough dry-run', tone: 'blue', icon: 'task', prep: 'Talking points ready' },
      { time: '13:00', dur: '1 hr', title: 'Lunch with Sarah', sub: 'Follow-up · day 8 · Clifton', tone: 'lavender', icon: 'users', avatars: ['S'], place: 'Clifton' },
      { time: '15:00', dur: '20 min', title: 'Call · Zero Lifestyle', sub: 'Bank account query', tone: 'sand', icon: 'phone', flag: 'Reply first' },
      { time: '18:30', dur: '1 hr', title: 'Gym', sub: 'Strength · moved from Friday', tone: 'rose', icon: 'heart' },
    ],
  },
  '2026-07-22': {
    brief: { title: 'Deck freezes today', body: 'After 14:00 nothing changes in the deck. I will lock it and send Sarah the final.' },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:00', dur: '1 hr', title: 'Deck freeze with Sarah', sub: 'Final pass before Thursday', tone: 'lavender', icon: 'users', avatars: ['S'] },
      { time: '16:00', dur: '15 min', title: 'Confirm delivery window', sub: 'Courier · Thursday morning', tone: 'peach', icon: 'box', flag: 'Confirm' },
    ],
  },
  '2026-07-23': {
    brief: { title: 'The big one', body: 'Demo at 14:00. Your notes, the deck and the backup recording are all in place.' },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '12:00', dur: '30 min', title: 'Delivery arrives', sub: 'Courier · 12:00 to 12:30', tone: 'peach', icon: 'box' },
      { time: '14:00', dur: '1 hr', title: 'Client demo · Meridian', sub: 'The one we have been building to', tone: 'blue', icon: 'spark', avatars: ['A', 'S', 'R', '+3'], prep: 'Deck, notes and backup ready' },
      GYM,
    ],
  },
  '2026-07-24': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '45 min', title: 'Demo debrief', sub: 'What landed, what did not', tone: 'blue', icon: 'task', avatars: ['A', 'S'] },
      WEEK_WRAP,
    ],
  },
  '2026-07-25': {
    events: [
      { time: '09:00', dur: '1 hr', title: 'Gym', sub: 'Weekend session', tone: 'rose', icon: 'heart' },
      { time: '13:00', dur: '2 hr', title: "Zainab's birthday lunch", sub: 'Gift is already ordered', tone: 'rose', icon: 'heart' },
    ],
  },
  '2026-07-26': { events: [] },

  '2026-07-27': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '09:00', dur: '5 min', title: 'Internet bill due', sub: 'Auto-pay · nothing to do', tone: 'sand', icon: 'receipt' },
      { time: '15:00', dur: '1 hr', title: 'Meridian contract review', sub: 'Legal sent redlines', tone: 'blue', icon: 'shield', flag: 'Read first' },
    ],
  },
  '2026-07-28': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '14:00', dur: '45 min', title: 'Next steps with Sarah', sub: 'Post-demo plan', tone: 'lavender', icon: 'users', avatars: ['S'] },
      GYM,
    ],
  },
  '2026-07-29': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr', title: 'Shopify restock plan', sub: 'August stock, ordered early', tone: 'peach', icon: 'box' },
    ],
  },
  '2026-07-30': {
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '15:00', dur: '1 hr', title: 'Month-end close', sub: 'Books, invoices, receipts', tone: 'sand', icon: 'receipt' },
      GYM,
    ],
  },
  '2026-07-31': {
    brief: { title: 'Last day of the month', body: 'Everything for July is closed. August planning is the only thing left.' },
    events: [
      MORNING_BRIEF,
      STANDUP,
      { time: '11:00', dur: '1 hr', title: 'August planning', sub: 'Light month, the trip eats a week', tone: 'blue', icon: 'task' },
      WEEK_WRAP,
    ],
  },
  '2026-08-01': {
    events: [{ time: '11:00', dur: '1 hr', title: 'Pack for Dubai', sub: 'Checklist is in your tasks', tone: 'blue', icon: 'task' }],
  },
  '2026-08-02': {
    brief: { title: 'Dubai day', body: 'Check-in is open, your boarding pass is in the wallet, car is booked at the other end.' },
    events: [
      { time: '08:00', dur: '3 hr', title: 'Flight to DXB', sub: 'EK 615 · seat 14A', tone: 'blue', icon: 'plane' },
      { time: '14:00', dur: '30 min', title: 'Hotel check-in', sub: 'Downtown · booked and paid', tone: 'sand', icon: 'home' },
    ],
  },

  '2026-08-04': {
    events: [
      { time: '10:00', dur: '3 hr', title: 'Meetings in DXB', sub: 'Three back to back', tone: 'blue', icon: 'users' },
      { time: '20:00', dur: '2 hr', title: 'Client dinner', sub: 'Their invitation', tone: 'lavender', icon: 'users' },
    ],
  },
  '2026-08-06': {
    events: [{ time: '16:00', dur: '3 hr', title: 'Flight home', sub: 'EK 614 · seat 9C', tone: 'blue', icon: 'plane' }],
  },
  '2026-08-10': {
    events: [STANDUP, { time: '11:00', dur: '45 min', title: 'Back to it', sub: 'What moved while you were away', tone: 'sand', icon: 'task' }],
  },
  '2026-08-13': {
    events: [STANDUP, { time: '14:00', dur: '1 hr', title: 'Meridian kickoff', sub: 'If the contract lands', tone: 'blue', icon: 'spark' }],
  },
  '2026-08-18': {
    events: [STANDUP, { time: '15:00', dur: '30 min', title: 'Supplier check-in', sub: 'Autumn stock', tone: 'peach', icon: 'box' }],
  },
  '2026-08-20': {
    events: [STANDUP, { time: '11:00', dur: '1 hr', title: 'Design review', sub: 'Whatever is ready', tone: 'blue', icon: 'grid' }],
  },
  '2026-08-25': {
    events: [STANDUP, { time: '13:00', dur: '1 hr', title: 'Lunch with Sarah', sub: 'Monthly, in the diary', tone: 'lavender', icon: 'users', avatars: ['S'] }],
  },
  '2026-08-27': {
    events: [STANDUP, { time: '15:00', dur: '1 hr', title: 'Month-end close', sub: 'Books, invoices, receipts', tone: 'sand', icon: 'receipt' }],
  },
}


export type EmailItem = {
  from: string
  initial: string
  person?: boolean
  tone: ChipTone
  subject: string
  preview: string
  time: string
  unread?: boolean
  approval?: string
  note?: string
}

export const email = {
  handledToday: 18,
  needsReply: [
    {
      from: 'Sarah Nadeem',
      person: true,
      initial: 'S',
      tone: 'lavender',
      subject: 'Thursday demo, final deck',
      preview: 'Can you confirm the 2pm slot still works on your end?',
      time: '9:12',
      unread: true,
      approval: 'sarah-reply',
    },
    {
      from: 'Zero Lifestyle',
      initial: 'Z',
      tone: 'sand',
      subject: 'Bank confirmation, as promised',
      preview: 'The confirmation letter came through this morning, attached here.',
      time: '9:04',
      unread: true,
      approval: 'bank-forward',
    },
    {
      from: 'Zero Lifestyle',
      initial: 'Z',
      tone: 'sand',
      subject: 'Account verification needed',
      preview: 'We need a quick confirmation before we can release the transfer.',
      time: '8:40',
      unread: true,
      approval: 'zero-details',
    },
    {
      from: 'Bilal Ahmed',
      person: true,
      initial: 'B',
      tone: 'blue',
      subject: 'Meridian contract redlines',
      preview: 'Two clauses our legal team wants to talk through before Monday.',
      time: '8:05',
      unread: true,
      approval: 'bilal-reply',
    },
    {
      from: 'Hina Qureshi',
      person: true,
      initial: 'H',
      tone: 'peach',
      subject: 'Invoice 2214 is overdue',
      preview: 'Just a nudge on last month, it is now 14 days past due.',
      time: 'Yesterday',
      approval: 'hina-invoice',
    },
    {
      from: 'Mum',
      person: true,
      initial: 'M',
      tone: 'peach',
      subject: 'Call this weekend?',
      preview: 'Are you free Sunday afternoon for a quick call?',
      time: 'Yesterday',
    },
    {
      from: 'Rai Kamal',
      person: true,
      initial: 'R',
      tone: 'blue',
      subject: 'Can we move standup to 09:45?',
      preview: 'School run has shifted, 09:30 is tight for me every morning now.',
      time: 'Yesterday',
      approval: 'standup-move',
    },
    {
      from: 'Daniyal Sheikh',
      person: true,
      initial: 'D',
      tone: 'sand',
      subject: 'August restock quote',
      preview: 'Prices hold if we place the order before the end of July.',
      time: 'Mon',
    },
    {
      from: 'Zainab',
      person: true,
      initial: 'Z',
      tone: 'lavender',
      subject: 'Lunch on Saturday',
      preview: 'Table is booked for 1pm, let me know if that still suits.',
      time: 'Mon',
      approval: 'lunch-sat',
    },
  ] as EmailItem[],
  handled: [
    {
      from: 'Courier',
      initial: 'C',
      tone: 'peach',
      subject: 'Your parcel is on its way',
      preview: 'Out for delivery Thursday between 12:00 and 12:30.',
      time: '9:40',
      note: 'Tracked it, and put the window in your calendar',
    },
    {
      from: 'Stripe',
      initial: 'S',
      tone: 'sand',
      subject: 'Payment received',
      preview: 'You received a payment of £2,400.00.',
      time: '9:05',
      note: 'Filed with your receipts',
    },
    {
      from: 'Google Calendar',
      initial: 'G',
      tone: 'blue',
      subject: 'Invitation: design review',
      preview: 'Thursday 20 August, 11:00 to 12:00.',
      time: '8:55',
      note: 'Accepted, your morning was free',
    },
    {
      from: 'Namecheap',
      initial: 'N',
      tone: 'sand',
      subject: 'Domain renewal',
      preview: 'wingman.app renews automatically in 30 days.',
      time: '8:30',
      note: 'Renewed on the card you keep for this',
    },
    {
      from: 'Talent Partners',
      initial: 'T',
      tone: 'lavender',
      subject: 'A role I think you would like',
      preview: 'Head of Product at a Series B, fully remote.',
      time: '8:12',
      note: 'Sent your usual polite no',
    },
    {
      from: 'Design Weekly',
      initial: 'D',
      tone: 'mint',
      subject: 'Issue 214',
      preview: 'Five interfaces worth stealing from this week.',
      time: '7:50',
      note: 'Saved to read on the flight',
    },
    {
      from: 'HSBC',
      initial: 'H',
      tone: 'sand',
      subject: 'Your June statement',
      preview: 'Your statement is ready to view.',
      time: '7:30',
      note: 'Filed, nothing unusual in it',
    },
    {
      from: 'Team offsite poll',
      initial: 'T',
      tone: 'blue',
      subject: 'Pick a date for September',
      preview: 'Three options, closing Friday.',
      time: 'Yesterday',
      note: 'Voted for the only week you are free',
    },
    {
      from: 'Meridian',
      initial: 'M',
      tone: 'blue',
      subject: 'Thanks for the intro call',
      preview: 'Really enjoyed it, looking forward to Thursday.',
      time: 'Yesterday',
      note: 'Replied with a short thank you',
    },
    {
      from: 'Adobe',
      initial: 'A',
      tone: 'peach',
      subject: 'Your plan renews soon',
      preview: 'Creative Cloud renews on 3 August.',
      time: 'Yesterday',
      note: 'Noted, I will remind you two days before',
    },
    {
      from: 'Standup notes',
      initial: 'S',
      tone: 'mint',
      subject: 'Monday standup summary',
      preview: 'Three updates, one blocker on the bank account.',
      time: 'Mon',
      note: 'Summarised, and the blocker is now a task',
    },
    {
      from: 'Prize Draw',
      initial: 'P',
      tone: 'sand',
      subject: 'You have won',
      preview: 'Claim your reward within 24 hours.',
      time: 'Mon',
      note: 'Blocked, it was not a real sender',
    },
  ] as EmailItem[],
}


export type TaskItem = {
  title: string
  due: string
  tone: ChipTone
  icon: IconName
  source?: string
  done?: boolean
}

export type TaskGroup = {
  title: string
  items: TaskItem[]
}

export const tasks = {
  groups: [
    {
      title: 'Today',
      items: [
        { title: 'Send Zero Lifestyle bank reply', due: 'Before noon', tone: 'sand', icon: 'mail', source: 'Email' },
        { title: 'Finish demo talking points', due: 'Today', tone: 'blue', icon: 'task', source: 'Calendar' },
        { title: 'Approve the June payroll run', due: 'Today', tone: 'sand', icon: 'receipt', source: 'Email' },
        { title: 'Reply to Hina about invoice 2214', due: '5pm', tone: 'peach', icon: 'mail', source: 'Email' },
        { title: 'Follow up with Sarah', due: 'Day 8', tone: 'lavender', icon: 'users', source: 'People' },
        { title: 'Read the Meridian redlines', due: 'Tonight', tone: 'blue', icon: 'shield', source: 'Email' },
      ],
    },
    {
      title: 'This week',
      items: [
        { title: 'Confirm Thursday delivery window', due: 'Tomorrow', tone: 'peach', icon: 'box', source: 'Deliveries' },
        { title: 'Lock the demo deck with Sarah', due: 'Wed', tone: 'lavender', icon: 'grid', source: 'Calendar' },
        { title: 'Send Daniyal the restock order', due: 'Wed', tone: 'peach', icon: 'box', source: 'Email' },
        { title: 'Move standup to 09:45', due: 'Thu', tone: 'blue', icon: 'clock', source: 'Email' },
        { title: 'Write the demo debrief note', due: 'Fri', tone: 'blue', icon: 'task', source: 'Calendar' },
        { title: 'Reply to Mum about Sunday', due: 'Fri', tone: 'peach', icon: 'phone', source: 'People' },
      ],
    },
    {
      title: 'Later',
      items: [
        { title: 'Pack for Dubai', due: '1 Aug', tone: 'blue', icon: 'plane', source: 'Travel' },
        { title: 'Check in for EK 615', due: '1 Aug', tone: 'blue', icon: 'globe', source: 'Travel' },
        { title: 'Decide on the Adobe renewal', due: '3 Aug', tone: 'sand', icon: 'receipt', source: 'Bills' },
        { title: 'Book the September offsite', due: '10 Aug', tone: 'mint', icon: 'users', source: 'Calendar' },
        { title: 'Renew the car insurance', due: '20 Aug', tone: 'sand', icon: 'shield', source: 'Bills' },
      ],
    },
  ] as TaskGroup[],
  done: [
    { title: 'Pay internet bill', due: 'Done', tone: 'mint', icon: 'receipt', done: true },
    { title: 'Set DXB fare alert', due: 'Done', tone: 'blue', icon: 'globe', done: true },
    { title: "Order Zainab's birthday gift", due: 'Done', tone: 'peach', icon: 'box', done: true },
    { title: 'Book the Dubai hotel', due: 'Done', tone: 'blue', icon: 'home', done: true },
    { title: 'Accept the design review invite', due: 'Done', tone: 'lavender', icon: 'calendar', done: true },
    { title: 'File the June statement', due: 'Done', tone: 'sand', icon: 'receipt', done: true },
    { title: 'Vote in the offsite poll', due: 'Done', tone: 'mint', icon: 'users', done: true },
    { title: 'Renew the wingman.app domain', due: 'Done', tone: 'blue', icon: 'globe', done: true },
  ] as TaskItem[],
}


export type ConnectorStatus = 'connected' | 'connect' | 'soon'

export type Connector = {
  key: string
  name: string
  desc: string
  tone: ChipTone
  icon: IconName
  status: ConnectorStatus
  reads: string[]
  never: string
}

export const connectors = [
  {
    key: 'whatsapp',
    name: 'WhatsApp',
    desc: "Your agent's main channel",
    tone: 'mint',
    icon: 'chat',
    status: 'connected',
    reads: ['Messages in our chat, and nothing from your other conversations'],
    never: "I'll never message anyone from your number without showing you the message first.",
  },
  {
    key: 'gmail',
    name: 'Gmail',
    desc: 'Triage and draft replies',
    tone: 'lavender',
    icon: 'mail',
    status: 'connected',
    reads: ['Who a mail is from, its subject and its body', 'Attachments, when one is what the mail is about', 'When you replied, so I know what is still open'],
    never: "I'll never send, archive or delete a mail until you've said yes to it.",
  },
  {
    key: 'gcal',
    name: 'Google Calendar',
    desc: 'Meetings and prep',
    tone: 'blue',
    icon: 'calendar',
    status: 'connected',
    reads: ['Event titles, times and locations', 'Who else is invited', 'Whether you accepted'],
    never: "I'll never create, move or decline anything on your calendar without asking.",
  },
  {
    key: 'shopify',
    name: 'Shopify',
    desc: 'Orders and store health',
    tone: 'peach',
    icon: 'box',
    status: 'connected',
    reads: ['Orders, their value and their status', 'Stock levels and what is running low', 'Refunds and chargebacks'],
    never: "I'll never change a price, refund an order or touch stock on my own.",
  },
  {
    key: 'ga',
    name: 'Google Analytics',
    desc: 'Traffic and conversions',
    tone: 'sand',
    icon: 'globe',
    status: 'connect',
    reads: ['Sessions, where they came from and what they did', 'Conversion and checkout drop-off', 'Which campaigns brought them'],
    never: "I only read from Analytics. There is nothing here I can change.",
  },
  {
    key: 'health',
    name: 'Apple Health & Google Fit',
    desc: 'Sleep, recovery and movement',
    tone: 'rose',
    icon: 'heart',
    status: 'connect',
    reads: ['Last night’s sleep and how steady your nights are', 'Resting heart rate and HRV, as a recovery read', 'Steps and how long you’ve been sitting'],
    never: "I read this to shape your day, never to score you. I keep it out of anything I send on your behalf.",
  },
  {
    key: 'crm',
    name: 'HubSpot CRM',
    desc: 'Deals and contacts',
    tone: 'blue',
    icon: 'users',
    status: 'soon',
    reads: ['Deals, their stage and their value', 'Contacts and the last time you spoke'],
    never: "I'll never move a deal or mail a contact without your say-so.",
  },
] as Connector[]

