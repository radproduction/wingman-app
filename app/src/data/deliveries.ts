import { useSyncExternalStore } from 'react'
import type { IconName } from '../app/icons'
import type { ChipTone, Delivery } from './mock'
import { api } from './api'

// Real deliveries (detected from the user's mail) from /api/deliveries, mapped
// onto the Delivery shape the screen renders. Null until loaded — the screen
// shows an honest empty state until then, and if none come back.

export type DeliveriesData = {
  transit: Delivery[]
  landed: Delivery[]
}

type ServerDelivery = {
  id: string
  item_name?: string | null
  merchant?: string | null
  carrier?: string | null
  tracking_number?: string | null
  status?: string | null
  estimated_delivery?: string | null
  delivered_at?: string | null
  return_window_ends?: string | null
}

let data: DeliveriesData | null = null
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}
const snapshot = (): DeliveriesData | null => data
export const useDeliveries = () => useSyncExternalStore(subscribe, snapshot)

// DELIVERY_STEPS = ['Ordered', 'Shipped', 'In transit', 'Delivered']
const STEP: Record<string, number> = {
  ordered: 0,
  placed: 0,
  confirmed: 0,
  shipped: 1,
  dispatched: 1,
  in_transit: 2,
  out_for_delivery: 2,
  delivered: 3,
  completed: 3,
}
const stepOf = (status?: string | null): number => STEP[String(status || '').toLowerCase()] ?? 2

// Decorative tone only, so rows read at a glance.
const TONES: ChipTone[] = ['peach', 'blue', 'mint', 'lavender', 'sand']
const toneAt = (i: number): ChipTone => TONES[i % TONES.length]

const shortDate = (iso: string): string => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const daysUntil = (iso: string): number => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return NaN
  d.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86400000)
}

const etaLabel = (iso?: string | null): string => {
  if (!iso) return 'Arriving soon'
  const n = daysUntil(iso)
  if (Number.isNaN(n)) return 'Arriving soon'
  if (n < 0) return `Expected ${shortDate(iso)}`
  if (n === 0) return 'Arrives today'
  if (n === 1) return 'Arrives tomorrow'
  if (n <= 14) return `Arrives in ${n} days`
  return `Arrives ${shortDate(iso)}`
}

/** Load the user's real deliveries. Best-effort — stays empty on error. */
export const hydrateDeliveries = async (): Promise<void> => {
  try {
    const res = await api.deliveries()
    const rows = (res.deliveries as ServerDelivery[]) || []

    const transit: Delivery[] = []
    const landed: Delivery[] = []

    rows.forEach((r, i) => {
      const isDelivered = String(r.status || '').toLowerCase() === 'delivered' || !!r.delivered_at
      const item = r.item_name || 'Package'
      const from = r.merchant || r.carrier || 'Order'
      const tone = toneAt(i)

      if (isDelivered) {
        const when = shortDate(r.delivered_at || r.estimated_delivery || '')
        let window: string | undefined
        let closed: boolean | undefined
        if (r.return_window_ends) {
          const n = daysUntil(r.return_window_ends)
          if (!Number.isNaN(n)) {
            if (n >= 0) window = `You can still return this for ${n} day${n === 1 ? '' : 's'}`
            else {
              window = 'Return window closed'
              closed = true
            }
          }
        }
        landed.push({
          item,
          from,
          tone,
          icon: 'box' as IconName,
          step: 3,
          when: when ? `Delivered ${when}` : 'Delivered',
          window,
          closed,
        })
      } else {
        transit.push({
          item,
          from,
          tone,
          icon: 'truck' as IconName,
          step: stepOf(r.status),
          when: etaLabel(r.estimated_delivery),
        })
      }
    })

    data = { transit, landed }
    listeners.forEach((fn) => fn())
  } catch {
    /* keep empty — honest empty state */
  }
}
