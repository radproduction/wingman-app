
export type SpringConfig = {
  stiffness?: number
  damping?: number
  mass?: number
}

export const SHEET_SPRING: Required<SpringConfig> = { stiffness: 300, damping: 32, mass: 1 }

const STEP = 1 / 240
const MAX_FRAME = 1 / 20
const REST_OFFSET = 0.5
const REST_VELOCITY = 30

export type SpringRun = SpringConfig & {
  from: number
  to: number
  velocity?: number
  onFrame: (value: number) => void
  onRest?: () => void
}

export const spring = ({
  from,
  to,
  velocity = 0,
  stiffness = SHEET_SPRING.stiffness,
  damping = SHEET_SPRING.damping,
  mass = SHEET_SPRING.mass,
  onFrame,
  onRest,
}: SpringRun): (() => void) => {
  let x = from
  let v = velocity
  let last = performance.now()
  let raf = 0
  let done = false

  const tick = (now: number) => {
    if (done) return
    const frame = Math.min((now - last) / 1000, MAX_FRAME)
    last = now

    for (let t = 0; t < frame; t += STEP) {
      const dt = Math.min(STEP, frame - t)
      const a = (-stiffness * (x - to) - damping * v) / mass
      v += a * dt
      x += v * dt
    }

    if (Math.abs(x - to) < REST_OFFSET && Math.abs(v) < REST_VELOCITY) {
      done = true
      onFrame(to)
      onRest?.()
      return
    }

    onFrame(x)
    raf = requestAnimationFrame(tick)
  }

  raf = requestAnimationFrame(tick)

  return () => {
    done = true
    cancelAnimationFrame(raf)
  }
}
