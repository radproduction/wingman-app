import { useSyncExternalStore } from 'react'
import type { ChipTone } from './mock'
import { api } from './api'

// Real people for the People detail screen: who is waiting on the user (open
// follow-ups Wingman tracked from mail) and who they've recently been in touch
// with (contacts). Null until loaded — the screen keeps the seed meanwhile.
export type PersonRow = {
  name: string
  when: string
  context: string
  note?: string
  initial: string
  tone: ChipTone
}

export type PeopleData = {
  waiting: PersonRow[]
  recent: PersonRow[]
  waitingCount: number
}

type ServerFollowup = {
  type?: string
  description?: string
  counterparty?: string | null
  due_date?: string | null
  status?: string
}
type ServerContact = { name?: string; email?: string; company?: string; notes?: string | null }

let data: PeopleData | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const snapshot = (): PeopleData | null => data
export const usePeople = () => useSyncExternalStore(subscribe, snapshot)

const TONES: ChipTone[] = ['lavender', 'blue', 'mint', 'peach', 'rose', 'sand']
const toneFor = (i: number): ChipTone => TONES[i % TONES.length]
const initialOf = (name: string): string => (name.trim()[0] || '?').toUpperCase()

const daysUntil = (iso: string): number => {
  const d = new Date(`${String(iso).slice(0, 10)}T00:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}
const dueLabel = (iso?: string | null): string => {
  if (!iso) return ''
  const n = daysUntil(iso)
  if (n < 0) return `${Math.abs(n)}d overdue`
  if (n === 0) return 'Due today'
  if (n === 1) return 'Due tomorrow'
  return `Due in ${n} days`
}

export const hydratePeople = async (): Promise<void> => {
  try {
    const [fRes, cRes] = await Promise.all([api.followups(), api.contacts()])

    const followups = ((fRes.followups as ServerFollowup[]) || []).filter((f) => (f.status || 'open') === 'open')
    const waiting: PersonRow[] = followups.slice(0, 12).map((f, i) => {
      const desc = f.description || 'something you agreed'
      return {
        name: f.counterparty || 'Someone',
        when: dueLabel(f.due_date),
        context: f.type === 'promise_made' ? `You said you'd ${desc}` : desc,
        initial: initialOf(f.counterparty || 'S'),
        tone: toneFor(i),
      }
    })

    const contacts = ((cRes.contacts as ServerContact[]) || []).filter((c) => c && (c.name || c.email))
    const recent: PersonRow[] = contacts.slice(0, 8).map((c, i) => {
      const name = (c.name || c.email || 'Unknown').trim()
      return {
        name,
        when: '',
        context: c.company || c.notes || (c.email ?? ''),
        initial: initialOf(name),
        tone: toneFor(i),
      }
    })

    data = { waiting, recent, waitingCount: followups.length }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep the seed */
  }
}
