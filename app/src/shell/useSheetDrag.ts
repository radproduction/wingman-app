import { useCallback, useEffect, useRef } from 'react'
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, RefObject } from 'react'
import { SHEET_SPRING, spring } from './spring'
import { motionReduced } from './prefs'


const TAP_SLOP = 6
const LIFT_RESIST = 0.35
const MAX_LIFT = 24
const DISMISS_FRACTION = 0.25
const FLING_VELOCITY = 500
const VELOCITY_WINDOW = 60
const MIN_SPAN = 8
const OVERSHOOT = 40
const CLOSE_VELOCITY = 900

const offsetOf = (el: HTMLElement) => {
  const t = getComputedStyle(el).transform
  if (!t || t === 'none') return 0
  try {
    return new DOMMatrixReadOnly(t).m42
  } catch {
    return 0
  }
}

type Options = {
  sheetRef: RefObject<HTMLElement | null>
  layerRef: RefObject<HTMLElement | null>
  enabled?: boolean
  onDismiss: () => void
}

export const useSheetDrag = ({ sheetRef, layerRef, enabled = true, onDismiss }: Options) => {
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  const cancelSpring = useRef<(() => void) | null>(null)
  const swallowClick = useRef(false)
  const g = useRef({
    tracking: false,
    dragging: false,
    startY: 0,
    base: 0,
    offset: 0,
    height: 0,
    pointerId: -1,
    samples: [] as { y: number; t: number }[],
  })

  const write = useCallback(
    (offset: number) => {
      const layer = layerRef.current
      if (!layer) return
      g.current.offset = offset
      layer.style.setProperty('--wm-sheet-drag', `${offset}px`)
      const p = g.current.height > 0 ? offset / g.current.height : 0
      layer.style.setProperty('--wm-sheet-p', String(Math.min(Math.max(p, 0), 1)))
    },
    [layerRef],
  )

  const setState = useCallback(
    (state: 'dragging' | 'springing' | null) => {
      const layer = layerRef.current
      if (!layer) return
      if (state) layer.dataset.sheetDrag = state
      else delete layer.dataset.sheetDrag
    },
    [layerRef],
  )

  const reset = useCallback(() => {
    const layer = layerRef.current
    if (!layer) return
    delete layer.dataset.sheetDrag
    layer.style.removeProperty('--wm-sheet-drag')
    layer.style.removeProperty('--wm-sheet-p')
  }, [layerRef])

  const velocity = () => {
    const s = g.current.samples
    const last = s[s.length - 1]
    if (!last) return 0
    let first = s[0]
    for (let i = s.length - 1; i >= 0; i--) {
      first = s[i]
      if (last.t - s[i].t >= VELOCITY_WINDOW) break
    }
    const dt = last.t - first.t
    return dt >= MIN_SPAN ? ((last.y - first.y) / dt) * 1000 : 0
  }

  const throwOut = useCallback(
    (from: number, v: number, done: () => void) => {
      const height = g.current.height
      cancelSpring.current?.()
      write(from)
      setState('springing')

      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        cancelSpring.current?.()
        cancelSpring.current = null
        done()
      }

      cancelSpring.current = spring({
        from,
        to: height + OVERSHOOT,
        velocity: v,
        ...SHEET_SPRING,
        onFrame: (value) => {
          write(value)
          if (value >= height) finish()
        },
        onRest: finish,
      })
      return cancelSpring.current
    },
    [setState, write],
  )

  const settle = useCallback(
    (dismiss: boolean, v: number) => {
      if (motionReduced()) {
        if (!dismiss) {
          reset()
          return
        }
        write(g.current.height + OVERSHOOT)
        onDismissRef.current()
        return
      }

      if (dismiss) {
        throwOut(g.current.offset, v, () => onDismissRef.current())
        return
      }

      setState('springing')
      cancelSpring.current = spring({
        from: g.current.offset,
        to: 0,
        velocity: v,
        ...SHEET_SPRING,
        onFrame: write,
        onRest: () => {
          cancelSpring.current = null
          reset()
        },
      })
    },
    [reset, setState, throwOut, write],
  )

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      if (!enabled) return
      if (e.pointerType === 'mouse' && e.button !== 0) return
      const sheet = sheetRef.current
      if (!sheet || !layerRef.current) return

      cancelSpring.current?.()
      cancelSpring.current = null

      const d = g.current
      d.tracking = true
      d.dragging = false
      d.startY = e.clientY
      d.base = offsetOf(sheet)
      d.offset = d.base
      d.height = sheet.offsetHeight
      d.pointerId = e.pointerId
      d.samples = [{ y: e.clientY, t: e.timeStamp }]
      e.currentTarget.setPointerCapture?.(e.pointerId)
    },
    [enabled, sheetRef, layerRef],
  )

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const d = g.current
      if (!d.tracking) return

      const dy = e.clientY - d.startY
      if (!d.dragging) {
        if (Math.abs(dy) < TAP_SLOP) return
        d.dragging = true
        setState('dragging')
      }

      const raw = d.base + dy
      write(raw >= 0 ? raw : Math.max(raw * LIFT_RESIST, -MAX_LIFT))

      d.samples.push({ y: e.clientY, t: e.timeStamp })
      if (d.samples.length > 8) d.samples.shift()
    },
    [setState, write],
  )

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const d = g.current
      if (!d.tracking) return
      d.tracking = false
      e.currentTarget.releasePointerCapture?.(d.pointerId)
      if (!d.dragging) {
        if (d.offset !== 0) reset()
        return
      }

      d.dragging = false
      swallowClick.current = true
      const v = velocity()
      settle(d.offset > d.height * DISMISS_FRACTION || v > FLING_VELOCITY, v)
    },
    [reset, settle],
  )

  const onPointerCancel = useCallback(
    (e: ReactPointerEvent<HTMLElement>) => {
      const d = g.current
      if (!d.tracking) return
      d.tracking = false
      e.currentTarget.releasePointerCapture?.(d.pointerId)
      if (d.dragging) swallowClick.current = true
      d.dragging = false
      settle(false, 0)
    },
    [settle],
  )

  const springOut = useCallback(
    (done: () => void) => {
      const layer = layerRef.current
      const sheet = sheetRef.current
      if (!layer || !sheet) {
        done()
        return () => {}
      }
      const from = offsetOf(sheet)
      const height = sheet.offsetHeight
      g.current.height = height

      if (from >= height || motionReduced()) {
        done()
        return () => {}
      }

      return throwOut(from, CLOSE_VELOCITY, done)
    },
    [layerRef, sheetRef, throwOut],
  )

  const onClickCapture = useCallback((e: ReactMouseEvent<HTMLElement>) => {
    if (!swallowClick.current) return
    swallowClick.current = false
    e.stopPropagation()
    e.preventDefault()
  }, [])

  useEffect(
    () => () => {
      cancelSpring.current?.()
      cancelSpring.current = null
    },
    [],
  )

  return {
    handle: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onClickCapture },
    springOut,
  }
}
