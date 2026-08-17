import { useEffect, useRef, useState, type RefObject } from 'react'


const RESIST = 0.6
const MAX_PULL = 170
const TRIGGER = 96
const HELD = 56
const IDLE_AFTER = 450

type PullState = 'idle' | 'pulling' | 'settling' | 'refreshing'

type Options = {
  scrollerRef: RefObject<HTMLElement | null>
  hostRef?: RefObject<HTMLElement | null>
  onRefresh: () => Promise<void>
  enabled?: boolean
}

export function usePullToRefresh({ scrollerRef, hostRef, onRefresh, enabled = true }: Options) {
  const [refreshing, setRefreshing] = useState(false)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled
  const refreshingRef = useRef(refreshing)
  refreshingRef.current = refreshing
  const onRefreshRef = useRef(onRefresh)
  onRefreshRef.current = onRefresh

  useEffect(() => {
    const el = scrollerRef.current
    const host = hostRef?.current ?? el?.parentElement
    if (!el || !host) return

    const g = { startY: 0, startX: 0, dist: 0, active: false, tracking: false }
    let idle = 0

    const setDist = (dist: number) => {
      host.style.setProperty('--wg-pull-dist', `${dist}px`)
      host.style.setProperty('--wg-pull', String(Math.min(dist / TRIGGER, 1)))
    }
    const setState = (s: PullState) => {
      host.dataset.pullState = s
    }
    const scheduleIdle = () => {
      window.clearTimeout(idle)
      idle = window.setTimeout(() => {
        if (host.dataset.pullState === 'settling') host.dataset.pullState = 'idle'
      }, IDLE_AFTER)
    }

    const onStart = (e: TouchEvent) => {
      if (!enabledRef.current || refreshingRef.current || el.scrollTop > 0) {
        g.tracking = false
        return
      }
      window.clearTimeout(idle)
      const t = e.touches[0]
      g.startY = t.clientY
      g.startX = t.clientX
      g.dist = 0
      g.active = false
      g.tracking = true
    }

    const onMove = (e: TouchEvent) => {
      if (!g.tracking || refreshingRef.current) return
      const t = e.touches[0]
      const dy = t.clientY - g.startY
      const dx = t.clientX - g.startX
      if (!g.active) {
        if (el.scrollTop > 0 || dy <= 0 || Math.abs(dx) > dy) {
          g.tracking = false
          return
        }
        g.active = true
        setState('pulling')
      }
      if (e.cancelable) e.preventDefault()
      g.dist = Math.max(0, Math.min(dy * RESIST, MAX_PULL))
      setDist(g.dist)
    }

    const onEnd = () => {
      if (!g.tracking) return
      const fire = g.active && g.dist >= TRIGGER
      g.tracking = false
      g.active = false
      if (fire) {
        setRefreshing(true)
      } else {
        setState('settling')
        setDist(0)
        scheduleIdle()
      }
    }

    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: false })
    el.addEventListener('touchend', onEnd, { passive: true })
    el.addEventListener('touchcancel', onEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', onStart)
      el.removeEventListener('touchmove', onMove)
      el.removeEventListener('touchend', onEnd)
      el.removeEventListener('touchcancel', onEnd)
      window.clearTimeout(idle)
      host.style.removeProperty('--wg-pull')
      host.style.removeProperty('--wg-pull-dist')
      delete host.dataset.pullState
    }
  }, [scrollerRef, hostRef, enabled])

  useEffect(() => {
    if (!refreshing) return
    const el = scrollerRef.current
    const host = hostRef?.current ?? el?.parentElement
    if (!host) {
      setRefreshing(false)
      return
    }
    host.dataset.pullState = 'refreshing'
    host.style.setProperty('--wg-pull', '1')
    host.style.setProperty('--wg-pull-dist', `${HELD}px`)

    let cancelled = false
    Promise.resolve(onRefreshRef.current()).finally(() => {
      if (cancelled) return
      host.dataset.pullState = 'settling'
      host.style.setProperty('--wg-pull', '0')
      host.style.setProperty('--wg-pull-dist', '0px')
      window.setTimeout(() => {
        if (host.dataset.pullState === 'settling') host.dataset.pullState = 'idle'
      }, IDLE_AFTER)
      setRefreshing(false)
    })
    return () => {
      cancelled = true
    }
  }, [refreshing, scrollerRef, hostRef])

  return { refreshing }
}
