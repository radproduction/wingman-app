import { useEffect, useRef } from 'react'

const motionReduced = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
  document.documentElement.getAttribute('data-motion') !== 'full'

type Theme = 'light' | 'dark'

const SEGMENTS = 8
const SEG_LEN = 12
const REST = SEGMENTS * SEG_LEN
const WIDTH = 140
const HEIGHT = 240
const ANCHOR_X = WIDTH / 2
const GRAVITY = 1500
const DAMPING = 0.985
const ITERATIONS = 4
const TUG = 26
const KNOB = 18

type P = { x: number; y: number; px: number; py: number }

export const PullCord = ({ theme, onToggle }: { theme: Theme; onToggle: (next: Theme) => void }) => {
  const rootRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<SVGPolylineElement>(null)
  const knobRef = useRef<HTMLButtonElement>(null)
  const themeRef = useRef(theme)
  themeRef.current = theme

  useEffect(() => {
    const root = rootRef.current
    const line = lineRef.current
    const knob = knobRef.current
    if (!root || !line || !knob) return

    const particles: P[] = Array.from({ length: SEGMENTS + 1 }, (_, i) => ({
      x: ANCHOR_X,
      y: i * SEG_LEN,
      px: ANCHOR_X,
      py: i * SEG_LEN,
    }))
    const tip = () => particles[SEGMENTS]

    let raf = 0
    let last = 0
    let clock = 0
    let dragging = false
    let dragMoved = false
    let fired = false
    let target = { x: ANCHOR_X, y: REST }

    const paint = () => {
      line.setAttribute('points', particles.map((p) => `${p.x},${p.y}`).join(' '))
      const t = tip()
      knob.style.transform = `translate(${t.x - KNOB / 2}px, ${t.y - KNOB / 2}px)`
    }

    const flip = () => {
      onToggle(themeRef.current === 'light' ? 'dark' : 'light')
    }

    if (motionReduced()) {
      paint()
      knob.addEventListener('click', flip)
      return () => knob.removeEventListener('click', flip)
    }

    const step = (dt: number) => {
      clock += dt
      const wind = Math.sin(clock * 0.8) * 9
      for (let i = 1; i <= SEGMENTS; i++) {
        const p = particles[i]
        const vx = (p.x - p.px) * DAMPING
        const vy = (p.y - p.py) * DAMPING
        p.px = p.x
        p.py = p.y
        p.x += vx + wind * dt * dt
        p.y += vy + GRAVITY * dt * dt
      }
      for (let k = 0; k < ITERATIONS; k++) {
        particles[0].x = ANCHOR_X
        particles[0].y = 0
        if (dragging) {
          const t = tip()
          t.x = target.x
          t.y = target.y
        }
        for (let i = 0; i < SEGMENTS; i++) {
          const a = particles[i]
          const b = particles[i + 1]
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.hypot(dx, dy) || 0.0001
          const diff = (dist - SEG_LEN) / dist
          const wa = i === 0 ? 0 : 0.5
          const wb = dragging && i === SEGMENTS - 1 ? 0 : i === 0 ? 1 : 0.5
          a.x += dx * diff * wa
          a.y += dy * diff * wa
          b.x -= dx * diff * wb
          b.y -= dy * diff * wb
        }
      }
    }

    let rectLeft = 0
    let rectTop = 0
    const measure = () => {
      const r = root.getBoundingClientRect()
      rectLeft = r.left
      rectTop = r.top
    }
    measure()
    let mountX = window.screenX + rectLeft
    let mountY = window.screenY + rectTop
    let prevDx = 0
    let prevDy = 0
    const KICK_GAIN = 0.5
    const KICK_CAP = 10

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000 || 0.016, 0.032)
      last = now

      const mx = window.screenX + rectLeft
      const my = window.screenY + rectTop
      const dx = mx - mountX
      const dy = my - mountY
      let kx = (dx - prevDx) * KICK_GAIN
      let ky = (dy - prevDy) * KICK_GAIN
      mountX = mx
      mountY = my
      prevDx = dx
      prevDy = dy
      if (kx || ky) {
        kx = Math.max(-KICK_CAP, Math.min(KICK_CAP, kx))
        ky = Math.max(-KICK_CAP, Math.min(KICK_CAP, ky))
        for (let i = 1; i <= SEGMENTS; i++) {
          particles[i].px += kx
          particles[i].py += ky
        }
      }

      step(dt)
      paint()

      if (dragging) {
        const t = tip()
        const stretch = Math.hypot(t.x - ANCHOR_X, t.y) - REST
        if (stretch > TUG && !fired) {
          fired = true
          dragMoved = true
          flip()
        } else if (stretch < TUG * 0.3) {
          fired = false
        }
      }
      raf = requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf) return
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      cancelAnimationFrame(raf)
      raf = 0
    }

    const localPoint = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect()
      let x = e.clientX - rect.left
      let y = e.clientY - rect.top
      const dx = x - ANCHOR_X
      const dist = Math.hypot(dx, y)
      const max = REST + 70
      if (dist > max) {
        x = ANCHOR_X + (dx / dist) * max
        y = (y / dist) * max
      }
      return { x, y }
    }

    const onMove = (e: PointerEvent) => {
      if (!dragging) return
      const next = localPoint(e)
      if (Math.hypot(next.x - target.x, next.y - target.y) > 2) dragMoved = true
      target = next
    }
    const endDrag = () => {
      if (!dragging) return
      dragging = false
      const t = tip()
      t.py = t.y + 12
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('blur', endDrag)
    }
    const onDown = (e: PointerEvent) => {
      e.preventDefault()
      dragging = true
      dragMoved = false
      fired = false
      target = localPoint(e)
      try {
        knob.setPointerCapture(e.pointerId)
      } catch {
      }
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', endDrag)
      window.addEventListener('pointercancel', endDrag)
      window.addEventListener('blur', endDrag)
    }
    const onClick = () => {
      if (dragMoved) {
        dragMoved = false
        return
      }
      flip()
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else start()
    }

    knob.addEventListener('pointerdown', onDown)
    knob.addEventListener('lostpointercapture', endDrag)
    knob.addEventListener('click', onClick)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('resize', measure)
    start()

    return () => {
      stop()
      endDrag()
      knob.removeEventListener('pointerdown', onDown)
      knob.removeEventListener('lostpointercapture', endDrag)
      knob.removeEventListener('click', onClick)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <div ref={rootRef} className="wgd-cord" style={{ width: WIDTH, height: HEIGHT }}>
      <svg className="wgd-cord__svg" viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} aria-hidden="true">
        <polyline
          ref={lineRef}
          points={Array.from({ length: SEGMENTS + 1 }, (_, i) => `${ANCHOR_X},${i * SEG_LEN}`).join(' ')}
        />
      </svg>
      <button
        ref={knobRef}
        type="button"
        className="wgd-cord__knob"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        style={{ transform: `translate(${ANCHOR_X - KNOB / 2}px, ${REST - KNOB / 2}px)` }}
      />
    </div>
  )
}
