import { useMemo } from 'react'
import type { IconName } from '../app/icons'
import type { ChipTone } from './mock'
import { useActionItems, isBlocked, isOverdue, isUnassigned, isUrgent, type ActionItem } from './actionItems'
import { approvals, useDecisions } from './approvals'


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

const reasonOf = (a: ActionItem): AttentionReason | null => {
  if (isOverdue(a)) return 'overdue'
  if (isBlocked(a)) return 'blocked'
  if (isUnassigned(a)) return 'unassigned'
  if (isUrgent(a)) return 'urgent'
  return null
}

const subOf = (a: ActionItem, reason: AttentionReason) => {
  if (reason === 'blocked') return a.blockedBy ?? 'Blocked'
  if (reason === 'unassigned') return a.meeting ? `Nobody assigned · ${a.meeting}` : 'Nobody assigned'
  if (reason === 'overdue') return `${a.due} · ${a.owner || 'Unassigned'}`
  return `Due ${a.due.toLowerCase()} · ${a.owner || 'Unassigned'}`
}

export const useAttention = (): AttentionItem[] => {
  const items = useActionItems()
  const decisions = useDecisions()

  return useMemo(() => {
    const out: AttentionItem[] = []

    for (const a of items) {
      if (a.status === 'done') continue
      const reason = reasonOf(a)
      if (!reason) continue
      out.push({
        id: a.id,
        title: a.title,
        sub: subOf(a, reason),
        reason,
        tone: REASONS[reason].tone,
        icon: REASONS[reason].icon,
        route: 'tasks',
        actionId: a.id,
      })
    }

    for (const ap of approvals) {
      const d = decisions[ap.id]
      if (d && d.state !== 'pending') continue
      out.push({
        id: `ap-${ap.id}`,
        title: ap.title,
        sub: ap.why,
        reason: 'waiting',
        tone: ap.tone,
        icon: ap.icon,
        route: 'approvals',
      })
    }

    const dueOf = (x: AttentionItem) => items.find((a) => a.id === x.actionId)?.dueIn ?? 0
    return out.sort((a, b) => REASONS[a.reason].rank - REASONS[b.reason].rank || dueOf(a) - dueOf(b))
  }, [items, decisions])
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
