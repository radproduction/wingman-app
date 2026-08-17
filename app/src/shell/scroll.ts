type Spot = {
  route: string
  tops: Record<string, number>
}

const spots = new Map<number, Spot>()

const TRACKS = ['.wg-panel__scroll']

const scrollersIn = (layer: HTMLElement): [string, HTMLElement][] => {
  const found: [string, HTMLElement][] = [['self', layer]]
  for (const sel of TRACKS)
    layer.querySelectorAll<HTMLElement>(sel).forEach((el, i) => found.push([`${sel}#${i}`, el]))
  return found
}

const activeLayer = () => document.querySelector<HTMLElement>('.wm-screen[data-role="in"]')

export const rememberScroll = (idx: number, route: string) => {
  const layer = activeLayer()
  if (!layer) return
  const tops: Record<string, number> = {}
  for (const [key, el] of scrollersIn(layer)) tops[key] = el.scrollTop
  spots.set(idx, { route, tops })
}

const deadline = () => {
  const cs = getComputedStyle(document.documentElement)
  const ms = (name: string, fallback: number) => {
    const v = parseFloat(cs.getPropertyValue(name))
    return Number.isFinite(v) ? v : fallback
  }
  return ms('--skel-hold', 1500) + ms('--reveal-dur', 400) + 200
}

const settle = (el: HTMLElement, target: number) => {
  if (target <= 0) {
    el.scrollTop = 0
    return () => {}
  }
  let applied = -1
  let done = false
  const stop = () => {
    if (done) return
    done = true
    observer.disconnect()
    window.clearTimeout(timer)
  }
  const tick = () => {
    if (done) return
    if (applied >= 0 && el.scrollTop !== applied) return stop()
    el.scrollTop = target
    applied = el.scrollTop
    if (applied >= target - 1) stop()
  }
  const observer = new ResizeObserver(tick)
  for (const child of Array.from(el.children)) observer.observe(child)
  const timer = window.setTimeout(stop, deadline())
  tick()
  return stop
}

export const restoreScroll = (idx: number, route: string, layer: HTMLElement) => {
  const spot = spots.get(idx)
  const want = spot && spot.route === route ? spot : null
  const stops = scrollersIn(layer).map(([key, el]) => settle(el, want?.tops[key] ?? 0))
  return () => stops.forEach((stop) => stop())
}
