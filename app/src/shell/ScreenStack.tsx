import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { getIdx, type NavDir } from './nav'
import { restoreScroll } from './scroll'


export const slideMs = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--page-slide-dur')) || 250

type Slots = [string | null, string | null]

export const ScreenStack = ({
  route,
  dir,
  render,
  stackRef,
}: {
  route: string
  dir: NavDir
  render: (route: string) => ReactNode
  stackRef: (el: HTMLDivElement | null) => void
}) => {
  const [state, setState] = useState<{ slots: Slots; active: 0 | 1; exiting: 0 | 1 | null; dir: NavDir }>({
    slots: [route, null],
    active: 0,
    exiting: null,
    dir: 'none',
  })

  const shown = state.slots[state.active]
  if (shown !== route) {
    if (dir === 'push' || dir === 'pop') {
      const next = (1 - state.active) as 0 | 1
      const slots: Slots = [...state.slots] as Slots
      slots[next] = route
      setState({ slots, active: next, exiting: state.active, dir })
    } else {
      const slots: Slots = [...state.slots] as Slots
      slots[state.active] = route
      slots[1 - state.active] = null
      setState({ slots, active: state.active, exiting: null, dir })
    }
  }

  useEffect(() => {
    if (state.exiting === null) return
    const timer = window.setTimeout(() => {
      setState((s) => {
        if (s.exiting === null) return s
        const slots: Slots = [...s.slots] as Slots
        slots[s.exiting] = null
        return { ...s, slots, exiting: null }
      })
    }, slideMs())
    return () => window.clearTimeout(timer)
  }, [state.exiting, state.slots])

  return (
    <div className="wm-stack" data-nav={state.dir} ref={stackRef}>
      {([0, 1] as const).map((i) =>
        state.slots[i] === null ? null : (
          <Layer
            key={i}
            route={state.slots[i]!}
            role={i === state.active ? 'in' : 'out'}
            render={render}
          />
        ),
      )}
    </div>
  )
}

const Layer = ({
  route,
  role,
  render,
}: {
  route: string
  role: 'in' | 'out'
  render: (route: string) => ReactNode
}) => {
  const el = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => (el.current ? restoreScroll(getIdx(), route, el.current) : undefined), [route])

  return (
    <div className="wm-screen" data-role={role} aria-hidden={role === 'out' || undefined} ref={el}>
      {}
      <Fragment key={route}>{render(route)}</Fragment>
    </div>
  )
}
