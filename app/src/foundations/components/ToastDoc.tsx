import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/toast.ts - implement to match.

toast(text: string, icon?: IconName, ms?: number, action?: {
  label: string            // one word ("Undo")
  onAct: () => void
})

// A module function, not a component: anywhere in the app announces with
// one call, and the single host renders it. One toast at a time - a new
// call replaces the current one. Default life 2600ms.
//
// Geometry, from the theme:
//   layer: centred above the tab bar (tabbarClearance + 6); on tabless
//   screens (the detail layer) it drops to the home indicator + 16.
//   The layer is inert; the toast itself accepts taps only for its action.
//   slab: toastBg (the one inverted surface in the app), onInk text
//   13.5 / 1.4, radius lg, padding 12 / 16, shadowToast; the icon leads,
//   nudged 4 down onto the first line
//   action: one word, 13.5/600, in the pale canvas tone - the accent
//   does not read on the dark slab. Never a second CTA.
//
// Motion - deliberately asymmetric (toast tokens):
//   in:  350ms - rises 16, scales from 0.97, un-blurs from 2
//   out: 250ms - the same road backwards, faster: it must never outstay
//        the thing it announced
//   ease: cubic-bezier(0.22, 1, 0.36, 1) both ways
//
// Reduced motion: place and remove. Accessibility: announce politely
// (accessibilityLiveRegion / AccessibilityInfo.announceForAccessibility).`

const ToastDemo = () => {
  const [on, setOn] = useState(true)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])
  const replay = () => {
    setOn(false)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setOn(true), 350)
  }
  return (
    <>
      <div className="wgd-playbar">
        <button type="button" className="wgd-play" onClick={replay}>
          replay
        </button>
      </div>
      <Stage ground="panel">
        <div className={`wm-toast${on ? ' is-open' : ''}`}>
          <Icon name="checkCircle" size={16} />
          <span>Task added. I set the reminder too.</span>
          <button type="button" className="wm-toast__act">Undo</button>
        </div>
      </Stage>
    </>
  )
}

export const ToastDoc = () => (
  <>
    <p className="wgd-lead">
      The app's way of saying "done" without stopping you: one dark slab floating above the tab bar,
      one message at a time, gone in under three seconds. It arrives slower than it leaves, so landing
      reads as deliberate and leaving never outstays the thing it announced.
    </p>

    <DocSection title="Specimen">
      <ToastDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Layer', spec: 'Centred above the tab bar (--tabbar-clearance + 6). On tabless screens - the detail layer, the gate - it drops to the home indicator + 16. The layer is inert to taps.' },
          { part: 'Slab', spec: '--toast-bg, the one inverted surface in the app, with --on-ink text at 13.5 / 1.4. Radius lg, padding --space-12 by --space-16, --shadow-toast.' },
          { part: 'Icon', spec: 'Leads the text, nudged --space-4 down onto the first line. The caller picks it; check is the default.' },
          { part: 'Action', spec: 'At most one word (Undo): 13.5/600 in a pale canvas tone, because the accent does not read on the dark slab. Never a second CTA.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'text', type: 'string', rn: 'text: string', desc: 'One sentence, in Wingman\'s voice.' },
          { prop: 'icon', type: 'IconName', default: "'check'", rn: 'icon?: IconName', desc: 'The leading glyph.' },
          { prop: 'ms', type: 'number', default: '2600', rn: 'ms?: number', desc: 'How long it stays.' },
          { prop: 'action', type: '{label, onAct}', rn: 'action?: ToastAction', desc: 'The one affordance, for the one case that needs it: undoing.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'In', rule: 'Rises --toast-distance (16), scales from 0.97, un-blurs from 2, over --toast-open (350ms).' },
          { state: 'Out', rule: 'The same road backwards over --toast-close (250ms) - faster on purpose. The asymmetry is the design.' },
          { state: 'One at a time', rule: 'A new toast replaces the current one; nothing queues. If two things finished, the second sentence covers both.' },
          { state: 'When not to', rule: 'A state change the screen already shows needs no toast - marking all read empties the list, and the emptying is the feedback.' },
          { state: 'Reduced motion', rule: 'Place and remove; the life span is unchanged.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --toast-bg, --on-ink, --shadow-toast, --radius-lg, --space-4/8/12/16, --toast-open,
        --toast-close, --toast-distance, --toast-scale, --toast-blur, --toast-ease,
        --tabbar-clearance, --nav-bottom.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The toast is a module function with a single host, not a context consumers subscribe to - port
        that shape, or every screen grows a toast prop. And the blur-in needs the slab on its own
        layer: animate opacity, translateY, scale and (if cheap on the device) a blur; dropping the
        blur is acceptable, reordering the asymmetric timings is not.
      </Trap>
      <Contract label="wg/toast.ts" code={CONTRACT} />
    </DocSection>
  </>
)
