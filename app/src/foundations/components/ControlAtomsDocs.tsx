import { useState, type CSSProperties } from 'react'
import { Switch } from '../../shell/Switch'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'


const SWITCH_CONTRACT = `// wg/Switch.tsx - implement to match.
interface SwitchProps {
  on: boolean
  disabled?: boolean   // quiet track; the ROW refuses the tap
}
// The row owns the press target and the label; this is only the pill.
//
// Disabled (product decision, 2026-08-16): the track drops to cardTonal
// whichever value it holds - the knob's POSITION still tells on/off, so the
// value survives without a live colour, and the flat ground says "not
// pressable" the same way a disabled Button does. The knob stays white. The
// row carries disabled for real (no press, accessibilityState disabled);
// prefer hiding a row that can never apply over disabling it - a disabled
// switch is for "not right now", not "not for you".
//
// Geometry: track 46x28, radius pill, knob 22 circle inset 3 (an optical
// carve-out, deliberately off the spacing grid). Knob is theme.palette.*.knob
// - WHITE IN BOTH THEMES, on purpose: a knob the colour of its own card
// vanishes into its track on charcoal. Track: track colour off, accent on.
//
// Motion (motion.named.toggle): the knob travels 18 with a double bounce -
// past the far end by ov1, back short by ov2, then settle - over toggleDur
// with the toggle ease. The travel is SIGNED: it flips under RTL.
//
// The is-init guard, kept: a keyframe bound to a resting state plays on
// mount, so a settings screen with six switches would open with six knobs
// bouncing back from nowhere. Only animate once the value has actually
// changed. Reduced motion: place, do not animate.`

export const SwitchDoc = () => {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <>
      <p className="wgd-lead">
        The app's one toggle. The row owns the press target and the label; the switch is only the pill,
        and its knob travels with a double bounce that only ever describes something you did.
      </p>
      <DocSection title="Specimen">
        <Stage ground="home">
          {}
          <button type="button" onClick={() => setA(!a)} style={{ display: 'flex', alignItems: 'center', border: 0, background: 'none', padding: 8, cursor: 'pointer' }} aria-pressed={a} aria-label="demo switch on">
            <Switch on={a} />
          </button>
          <button type="button" onClick={() => setB(!b)} style={{ display: 'flex', alignItems: 'center', border: 0, background: 'none', padding: 8, cursor: 'pointer' }} aria-pressed={b} aria-label="demo switch off">
            <Switch on={b} />
          </button>
          <span style={{ display: 'flex', alignItems: 'center', padding: 8 }} aria-label="disabled on">
            <Switch on disabled />
          </span>
          <span style={{ display: 'flex', alignItems: 'center', padding: 8 }} aria-label="disabled off">
            <Switch on={false} disabled />
          </span>
        </Stage>
        <Note>
          Tap the first two: past the far end, back short of it, then settle - and on first render nothing
          moves, because the bounce only plays for a change you made. The last two are disabled, on and
          off: one quiet ground for both, with the knob's position still telling the value.
        </Note>
      </DocSection>
      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Track', spec: '46x28 pill. --track off, --accent on, recoloured over --toggle-track with the toggle ease.' },
            { part: 'Knob', spec: '22 circle, inset 3 (an optical carve-out, off the spacing grid on purpose), --knob - white in BOTH themes.' },
            { part: 'Travel', spec: '18 (--toggle-travel), signed: it reverses under RTL. Double bounce: overshoot --toggle-ov1, return --toggle-ov2, settle, all inside --toggle-dur.' },
            { part: 'Disabled', spec: 'The track drops to --card-tonal whichever value it holds - the same ground a disabled Button wears. The knob stays --knob white; its position still tells on/off.' },
          ]}
        />
      </DocSection>
      <DocSection title="Props">
        <PropsTable
          rows={[
            { prop: 'on', type: 'boolean', rn: 'on: boolean', desc: 'The value. State lives in the row that owns the label and the press.' },
            { prop: 'disabled', type: 'boolean', default: 'false', rn: 'disabled?: boolean', desc: 'Quiet track; the ROW refuses the tap and carries the accessibility state. Added by product decision, 2026-08-16.' },
          ]}
        />
      </DocSection>
      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'Mount', rule: 'No animation. The is-init guard exists because a keyframe bound to a resting state plays on mount - six switches would bounce from nowhere.' },
            { state: 'Disabled', rule: 'For "not right now" (saving, a dependency off), never "not for you" - a row that can never apply is hidden, not greyed. Value stays legible by knob position.' },
            { state: 'Reduced motion', rule: 'The knob places instead of travelling. Both layers.' },
            { state: 'RTL', rule: 'The travel flips sign; the app multiplies by --dir, native flips the offset by hand (transforms know nothing about direction).' },
          ]}
        />
      </DocSection>
      <DocSection title="React Native">
        <Contract label="wg/Switch.tsx" code={SWITCH_CONTRACT} />
      </DocSection>
    </>
  )
}


const PROGRESS_CONTRACT = `// wg/Progress.tsx - implement to match.
interface ProgressProps { steps: number; done: number }
// A flex row, gap 4; each step flex 1, height 4, radius pill.
// cardTonal unfilled, accent filled; a step recolours over durationMedium
// with the standard ease when it fills. No numbers, no percentage text -
// the bar IS the statement.`

export const ProgressDoc = () => {
  const [done, setDone] = useState(3)
  return (
    <>
      <p className="wgd-lead">
        Segmented progress: one bar per step, filled steps in accent. It lives in the onboarding top bar,
        where the frame stays still and only this fills.
      </p>
      <DocSection title="Specimen">
        <div className="wgd-playbar">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button key={n} type="button" className="wgd-play" aria-pressed={done === n} onClick={() => setDone(n)}>
              {n}
            </button>
          ))}
        </div>
        <Stage ground="panel">
          <div className="wg-track" style={{ width: 320 }}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <i key={n} className={n <= done ? 'on' : undefined} />
            ))}
          </div>
        </Stage>
      </DocSection>
      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Steps', spec: 'Equal flex children on a --space-4 gap, height 4, radius pill.' },
            { part: 'Fill', spec: '--card-tonal to --accent, transitioning over --duration-medium with --ease when a step completes.' },
          ]}
        />
      </DocSection>
      <DocSection title="Behaviour">
        <Behaviour rows={[{ state: 'Onboarding', rule: 'On step navigation only the centre column animates; this bar and the action bar stay static so the frame reads as stable.' }]} />
      </DocSection>
      <DocSection title="React Native">
        <Contract label="wg/Progress.tsx" code={PROGRESS_CONTRACT} />
      </DocSection>
    </>
  )
}


const DOTS_CONTRACT = `// wg/PageDots.tsx - implement to match.
interface PageDotsProps { count: number; index: number; onPick?: (i: number) => void }
// A flex row, gap 8, centre-aligned. Each dot 6x6, radius pill, track colour.
// The ACTIVE dot stretches to 18 wide and takes accent - width animates over
// durationFast, colour over durationQuick, both with the standard ease.
// The stretch is a real width change the row reflows around (a scaleX would
// distort the pill's caps), so animate width itself - three dots is well
// inside the layout-animation budget.`

export const PageDotsDoc = () => {
  const [index, setIndex] = useState(0)
  return (
    <>
      <p className="wgd-lead">
        The pager under the intro carousel. The active dot stretches into a short bar and takes the
        accent, so position reads by shape as well as colour.
      </p>
      <DocSection title="Specimen">
        <Stage ground="panel">
          <div className="wg-dots">
            {[0, 1, 2].map((i) => (
              <button key={i} type="button" className={i === index ? 'on' : undefined} aria-label={`page ${i + 1}`} onClick={() => setIndex(i)} />
            ))}
          </div>
        </Stage>
        <Note>Click a dot: the bar hands over - width moves at --duration-fast, colour at --duration-quick.</Note>
      </DocSection>
      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Dot', spec: '6x6, radius pill, --track, on a --space-8 gap.' },
            { part: 'Active', spec: 'Stretches to 18 wide, --accent. Width over --duration-fast, colour over --duration-quick, both --ease.' },
          ]}
        />
      </DocSection>
      <DocSection title="Behaviour">
        <Behaviour rows={[{ state: 'Never colour alone', rule: 'The stretch is the point: the active page reads by shape, which survives every kind of colour vision.' }]} />
      </DocSection>
      <DocSection title="React Native">
        <Contract label="wg/PageDots.tsx" code={DOTS_CONTRACT} />
      </DocSection>
    </>
  )
}


const SLIDER_CONTRACT = `// wg/SteppedSlider.tsx - implement to match.
interface SteppedSliderProps {
  stops: number            // discrete positions (text size ships 7)
  value: number            // 0..stops-1
  onChange: (v: number) => void
}
// Anatomy: a small 'a' (14) leads, a large 'A' (22) trails, both muted; the
// rail between them hosts a 34x26 pill thumb (theme knob colour, the thumb
// shadow) over a 9-high pill bar; one 5x5 track-colour dot hangs under each
// stop, first and last sitting under the thumb's travel limits.
// The bar fills with accent TO THE THUMB'S CENTRE, not to a raw percentage -
// at every stop the join sits under the thumb instead of drifting by half a
// thumb at the ends: at = pos * (railWidth - thumbW) + thumbW / 2.
// Gesture: pan snaps to the nearest stop on release (and slides the thumb
// live while dragging); the fill recolours over durationQuick.
// Accessibility: adjustable role, increment/decrement actions.`

export const SliderDoc = () => {
  const [pos, setPos] = useState(3)
  const stops = 7
  return (
    <>
      <p className="wgd-lead">
        The text-size control: a wide lozenge you slide between discrete stops, the scale stated by a
        small and a large letter A - the only alphabet that needs no translating.
      </p>
      <DocSection title="Specimen">
        <Stage ground="panel">
          <div className="wg-slider" style={{ width: 340 }}>
            <span className="wg-slider__a">A</span>
            <span className="wg-slider__rail" style={{ '--pos': pos / (stops - 1) } as CSSProperties}>
              <span className="wg-slider__bar" />
              <input
                type="range"
                min={0}
                max={stops - 1}
                step={1}
                value={pos}
                aria-label="Text size"
                onChange={(e) => setPos(Number(e.target.value))}
              />
              <span className="wg-slider__dots">
                {Array.from({ length: stops }, (_, i) => (
                  <i key={i} />
                ))}
              </span>
            </span>
            <span className="wg-slider__a lg">A</span>
          </div>
        </Stage>
        <Note>A real range input under the styling: dragging, keyboard and snapping come from the platform, not from a reimplementation.</Note>
      </DocSection>
      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Thumb', spec: 'A 34x26 lozenge, not a knob: it reads as a grip, and it is big enough to press without covering the bar. --knob fill, the thumb shadow.' },
            { part: 'Bar', spec: '9 high, radius pill. Accent fill runs to the THUMB CENTRE, not a raw percentage, so the join never drifts at the ends.' },
            { part: 'Stops', spec: 'One 5x5 --track dot under each, hanging 3 below the rail, first and last under the travel limits.' },
            { part: 'Ends', spec: 'a (14) and A (22), muted - the scale stated without a word of copy.' },
          ]}
        />
      </DocSection>
      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'Snapping', rule: 'Discrete stops; release snaps to the nearest. Seven for text size - three either side of the default, and no further.' },
            { state: 'Focus', rule: 'The thumb carries the focus ring on top of its own shadow.' },
          ]}
        />
      </DocSection>
      <DocSection title="React Native">
        <Trap>
          The fill-to-thumb-centre formula is the part a port gets wrong first:{' '}
          <code>at = pos * (railWidth - thumbW) + thumbW / 2</code>. Fill to a raw percentage and the
          join drifts by half a thumb at either end.
        </Trap>
        <Contract label="wg/SteppedSlider.tsx" code={SLIDER_CONTRACT} />
      </DocSection>
    </>
  )
}
