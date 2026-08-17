import { useCallback, useRef } from 'react'


const scrollerFrom = (target: Element | null, root: HTMLElement) => {
  let node: Element | null = target
  while (node) {
    if (node instanceof HTMLElement && node.scrollHeight - node.clientHeight > 1) {
      const overflowY = getComputedStyle(node).overflowY
      if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return node
    }
    if (node === root) break
    node = node.parentElement
  }
  return null
}

export const useDragScroll = () => {
  const s = useRef({
    el: null as HTMLDivElement | null,
    scroller: null as HTMLElement | null,
    active: false,
    dragging: false,
    suppressClick: false,
    startX: 0,
    startY: 0,
    startTop: 0,
    pointerId: -1,
  }).current

  const onPointerDown = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      if (!s.el) return
      const target = e.target as HTMLElement | null
      if (target?.closest('input, select, textarea, [contenteditable="true"]')) return
      if (target?.closest('[data-drag-scroll="off"]')) return
      const scroller = scrollerFrom(target, s.el)
      if (!scroller) return
      s.scroller = scroller
      s.active = true
      s.dragging = false
      s.suppressClick = false
      s.startX = e.clientX
      s.startY = e.clientY
      s.startTop = scroller.scrollTop
      s.pointerId = e.pointerId
    },
    [s],
  )

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!s.active || !s.el || !s.scroller) return
      const dy = e.clientY - s.startY
      const dx = e.clientX - s.startX
      if (!s.dragging) {
        if (Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(dy)) {
          s.active = false
          return
        }
        if (Math.abs(dy) < 6) return
        s.dragging = true
        s.el.setPointerCapture?.(s.pointerId)
      }
      s.scroller.scrollTop = s.startTop - dy
      e.preventDefault()
    },
    [s],
  )

  const end = useCallback(
    (e: PointerEvent) => {
      if (s.dragging) {
        s.suppressClick = true
        s.el?.releasePointerCapture?.(e.pointerId)
      }
      s.active = false
      s.dragging = false
      s.scroller = null
    },
    [s],
  )

  const onClickCapture = useCallback(
    (e: MouseEvent) => {
      if (s.suppressClick) {
        s.suppressClick = false
        e.stopPropagation()
        e.preventDefault()
      }
    },
    [s],
  )

  return useCallback(
    (el: HTMLDivElement | null) => {
      if (s.el) {
        s.el.removeEventListener('pointerdown', onPointerDown)
        s.el.removeEventListener('pointermove', onPointerMove)
        s.el.removeEventListener('pointerup', end)
        s.el.removeEventListener('pointercancel', end)
        s.el.removeEventListener('click', onClickCapture, true)
      }
      s.el = el
      if (el) {
        el.addEventListener('pointerdown', onPointerDown)
        el.addEventListener('pointermove', onPointerMove)
        el.addEventListener('pointerup', end)
        el.addEventListener('pointercancel', end)
        el.addEventListener('click', onClickCapture, true)
      }
    },
    [s, onPointerDown, onPointerMove, end, onClickCapture],
  )
}
