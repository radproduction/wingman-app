import type { CSSProperties } from 'react'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const SHEET_CONTRACT = `// wg/Sheet.tsx - implement to match.

interface SheetProps {
  open: boolean
  onClose: () => void      // closing is the CALLER's: a sheet that changed
                           // something usually wants to say so on the way out
  dismissable?: boolean    // default true; a decision in flight opts out
  children: ReactNode
}

// Geometry, from the theme:
//   layer: fills the frame, scrim over everything behind
//   sheet: surface fill, radius xl on the top corners, shadowSheet,
//   max-height 90%; padding 8 / 24 / 24 + max(16, homeIndicator)
//   grabber: a 40 x 4 track-coloured pill on a full-width handle,
//   generous padding (12 above, 16 below) - it is a real handle
//   mark 56 (a connector sheet's subject), title 21/400, body 14/1.5
//   muted; on the sheet the tonal fills re-point to their cool twins
//
// Motion - the asymmetry is the whole design:
//   ENTER: a transition. translateY(14%) + opacity 0.6 -> rest, 250ms,
//   cubic-bezier(0.22, 1, 0.36, 1); the scrim fades in on the same clock.
//   EXIT: NEVER a duration. Every way out (scrim, back gesture, grabber
//   tap, drag, the sheet's own buttons) runs a spring seeded with the
//   gesture's real velocity; an untouched close seeds it at rest. There
//   is no close duration ANYWHERE - do not invent one.
//   DRAG: the sheet tracks the finger 1:1 (no interpolation), the scrim
//   thins with progress; release past 25% of the sheet's height, or a
//   fling over 500 px/s, dismisses - otherwise it springs back.
//
// Keyboard: the sheet lifts by exactly what the keyboard covers.
// Reduced motion: enter places; the drag still tracks (a finger is a
// finger), the spring exit stays (it describes the gesture, not decor).`

const ACTS_CONTRACT = `// wg/SheetActions.tsx - implement to match.

interface SheetActionsProps {
  children: ReactNode      // full-width Buttons, recommendation first
}

// A column at gap 12, set off from the content by a 24 top margin - the
// one place a sheet must not feel crowded.
//
// The three tiers, all full-width Buttons:
//   primary - the recommendation (the default filled Button)
//   quiet   - cardTonal ground, ink text: a real option, not the answer
//   warn    - the sand surface with the warn tone: destructive reads as
//             routine and deliberate, never as an alarm ([D-009])
// Order is meaning: recommendation first, the way out last. Never two
// primaries in one sheet.`

const SheetDemo = () => (
  <Stage ground="home">
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        width: '100%',
        maxWidth: 360,
        height: 400,
        borderRadius: 20,
        overflow: 'hidden',
        background: 'var(--panel)',
      }}
    >
      <div className="wm-sheet-layer in" style={{ '--wm-safe-bottom': '0px' } as CSSProperties}>
        <div className="wm-sheet__scrim" />
        <div className="wm-sheet" role="dialog" aria-modal="true" aria-label="Disconnect Gmail?">
          <button className="wm-sheet__grab" type="button" aria-label="Close">
            <i />
          </button>
          {}
          <div className="wm-sheet__title">Disconnect Gmail?</div>
          <p className="wm-sheet__body-tx">
            I stop reading new mail the moment you do. Everything I already summarised stays until you
            clear it from Memory.
          </p>
          <div className="wm-sheet__acts">
            <button type="button" className="wg-btn full quiet">Keep it connected</button>
            <button type="button" className="wg-btn full warn">Disconnect</button>
          </div>
        </div>
      </div>
    </div>
  </Stage>
)

export const SheetDoc = () => (
  <>
    <p className="wgd-lead">
      The app's one overlay surface: a card that rises from the bottom edge over a scrim, carries one
      subject and its actions, and leaves the way it was thrown - every exit is a spring seeded with
      the gesture's own velocity, and no close duration exists anywhere.
    </p>

    <DocSection title="Specimen">
      <SheetDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Layer', spec: 'Fills the frame above the tab bar; the --scrim covers everything behind. Tonal fills on the sheet re-point to their cool twins.' },
          { part: 'Sheet', spec: '--surface fill, --radius-xl top corners, --shadow-sheet, max-height 90%. Padding --space-8 above, --space-24 sides, --space-24 + max(16, home indicator) at the foot so the last button never touches the indicator.' },
          { part: 'Grabber', spec: 'A 40 by 4 --track pill on a full-width handle with real padding (12 above, 16 below). It closes twice over: tap it, or drag it.' },
          { part: 'Content', spec: 'An optional 56 mark (the connector sheet\'s subject, the row\'s own disc a size up), a 21/400 title, a 14 / 1.5 muted body.' },
          { part: 'Actions', spec: 'The sheet action list (the next page): full-width buttons in a 12-gap column, 24 clear of the content.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'open', type: 'boolean', rn: 'open: boolean', desc: 'Mounting and the enter; the exit keeps it mounted until the spring lands.' },
          { prop: 'onClose', type: '() => void', rn: 'onClose: () => void', desc: 'The caller owns closing - a sheet that changed something says so on the way out.' },
          { prop: 'dismissable', type: 'boolean', default: 'true', rn: 'dismissable?: boolean', desc: 'A decision in flight opts out: no scrim close, no drag, no Escape.' },
          { prop: 'children', type: 'ReactNode', rn: 'children: ReactNode', desc: 'The subject and its actions. One subject per sheet.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Enter', rule: 'A transition, not keyframes: from translateY(14%) at 0.6 opacity to rest over --modal-open-dur (250ms) with --modal-ease; the scrim fades on the same clock. Interrupted mid-enter, the exit leaves from where the sheet actually is.' },
          { state: 'Exit', rule: 'Always the spring, seeded with the gesture\'s velocity - scrim tap, Escape, grabber tap, a drag, the sheet\'s own buttons, all of them. No close duration exists; [D-032].' },
          { state: 'Drag', rule: 'The sheet tracks the finger 1:1 with every transition killed for the length of the gesture; the scrim thins with progress. Past 25% of the sheet\'s height, or a fling over 500 px/s, it dismisses; otherwise it springs home. Lifted above rest, the sheet stretches rather than showing the room behind.' },
          { state: 'Keyboard', rule: 'The sheet lifts by exactly what the soft keyboard covers, like every action bar in the app.' },
          { state: 'Reduced motion', rule: 'The enter places. The drag still tracks and the spring exit stays - they describe the finger, not decoration.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --surface, --scrim, --track, --shadow-sheet, --radius-xl, --space-8/12/16/24,
        --modal-open-dur, --modal-ease, --card-tonal-cool, --track-cool.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Do not reach for a sheet library that closes on a duration - the exit spring seeded with the
        drag's release velocity IS the component. Build the gesture with Gesture Handler and the spring
        in Reanimated (or use a library that exposes velocity-seeded dismissal), and keep the sheet
        mounted until the spring lands, or the content vanishes mid-flight.
      </Trap>
      <Contract label="wg/Sheet.tsx" code={SHEET_CONTRACT} />
    </DocSection>
  </>
)

export const SheetActionsDoc = () => (
  <>
    <p className="wgd-lead">
      The stacked actions at the foot of every sheet: full-width buttons in one column, the
      recommendation first, the way out last. Three tiers - primary, quiet, warn - and never two
      primaries in one sheet.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div style={{ width: '100%', maxWidth: 340, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-16) var(--space-24) var(--space-24)' }} className="wg-card-line">
          <div className="wm-sheet__acts" style={{ marginTop: 0 }}>
            <button type="button" className="wg-btn full">Approve and send</button>
            <button type="button" className="wg-btn full quiet">Change something</button>
            <button type="button" className="wg-btn full warn">Dismiss it</button>
          </div>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Stack', spec: 'A column at gap --space-12, set off from the sheet\'s content by a --space-24 top margin. No button carries its own margin.' },
          { part: 'Primary', spec: 'The default filled Button, full width. The recommendation - at most one per sheet.' },
          { part: 'Quiet', spec: '--card-tonal ground with ink text; presses to --track. A real option that is not the answer.' },
          { part: 'Warn', spec: 'The sand surface (--chip-sand) with the --warn tone; presses to --warn-tonal. Destructive reads as routine and deliberate, never as an alarm ([D-009]).' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Order', rule: 'Order is meaning: recommendation first, alternatives under it, the way out last. The eye lands on the top button.' },
          { state: 'Dismiss vs destroy', rule: 'Closing the sheet without choosing is the grabber\'s job, not a button\'s - a "Cancel" button appears only when cancelling is itself a decision.' },
          { state: 'One decision', rule: 'A sheet asks one thing. If the action list wants a second primary, it is two sheets.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--card-tonal, --track, --chip-sand, --warn, --warn-tonal, --space-12/24, plus the Button's own tokens.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/SheetActions.tsx" code={ACTS_CONTRACT} />
    </DocSection>
  </>
)
