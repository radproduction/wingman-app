import { useSyncExternalStore } from 'react'
import type { IconName } from '../app/icons'
import type { ChipTone } from './mock'
import { api } from './api'

// Real bills (detected from the user's email) from /api/bills — used both by the
// dashboard "Bills" tile (summary) and the Bills detail screen (full lists).
// Null until loaded (screens stay on the seed).
export type BillItem = {
  name: string
  amount: string
  when: string
  auto: boolean
  icon: IconName
  tone: ChipTone
}

export type BillsData = {
  needsYou: number
  coming: { name: string; due: string } | null
  paid: number
  upcoming: BillItem[]
  paidList: BillItem[]
  dueTotal: string
  paidTotal: string
}

type ServerBill = {
  id: string
  name: string
  amount: number | null
  currency?: string
  due_date: string | null
  status: string
  recurring?: boolean
}

let data: BillsData | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const snapshot = (): BillsData | null => data
export const useBills = () => useSyncExternalStore(subscribe, snapshot)

const SYMBOL: Record<string, string> = { USD: '$', PKR: 'Rs ', AED: 'AED ', EUR: '€', GBP: '£', INR: '₹' }
const money = (amount: number | null, currency?: string): string => {
  const n = Number(amount || 0)
  const sym = SYMBOL[(currency || 'PKR').toUpperCase()] ?? `${currency || ''} `
  return `${sym}${n.toLocaleString('en-US')}`
}

const shortDate = (iso: string): string => {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const daysUntil = (iso: string): number => {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const dueLabel = (iso: string): string => {
  const n = daysUntil(iso)
  if (n < 0) return `Overdue ${Math.abs(n)}d`
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  if (n <= 21) return `Due in ${n} days`
  return `Due ${shortDate(iso)}`
}

// A light icon/tone by biller name — decorative only, so the row reads at a glance.
const classify = (name: string): { icon: IconName; tone: ChipTone } => {
  const n = name.toLowerCase()
  if (/wifi|internet|broadband|fiber|fibre|isp|net\b/.test(n)) return { icon: 'globe', tone: 'blue' }
  if (/phone|mobile|cell|sim|telecom/.test(n)) return { icon: 'phone', tone: 'lavender' }
  if (/insur|assur/.test(n)) return { icon: 'shield', tone: 'sand' }
  if (/electric|power|energy|gas|water|util/.test(n)) return { icon: 'home', tone: 'peach' }
  if (/stream|netflix|spotify|prime|youtube|disney|subscription|membership/.test(n)) return { icon: 'grid', tone: 'mint' }
  if (/cloud|host|server|aws|vercel|domain|saas|render|emergent/.test(n)) return { icon: 'box', tone: 'blue' }
  if (/card|bank|loan|credit/.test(n)) return { icon: 'card', tone: 'sand' }
  return { icon: 'receipt', tone: 'sand' }
}

/** Load the user's real bills. Best-effort — stays on the seed on error. */
export const hydrateBills = async (): Promise<void> => {
  try {
    const res = await api.bills()
    const bills = (res.bills as ServerBill[]) || []

    const isPaid = (b: ServerBill) => (b.status || 'pending') === 'paid'
    const pending = bills.filter((b) => !isPaid(b) && Number(b.amount) > 0 && b.due_date)
    pending.sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    const paidBills = bills.filter(isPaid)

    const upcoming: BillItem[] = pending.map((b) => {
      const c = classify(b.name || 'Bill')
      return {
        name: b.name || 'Bill',
        amount: money(b.amount, b.currency),
        when: dueLabel(String(b.due_date)),
        auto: !!b.recurring,
        icon: c.icon,
        tone: c.tone,
      }
    })

    const paidList: BillItem[] = paidBills.map((b) => {
      const c = classify(b.name || 'Bill')
      return {
        name: b.name || 'Bill',
        amount: money(b.amount, b.currency),
        when: b.due_date ? `Paid ${shortDate(String(b.due_date))}` : 'Paid',
        auto: !!b.recurring,
        icon: c.icon,
        tone: c.tone,
      }
    })

    const sum = (list: ServerBill[]) => list.reduce((a, b) => a + Number(b.amount || 0), 0)
    const cur = bills[0]?.currency
    const coming = pending[0] ? { name: pending[0].name, due: shortDate(String(pending[0].due_date)) } : null

    data = {
      needsYou: pending.length,
      coming,
      paid: paidBills.length,
      upcoming,
      paidList,
      dueTotal: money(sum(pending), cur),
      paidTotal: money(sum(paidBills), cur),
    }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep the seed */
  }
}
