import { useSyncExternalStore } from 'react'
import { NOW, type ChipTone } from './mock'
import type { IconName } from '../app/icons'

export type ApprovalState = 'pending' | 'approved' | 'edited' | 'executed' | 'dismissed' | 'failed'

export type ApprovalSource = 'email' | 'calendar' | 'bills' | 'travel' | 'people' | 'commerce'

export type Approval = {
  id: string
  source: ApprovalSource
  tone: ChipTone
  icon: IconName
  cta: string
  title: string
  why: string
  facts: { label: string; value: string }[]
  edit?: {
    label: string
    value: string
    long?: boolean
    hint?: string
  }
  approveLabel: string
  executed: string
  worth?: string
  fails?: string
  raised: string
  seed?: Decision
}

export type Decision = {
  state: ApprovalState
  at: string
  note?: string
  value?: string
}


export const approvals: Approval[] = [
  {
    id: 'bank-forward',
    source: 'email',
    tone: 'sand',
    icon: 'mail',
    cta: 'Review my forward',
    title: 'Forward the bank confirmation to accounts',
    why: "Zero Lifestyle sent the confirmation you've been waiting on since Friday. Accounts needs it before they can release the transfer, and nothing else is holding it up.",
    facts: [
      { label: 'To', value: 'accounts@callusrad.com' },
      { label: 'Attached', value: 'Confirmation from Zero Lifestyle' },
      { label: 'Sends', value: 'As soon as you say' },
    ],
    edit: {
      label: 'Your note on it',
      value: 'Confirmation attached. Please release the transfer today.',
      long: true,
      hint: 'I send this above the forwarded mail.',
    },
    approveLabel: 'Send it',
    executed: "Sent to accounts. I'll tell you the moment they release it.",
    worth: 'Ends a 3 day wait',
    raised: '9:04',
  },
  {
    id: 'sarah-move',
    source: 'calendar',
    tone: 'lavender',
    icon: 'calendar',
    cta: 'Approve the move',
    title: "Move Thursday's demo to 2:00 PM",
    why: 'Sarah asked for the afternoon. Your Thursday is clear either way, and the later slot gives you the morning for the deck you owe her.',
    facts: [
      { label: 'New time', value: 'Thu 23 Jul, 2:00 to 3:00 PM' },
      { label: 'Was', value: '11:00 AM' },
      { label: 'Guests', value: 'Sarah Nadeem, you' },
    ],
    edit: { label: 'Start time', value: '2:00 PM', hint: "I'll offer this back to Sarah if you change it." },
    approveLabel: 'Move it',
    executed: 'Moved, and Sarah has the new invite. Your Thursday morning is clear.',
    worth: 'Saves a five mail thread',
    raised: '8:41',
  },
  {
    id: 'sarah-reply',
    source: 'people',
    tone: 'lavender',
    icon: 'chat',
    cta: 'Review my reply',
    title: 'Reply to Sarah about the final deck',
    why: "It's day 8 on a promise you made her, and the demo is Thursday. I've written what you'd say; you only need to agree with it.",
    facts: [
      { label: 'To', value: 'Sarah Nadeem' },
      { label: 'About', value: 'Thursday demo, final deck' },
      { label: 'Waiting', value: '8 days' },
    ],
    edit: {
      label: 'My draft',
      value:
        "Hi Sarah, Thursday at 2pm works well. I'll have the final deck with you by end of day tomorrow so you have time to read it before we talk.",
      long: true,
    },
    approveLabel: 'Send it',
    executed: "Sent. I'll remind you about the deck tomorrow at 4:00 PM.",
    worth: 'Closes an 8 day follow-up',
    raised: '9:12',
  },
  {
    id: 'bilal-reply',
    source: 'email',
    tone: 'blue',
    icon: 'mail',
    cta: 'Review my reply',
    title: 'Reply to Bilal about the contract redlines',
    why: 'He wants Monday morning and your Monday is open until 11:00. Agreeing now means the marked-up copy reaches you over the weekend.',
    facts: [
      { label: 'To', value: 'Bilal Ahmed' },
      { label: 'About', value: 'Meridian contract redlines' },
      { label: 'Your Monday', value: 'Free until 11:00 AM' },
    ],
    edit: {
      label: 'My draft',
      value:
        'Thanks Bilal. Monday morning works for me. Send the marked-up copy over and I will read it before we talk.',
      long: true,
    },
    approveLabel: 'Send it',
    executed: "Sent. I've held 9:30 on Monday and I'll put the redlines in front of you on Sunday evening.",
    raised: '8:05',
  },
  {
    id: 'car-insurance',
    source: 'bills',
    tone: 'sand',
    icon: 'shield',
    cta: 'Approve the renewal',
    title: 'Renew the car insurance at AED 1,450',
    why: 'It lapses on 14 August. Same cover as last year for AED 60 more, and the two cheaper quotes I found both drop windscreen cover.',
    facts: [
      { label: 'Amount', value: 'AED 1,450' },
      { label: 'Renews', value: '14 Aug' },
      { label: 'Cover', value: 'Unchanged from last year' },
      { label: 'Cheapest I found', value: 'AED 1,290, less cover' },
    ],
    approveLabel: 'Renew it',
    executed: "Renewed for another year. The policy will be in your mail by tonight and I've filed a copy.",
    worth: 'Keeps windscreen cover',
    raised: 'Yesterday',
  },
  {
    id: 'flight-book',
    source: 'travel',
    tone: 'blue',
    icon: 'plane',
    cta: 'Book at this fare',
    title: 'Book KHI to DXB at AED 1,310',
    why: "It's AED 110 over the target you set me, and it has moved up twice this week. On this route that usually means it keeps climbing.",
    facts: [
      { label: 'Route', value: 'KHI to DXB, direct' },
      { label: 'Out', value: 'Sun 2 Aug, 6:40 PM' },
      { label: 'Back', value: 'Thu 6 Aug, 9:15 PM' },
      { label: 'Fare', value: 'AED 1,310 total' },
    ],
    approveLabel: 'Book it',
    executed: 'Booked. Your boarding pass will be in the app 24 hours before.',
    fails:
      "The fare moved to AED 1,395 while I was holding it. Nothing was charged, and I'd rather ask again than spend AED 85 you didn't agree to.",
    worth: 'AED 110 over your target',
    raised: '7:55',
  },
  {
    id: 'airport-pickup',
    source: 'travel',
    tone: 'peach',
    icon: 'pin',
    cta: 'Arrange it',
    title: 'Book the airport pickup for 2 August',
    why: 'You land at 11:40 PM and the metro closes at midnight. A car booked now is AED 45; booked on the night it is AED 120.',
    facts: [
      { label: 'Pick up', value: 'DXB T3, Sun 2 Aug, 11:40 PM' },
      { label: 'To', value: 'Hotel, Business Bay' },
      { label: 'Cost', value: 'AED 45' },
    ],
    approveLabel: 'Arrange it',
    executed: "Booked. The driver's details will reach you the day before.",
    worth: 'Saves AED 75',
    raised: 'Yesterday',
  },
  {
    id: 'domain-renew',
    source: 'bills',
    tone: 'blue',
    icon: 'globe',
    cta: 'Approve the renewal',
    title: 'Renew wingman.app for another year',
    why: 'It expires on 3 August and everything you send points at it.',
    facts: [
      { label: 'Cost', value: 'AED 62' },
      { label: 'Expires', value: '3 Aug' },
    ],
    approveLabel: 'Renew it',
    executed: 'Renewed to August 2027.',
    fails: 'Your card was declined, so nothing was charged and the domain is untouched. Update the card and I will try again.',
    raised: '2 days ago',
    seed: { state: 'failed', at: '2 days ago, 11:05 AM' },
  },
  {
    id: 'zero-details',
    source: 'people',
    tone: 'sand',
    icon: 'users',
    cta: 'Review my reply',
    title: 'Send Zero Lifestyle the account details',
    why: "You said you'd confirm these three days ago, and they've held the transfer since. Everything below is already on file with them.",
    facts: [
      { label: 'To', value: 'Zero Lifestyle, accounts' },
      { label: 'Confirming', value: 'Account name, IBAN, branch' },
      { label: 'Waiting', value: '3 days' },
    ],
    edit: {
      label: 'My draft',
      value:
        'Confirming the details on file are correct and current. Happy to verify by call if that helps release the transfer today.',
      long: true,
    },
    approveLabel: 'Send it',
    executed: 'Sent. They said the transfer clears within a day of confirmation.',
    raised: 'Yesterday',
  },

  {
    id: 'hina-invoice',
    source: 'email',
    tone: 'peach',
    icon: 'receipt',
    cta: 'Review my reply',
    title: 'Reply to Hina about invoice 2214',
    why: "It is 14 days past due and she has asked twice. The money is there, so the only thing missing is someone saying so.",
    facts: [
      { label: 'To', value: 'Hina Qureshi' },
      { label: 'Invoice', value: '2214, AED 6,800' },
      { label: 'Overdue', value: '14 days' },
    ],
    edit: {
      label: 'My draft',
      value:
        'Hi Hina, apologies for the delay. I am releasing this today and will send the remittance once it clears.',
      long: true,
    },
    approveLabel: 'Send it',
    executed: "Sent. I'll watch for the remittance and close it off when it clears.",
    worth: 'Ends a 14 day overdue',
    raised: 'Yesterday',
    seed: {
      state: 'executed',
      at: 'Yesterday, 5:40 PM',
      value: 'Hi Hina, sorry for the delay. It goes out today and I will send the remittance once it clears.',
    },
  },
  {
    id: 'standup-move',
    source: 'calendar',
    tone: 'blue',
    icon: 'clock',
    cta: 'Review my reply',
    title: 'Move the daily standup to 9:45',
    why: "Rai's school run has shifted and 9:30 is tight for him every morning. Nothing of yours sits in that quarter hour.",
    facts: [
      { label: 'New time', value: '9:45 AM, every weekday' },
      { label: 'Was', value: '9:30 AM' },
      { label: 'From', value: 'Next Monday' },
    ],
    edit: { label: 'My draft', value: 'No problem at all, 09:45 from next week. I will move the recurring invite.', long: true },
    approveLabel: 'Send it and move it',
    executed: 'Sent, and the recurring invite moves from Monday.',
    raised: 'Yesterday',
    seed: { state: 'executed', at: 'Yesterday, 9:20 AM' },
  },
  {
    id: 'lunch-sat',
    source: 'people',
    tone: 'lavender',
    icon: 'users',
    cta: 'Review my reply',
    title: 'Reply to Zainab about Saturday lunch',
    why: 'Your Saturday is clear and this has been open since Monday.',
    facts: [
      { label: 'To', value: 'Zainab' },
      { label: 'When', value: 'Sat 25 Jul, 1:00 PM' },
      { label: 'Your Saturday', value: 'Nothing else on' },
    ],
    edit: { label: 'My draft', value: 'Saturday at 1pm is perfect. See you there, and no gifts please.', long: true },
    approveLabel: 'Send it',
    executed: "Sent, and Saturday at 1:00 PM is in your calendar.",
    raised: 'Mon',
    seed: { state: 'dismissed', at: 'Mon, 7:10 PM', note: "I'll do this myself" },
  },


  {
    id: 'restock-tee',
    source: 'commerce',
    tone: 'peach',
    icon: 'box',
    cta: 'Approve the order',
    title: 'Order 120 more Signature Tees',
    why: "At this week's rate you sell out in 9 days and your supplier needs 14. Ordering today is the last day this doesn't become a stockout.",
    facts: [
      { label: 'Quantity', value: '120 units' },
      { label: 'Cost', value: 'AED 4,320' },
      { label: 'Lands', value: 'Around 4 Aug' },
      { label: 'Covers', value: 'About 6 weeks' },
    ],
    edit: { label: 'Quantity', value: '120', hint: 'Your last three orders were 80, 100 and 120.' },
    approveLabel: 'Place the order',
    executed: "Ordered. I'll watch the shipment and tell you if it slips past 4 Aug.",
    worth: 'Avoids a 5 day stockout',
    raised: '7:30',
  },
  {
    id: 'bundle-price',
    source: 'commerce',
    tone: 'mint',
    icon: 'card',
    cta: 'Approve the price',
    title: 'Drop the summer bundle to AED 240',
    why: 'It has sold 4 in 12 days at AED 280 while the same items sell fine on their own. AED 240 still clears the 38% margin floor you set me.',
    facts: [
      { label: 'New price', value: 'AED 240' },
      { label: 'Current', value: 'AED 280' },
      { label: 'Margin at 240', value: '41%, above your floor' },
      { label: 'Applies to', value: 'Summer bundle only' },
    ],
    edit: { label: 'New price', value: 'AED 240', hint: "Your floor is 38%. I'll warn you if a price breaks it." },
    approveLabel: 'Change the price',
    executed: "Priced at AED 240. I'll report back on it in a week.",
    worth: 'Unblocks 11 units of stock',
    raised: '7:30',
  },
  {
    id: 'cart-nudge',
    source: 'commerce',
    tone: 'lavender',
    icon: 'chat',
    cta: 'Review the message',
    title: 'Nudge 34 abandoned carts',
    why: 'They all left in the last 48 hours with items still in stock. Your last nudge of this size brought back 6 orders.',
    facts: [
      { label: 'Sends to', value: '34 customers' },
      { label: 'Left behind', value: 'AED 9,140 of stock' },
      { label: 'No discount', value: 'A reminder, not an offer' },
    ],
    edit: {
      label: 'The message',
      value: 'You left something behind. It is still in stock, and your cart is where you left it.',
      long: true,
    },
    approveLabel: 'Send them',
    executed: "Sent to 34 people. I'll tell you what comes back over the next two days.",
    worth: 'AED 9,140 in reach',
    raised: 'Yesterday',
  },


  {
    id: 'streaming-cancel',
    source: 'bills',
    tone: 'mint',
    icon: 'grid',
    cta: 'Approve the cancellation',
    title: 'Cancel the streaming plan you stopped using',
    why: "Nothing watched in 11 weeks, AED 56 a month. I found it while reconciling last month's bills.",
    facts: [
      { label: 'Saves', value: 'AED 56 a month' },
      { label: 'Last used', value: '11 weeks ago' },
    ],
    approveLabel: 'Cancel it',
    executed: 'Cancelled. It runs to the end of this billing month and stops there.',
    worth: 'AED 672 a year',
    raised: 'Yesterday',
    seed: { state: 'executed', at: 'Yesterday, 6:20 PM' },
  },
  {
    id: 'hotel-hold',
    source: 'travel',
    tone: 'lavender',
    icon: 'hotel',
    cta: 'Hold the room',
    title: 'Hold the room near the venue for 2 August',
    why: 'Free cancellation until 30 July, and it is the only one of your three saved stays inside walking distance.',
    facts: [
      { label: 'Nights', value: '2 to 6 Aug' },
      { label: 'Cost', value: 'AED 1,640' },
      { label: 'Free to cancel', value: 'Until 30 Jul' },
    ],
    approveLabel: 'Hold it',
    executed: 'Held.',
    raised: '2 days ago',
    seed: { state: 'dismissed', at: '2 days ago', note: "I'll do this myself" },
  },
]

export const approvalById = (id: string) => approvals.find((a) => a.id === id)


const KEY = 'wingman.approvals'

const seeded = (): Record<string, Decision> =>
  Object.fromEntries(approvals.filter((a) => a.seed).map((a) => [a.id, a.seed!]))

const read = (): Record<string, Decision> => {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...seeded(), ...JSON.parse(raw) } : seeded()
  } catch {
    return seeded()
  }
}

let decisions = read()
const listeners = new Set<() => void>()

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const write = (next: Record<string, Decision>) => {
  decisions = next
  try {
    localStorage.setItem(KEY, JSON.stringify(decisions))
  } catch {
  }
  listeners.forEach((fn) => fn())
}

export const useDecisions = () => useSyncExternalStore(subscribe, () => decisions)

export const decisionOf = (id: string): Decision =>
  decisions[id] ?? { state: 'pending', at: '' }

export const useDecision = (id: string) => useDecisions()[id] ?? { state: 'pending' as const, at: '' }

const set = (id: string, d: Decision) => write({ ...decisions, [id]: d })

export const approve = (id: string, value?: string) => {
  const a = approvalById(id)
  if (!a) return
  const changed = value !== undefined && value.trim() !== a.edit?.value
  set(id, { state: changed ? 'edited' : 'approved', at: NOW, value: changed ? value : undefined })
  window.setTimeout(() => {
    const held = decisionOf(id)
    if (held.state !== 'approved' && held.state !== 'edited') return
    set(id, { ...held, state: a.fails ? 'failed' : 'executed' })
  }, 1400)
}

export const dismiss = (id: string, reason: string) => set(id, { state: 'dismissed', at: NOW, note: reason })

export const reopen = (id: string) => {
  const { [id]: _gone, ...rest } = decisions
  write(rest)
}

export const DISMISS_REASONS = ['Not now', "I'll do this myself", "You've read this wrong"]


export const isSettled = (s: ApprovalState) => s === 'executed' || s === 'dismissed' || s === 'failed'
export const isWorking = (s: ApprovalState) => s === 'approved' || s === 'edited'

export const useWaiting = () => {
  const d = useDecisions()
  return approvals.filter((a) => (d[a.id]?.state ?? 'pending') === 'pending')
}
