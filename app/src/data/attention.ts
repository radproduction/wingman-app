import { useMemo } from 'react'
import type { IconName } from '../app/icons'
import { TODAY, type ChipTone } from './mock'
import { useTasks } from './tasks'
import { useEmails } from './emails'
import { eventsFor, useCalendarData } from './day'


export type AttentionReason = 'overdue' | 'blocked' | 'unassigned' | 'urgent' | 'waiting'

export type AttentionItem = {
  id: string
  title: string
  sub: string
  reason: AttentionReason
  tone: ChipTone
  icon: IconName
  route: string
  actionId?: string
}

export const REASONS: Record<
  AttentionReason,
  { label: string; short: string; tone: ChipTone; icon: IconName; rank: number }
> = {
  overdue: { label: 'Overdue', short: 'overdue', tone: 'rose', icon: 'clock', rank: 0 },
  blocked: { label: 'Blocked', short: 'blocked', tone: 'sand', icon: 'shield', rank: 1 },
  unassigned: { label: 'Unassigned', short: 'unassigned', tone: 'peach', icon: 'user', rank: 2 },
  urgent: { label: 'Urgent', short: 'urgent', tone: 'rose', icon: 'alert', rank: 3 },
  waiting: { label: 'Waiting on you', short: 'waiting', tone: 'blue', icon: 'checkCircle', rank: 4 },
}

// "Needs attention" is not its own data source — it is BUILT from real signals:
// overdue tasks, today's calendar conflicts, and emails still waiting on a reply.
// Each store hydrates on sign-in, so this list turns real as the data lands.
export const useAttention = (): AttentionItem[] => {
  const tasks = useTasks()
  const emails = useEmails()
  const calVersion = useCalendarData() // re-derive when the calendar loads

  return useMemo(() => {
    const out: AttentionItem[] = []

    // 1) Overdue tasks (real /api/tasks) — grouped under Today with due 'Overdue'.
    tasks.groups
      .flatMap((g) => g.items)
      .filter((i) => i.due === 'Overdue')
      .forEach((tk, i) => {
        out.push({
          id: `task-overdue-${i}-${tk.title}`,
          title: tk.title,
          sub: tk.source ? `Overdue · ${tk.source}` : 'Overdue',
          reason: 'overdue',
          tone: REASONS.overdue.tone,
          icon: REASONS.overdue.icon,
          route: 'tasks',
        })
      })

    // 2) Today's calendar conflicts (real /api/calendar) — flagged events overlap.
    eventsFor(TODAY)
      .filter((e) => e.flag)
      .forEach((ev, i) => {
        out.push({
          id: `cal-conflict-${i}-${ev.time}`,
          title: ev.title,
          sub: `${ev.time} · ${ev.flag}`,
          reason: 'urgent',
          tone: REASONS.urgent.tone,
          icon: REASONS.urgent.icon,
          route: 'calendar',
        })
      })

    // 3) Emails still waiting on a personal reply (real /api/emails).
    emails.needsReply.forEach((m, i) => {
      out.push({
        id: `mail-${i}-${m.from}`,
        title: m.subject,
        sub: `From ${m.from}`,
        reason: 'waiting',
        tone: REASONS.waiting.tone,
        icon: REASONS.waiting.icon,
        route: 'email',
      })
    })

    return out.sort((a, b) => REASONS[a.reason].rank - REASONS[b.reason].rank)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, emails, calVersion])
}

export const attentionCounts = (list: AttentionItem[]) => {
  const by = { overdue: 0, blocked: 0, unassigned: 0, urgent: 0, waiting: 0 }
  for (const a of list) by[a.reason] += 1
  return by
}

export const attentionSummary = (list: AttentionItem[]): { n: number; reason: AttentionReason }[] => {
  const by = attentionCounts(list)
  return (Object.keys(by) as AttentionReason[])
    .filter((k) => by[k] > 0)
    .sort((a, b) => REASONS[a].rank - REASONS[b].rank)
    .map((k) => ({ n: by[k], reason: k }))
}
