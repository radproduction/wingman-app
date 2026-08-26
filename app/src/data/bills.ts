import { useSyncExternalStore } from 'react'
import { api } from './api'

// Real bills (detected from the user's email) from /api/bills. Surfaced on the
// dashboard "Bills" tile: how many still need them, the nearest one coming up,
// and how many are already paid. Null until loaded (tile stays on the seed).
export type BillsSummary = {
  needsYou: number
  coming: { name: string; due: string } | null
  paid: number
}

type ServerBill = {
  id: string
  name: string
  amount: number | null
  currency?: string
  due_date: string | null
  status: string
}

let summary: BillsSummary | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const snapshot = (): BillsSummary | null => summary
export const useBills = () => useSyncExternalStore(subscribe, snapshot)

const fmtDue = (iso: string): string => {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

/** Load the user's real bills. Best-effort — stays on the seed on error. */
export const hydrateBills = async (): Promise<void> => {
  try {
    const res = await api.bills()
    const bills = (res.bills as ServerBill[]) || []
    // Bills that genuinely need paying: not paid, a real amount, and a due date.
    const pending = bills.filter(
      (b) => (b.status || 'pending') !== 'paid' && Number(b.amount) > 0 && b.due_date,
    )
    pending.sort((a, b) => String(a.due_date).localeCompare(String(b.due_date)))
    const coming = pending[0] ? { name: pending[0].name, due: fmtDue(String(pending[0].due_date)) } : null
    const paid = bills.filter((b) => b.status === 'paid').length
    summary = { needsYou: pending.length, coming, paid }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep the seed */
  }
}
