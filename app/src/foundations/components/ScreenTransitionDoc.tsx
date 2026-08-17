import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// Navigator transition spec - reproduce, do not port.
// (ASSUMED Expo Router v6 / native-stack, open questions 15 and 16:
// either the navigator's animation options get you close enough, or the
// transition is built custom in Reanimated to hit these numbers exactly.)

// PUSH (tab -> detail):
//   arriving screen: translateX from +100% (the trailing edge) to 0
//   leaving screen:  translateX 0 -> -25% (parallax), blur 0 -> 3
//   the arriving screen renders ON TOP; 250ms, cubic-bezier(0.22,1,0.36,1)
// POP (back):
//   the exact reverse, with the LEAVING screen on top travelling off
// TAB <-> TAB: no slide. Tabs are siblings: the arriving tab plays the
//   screen enter (rise-and-fade); see Screen scaffold.
// TAB BAR: drops off the bottom edge on push and rides back on pop, in
//   lockstep with the slide - same clock, same ease, no fade.
// RTL: "deeper" is off the trailing edge, so both distances are signed
//   and flip with the writing direction.
// REDUCED MOTION: the slide is DROPPED, not shortened - landing on the
//   destination is the point.
// BACK GESTURE: the platform's own back swipe must run this same pop.
//
// What does NOT cross: the two alternating slot layers, the monotonic
// history index, holding the outgoing screen for the animation's length.
// That machinery exists only because the browser's Back button does not
// say which way it went. The navigator already knows.`

const SlideDemo = () => {
  const [nav, setNav] = useState<'push' | 'pop'>('push')
  const [tick, setTick] = useState(0)
  const go = (dir: 'push' | 'pop') => {
    setNav(dir)
    setTick((t) => t + 1)
  }
  const tab = (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong style={{ fontSize: 15 }}>Home</strong>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>The tab you left recedes a quarter frame and softens.</span>
      <span className="wg-chip blue sm">
        <Icon name="home" size={22} variant="duotone" />
      </span>
    </div>
  )
  const detail = (
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <strong style={{ fontSize: 15 }}>Bills</strong>
      <span style={{ fontSize: 12.5, color: 'var(--muted)' }}>The detail arrives from the trailing edge, over everything.</span>
      <span className="wg-chip sand sm">
        <Icon name="receipt" size={22} variant="duotone" />
      </span>
    </div>
  )
  return (
    <>
      <div className="wgd-playbar" role="group" aria-label="direction">
        <button type="button" className="wgd-play" aria-pressed={nav === 'push'} onClick={() => go('push')}>
          push
        </button>
        <button type="button" className="wgd-play" aria-pressed={nav === 'pop'} onClick={() => go('pop')}>
          pop
        </button>
      </div>
      <Stage ground="panel">
        <div
          style={{
            position: 'relative',
            isolation: 'isolate',
            width: '100%',
            maxWidth: 340,
            height: 180,
            borderRadius: 16,
            overflow: 'hidden',
            background: 'var(--canvas)',
          }}
        >
          <div className="wm-stack" data-nav={nav} key={tick}>
            <div className="wm-screen" data-role="out" style={{ background: nav === 'push' ? 'var(--canvas)' : 'var(--home-surface)' }}>
              {nav === 'push' ? tab : detail}
            </div>
            <div className="wm-screen" data-role="in" style={{ background: nav === 'push' ? 'var(--home-surface)' : 'var(--canvas)' }}>
              {nav === 'push' ? detail : tab}
            </div>
          </div>
        </div>
      </Stage>
    </>
  )
}

export const ScreenTransitionDoc = () => (
  <>
    <p className="wgd-lead">
      Going a level deeper slides the new screen in from the trailing edge while the one you left
      recedes behind it; back plays it in reverse. This page is a motion contract: the numbers cross
      to the native navigator, the browser machinery underneath them does not.
    </p>

    <DocSection title="Specimen">
      <SlideDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Push', spec: 'The arriving screen slides from +100% (the trailing edge) to rest, on top of everything, tab bar included. The screen left behind recedes 25% and takes a 3px blur.' },
          { part: 'Pop', spec: 'The exact reverse - and it is the leaving screen that travels, over the one being revealed.' },
          { part: 'Clock', spec: '250ms (--page-slide-dur), cubic-bezier(0.22, 1, 0.36, 1) (--page-slide-ease), both directions, both screens.' },
          { part: 'Tab bar', spec: 'Drops off the bottom edge on push and rides back on pop, in lockstep with the slide. No fade.' },
          { part: 'Tabs', spec: 'Tab to tab is not a push: the arriving tab plays the rise-and-fade screen enter instead, and nothing slides.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Direction', rule: 'Computed from history, never from comparing routes - which is why the browser\'s own Back button animates correctly today, and why the platform back gesture must run the same pop natively.' },
          { state: 'While sliding', rule: 'The screen that is leaving answers no taps, and the arriving screen suppresses its own rise-and-fade - the slide is the arrival.' },
          { state: 'RTL', rule: 'Both distances are signed: deeper is off the trailing edge, so the whole transition mirrors with the writing direction and the keyframes never know.' },
          { state: 'Reduced motion', rule: 'The slide is dropped, not shortened. Landing on the destination is the whole point.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --page-slide-dur (250ms), --page-slide-distance (100%), --page-parallax (25%), --page-blur
        (3px), --page-slide-ease. Deliberately off the --distance-* scale: those describe motion
        within a screen, not a screen-sized push.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Port the numbers, not the mechanism. The two alternating slot layers and the monotonic history
        index exist only because a browser's Back button does not say which way it went - the native
        navigator already knows its direction. What must survive exactly: 250ms, the ease, the 25%
        parallax with its blur, the top-screen rule per direction, the tab bar in lockstep, and the
        signed RTL distances.
      </Trap>
      <Contract label="navigator transition spec" code={CONTRACT} />
    </DocSection>
  </>
)
