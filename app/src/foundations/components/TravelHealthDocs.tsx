import { Icon } from '../../app/icons'
import { Note } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const TRIP_CONTRACT = `// wg/TripCard.tsx - implement to match.

interface TripCardProps {
  from: string             // "KHI" - the airport codes are the display
  to: string
  meta: string             // dates, airline, one line
  away: string             // "In 12 days"
  state?: string           // "Nothing booked yet" - a state, not a warning
  onPress?: () => void
}

// Geometry, from the theme:
//   card: homeSurface, radius lg, hairline, padding 16
//   route: the two codes at 26/400 (+0.01em - codes read better spaced)
//   with the flight line between: a 2 dotted track line each side and
//   the plane glyph riding the middle, rotated 45deg to level out (the
//   glyph is drawn climbing) and painted accent
//   meta: 13.5 muted, 12 above
//   foot: split off above an inset line hairline (16 above, 12 padding):
//   the 13.5/500 "away" line and, when nothing is booked, a quiet
//   cardTonal state pill
//
// RTL: the dotted run is symmetric so only the plane flips - mirror the
// glyph's rotation with the writing direction.`

const SPARK_CONTRACT = `// wg/Sparkline.tsx - implement to match.

interface SparklineProps {
  values: number[]         // normalised 0..1, one bar each
  goodIndex?: number       // the bar that carries the accent (last night)
}

// Geometry, from the theme:
//   a 34-high flex row at gap 4; bars flex equally, radius xs
//   bar ground lineStrong; the highlighted bar takes the accent
//   height = value * 34, bottom-aligned
//
// It is a glance, not a chart: no axis, no labels, no tooltip. The
// numbers it summarises are on the rows beside it. Health's week strip
// (the bigger bars with the dashed goal line) is its grown-up sibling
// and stays screen-local.`

const TripDemo = () => (
  <Stage ground="panel">
    <div className="wg-trip wg-card-line" style={{ width: '100%', maxWidth: 360 }}>
      <div className="wg-trip__route">
        <span className="wg-trip__code">KHI</span>
        <span className="wg-trip__line" aria-hidden="true">
          <Icon name="plane" size={18} variant="duotone" />
        </span>
        <span className="wg-trip__code">DXB</span>
      </div>
      <p className="wg-trip__meta" style={{ margin: 'var(--space-12) 0 0' }}>
        28 Aug to 2 Sep, Emirates, one bag checked
      </p>
      <div className="wg-trip__foot">
        <span className="wg-trip__away">In 12 days</span>
        <span className="wg-trip__state">Hotel not booked yet</span>
      </div>
    </div>
  </Stage>
)

const BARS = [0.55, 0.7, 0.45, 0.8, 0.6, 0.35, 0.9]

const SparkDemo = () => (
  <Stage ground="home">
    <div style={{ width: '100%', maxWidth: 280 }}>
      <div className="wg-spark" style={{ marginTop: 0 }}>
        {BARS.map((v, i) => (
          <span key={i} className={`wg-spark__bar${i === BARS.length - 1 ? ' good' : ''}`} style={{ height: `${v * 100}%` }} />
        ))}
      </div>
    </div>
  </Stage>
)

export const TripCardDoc = () => (
  <>
    <p className="wgd-lead">
      The one expressive element on the Travel screen: two airport codes with a dotted flight line
      between them, the plane riding its middle. Everything else on the card is quiet facts - and
      "nothing booked yet" is stated as a state, never as a warning.
    </p>

    <DocSection title="Specimen">
      <TripDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Home-surface, radius lg, hairline, padding --space-16.' },
          { part: 'Route', spec: 'The two codes at 26/400 with +0.01em tracking (codes read better spaced), the flight line flexing between them at gap --space-16.' },
          { part: 'Flight line', spec: 'A 2 dotted --track run each side of the plane glyph, which rides the middle painted --accent and rotated 45 degrees to level out - the glyph is drawn climbing.' },
          { part: 'Meta', spec: '13.5 muted, --space-12 above: dates, airline, one line.' },
          { part: 'Foot', spec: 'Split off above an inset --line hairline: the 13.5/500 countdown, and a quiet --card-tonal state pill when something is still unbooked.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Unbooked', rule: '"Hotel not booked yet" is a muted pill - a state, not a warning. The ask button below the card is where fixing it starts.' },
          { state: 'No trip', rule: 'The Travel module without a trip shows its module rows and empty state; this card renders only when there is a route to draw.' },
          { state: 'RTL', rule: 'The dotted run is symmetric, so only the plane mirrors with the writing direction.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --track, --accent, --card-tonal, --line, --muted, --radius-lg,
        --radius-pill, --space-4/8/12/16.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/TripCard.tsx" code={TRIP_CONTRACT} />
    </DocSection>
  </>
)

export const SparklineDoc = () => (
  <>
    <p className="wgd-lead">
      Seven bars, 34 pixels tall, one accented: the smallest chart the app draws. A glance at the
      week's shape beside a health reading - no axis, no labels, no tooltip, because the numbers it
      summarises are already on the rows around it.
    </p>

    <DocSection title="Specimen">
      <SparkDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'A 34-high flex row at gap --space-4, bottom-aligned, --space-12 above whatever it annotates.' },
          { part: 'Bars', spec: 'Equal flex, --radius-xs, height proportional to the value. Ground --line-strong.' },
          { part: 'The good bar', spec: 'One bar - last night, the current day - takes the --accent. One, not several: the accent is a pointer, not a series.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Static', rule: 'No draw-in, no interaction. It is a glance; the day card\'s meter and the metric fills own the animated-figure language.' },
          { state: 'Sibling', rule: 'Health\'s week strip - bigger bars with the dashed goal line - is the grown-up version and stays local to that screen.' },
          { state: 'RTL', rule: 'The week runs in the writing direction.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--line-strong, --accent, --radius-xs, --space-4/12.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/Sparkline.tsx" code={SPARK_CONTRACT} />
    </DocSection>
  </>
)
