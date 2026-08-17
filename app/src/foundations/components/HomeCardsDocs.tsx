import type { CSSProperties } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const DAY_CONTRACT = `// wg/DayCard.tsx - implement to match.

interface DayCardProps {
  needYou: number          // "{n} need you" - ONE translatable string,
                           // never split into numeral + unit ([D-003])
  handled: number
  total: number
  onPress: () => void
}

// Geometry, from the theme:
//   card: the day tint (dayBg/dayInk - its own hue, not one of the six
//   chip tones), radius lg, padding 16, overflow hidden (the foot band
//   runs to three edges); press scales to 0.98
//   top row: the sun chip (dayDisc ground, dayStrong glyph) and a chevron
//   at 0.45 of the card's own colour - never grey
//   label 13/500 at 0.8; figure 19/500
//   foot: a full-bleed band (dayFoot - it LIFTS, both themes) holding the
//   legend (11.5 label, 12.5/600 count) and the meter
//
// The meter: SIXTEEN discrete ticks (a count of the day being closed out,
// not a progress bar), fixed 4 gaps, ticks flex - a narrower card thins
// the ticks, never drops one. Two identical rows, the lit one clipped
// over the unlit, and the clip opens across the row over 900ms
// cubic-bezier(0.2, 0.7, 0.2, 1) - each tick comes up whole as it passes,
// so the segmentation staggers itself. Deliberately OFF the motion scale:
// those tokens describe interface motion, not a figure drawing itself.
//
// The sun turns once per 24s, linear, forever - ambient, the card's one
// sign of life, timed to be noticed only if you look. Reduced motion
// stills it and places the meter.`

const METRIC_CONTRACT = `// wg/MetricPill.tsx - implement to match.

type MetricTone = 'teal' | 'amber' | 'violet'

interface MetricPillProps {
  tone: MetricTone
  icon: IconName
  label: string
  value: string
  unit?: string            // "to reply" - rides beside the figure
  fill: number             // 0..1, the two-tone progress band
  connected?: boolean      // false: value becomes a quiet Connect line
  onPress: () => void      // each pill is a door to its tab
}

// Geometry, from the theme:
//   pill: the tone's bg/ink pair, radius lg, padding 8/12/8/8; press
//   scales to 0.98. Column form at the lg widget rung; a row of three
//   folds each pill to a stacked label + value.
//   disc: 40, the tone's pale disc with its deep duotone glyph
//   label 11.5/500 at 0.85; figure 20/500; unit 13/400 at 0.8
//
// The fill: a full-height band growing from the start edge to fill%,
// UNDER the content, in the tone's vibrant fill colour - 900ms
// cubic-bezier(0.2, 0.7, 0.2, 1) on mount, staggered 90ms per pill.
// Off the motion scale for the same reason as the day meter.
//
// The unit is centred against the figure (vertical middle), NOT
// baseline-aligned: Arabic and Urdu drop real ink below the baseline and
// read as slipped beside a 20 figure. One rule, no per-script nudges -
// natively, center-align the two Texts in a row.
//
// Not connected: the figure is replaced by a 16/500 Connect line in the
// tone's deep colour and the band stays empty.`

const INSIGHT_CONTRACT = `// wg/InsightCard.tsx - implement to match.

interface InsightCardProps {
  tag: string              // the lavender .wg-tag badge ("Focus")
  title: string            // 23/400 - the card speaks a headline
  body: string
  items?: { icon: ReactNode; title: string; meta: string }[]
  cta?: ReactNode          // the WhatsApp handoff Button, full width
  onMore?: () => void      // the quiet "..." affordance
}

// Geometry, from the theme:
//   card: homeSurface, radius XL - the roomiest card on Home - padding 16
//   top row: the Tag pill and a muted "..." pushed apart, 12 below
//   title 23/400 / 1.15, -0.01em; body 14 muted / 1.45, 16 below
//   items: panelInner rows, radius lg, padding 12, gap 12 - 15/500 title
//   over a 12.5 muted meta
//   cta: 12 above-gap
//
// Wingman's Day wears the same card with its Tag re-toned to sand so the
// two badges never echo each other in the feed.`

const dayVars = { '--fill': '56%' } as CSSProperties

const DayDemo = () => (
  <Stage ground="panel">
    <button type="button" className="wg-daycard wg-card-line" style={{ maxWidth: 220 }}>
      <span className="wg-daycard__top">
        <span className="wg-chip sm">
          <Icon name="sun" size={20} variant="duotone" />
        </span>
        <Icon name="chevronRight" size={18} className="chev" />
      </span>
      <span className="wg-daycard__tx">
        <strong>Today's Snapshot</strong>
        <b>3 need you</b>
      </span>
      <span className="wg-daycard__foot">
        <span className="wg-daycard__legend">
          <small>Handled</small>
          <em>9 of 16</em>
        </span>
        <span className="wg-daycard__bar">
          {Array.from({ length: 16 }, (_, i) => (
            <span key={i} />
          ))}
          <i style={dayVars}>
            {Array.from({ length: 16 }, (_, i) => (
              <span key={i} />
            ))}
          </i>
        </span>
      </span>
    </button>
  </Stage>
)

const METRICS = [
  { tone: 'teal', icon: 'mail', label: 'Email', value: '8', unit: 'to reply', fill: '62%' },
  { tone: 'amber', icon: 'task', label: 'Tasks', value: '5', unit: 'open', fill: '38%' },
  { tone: 'violet', icon: 'calendar', label: 'Events', value: '3', unit: 'today', fill: '75%' },
] as const

const MetricDemo = () => (
  <Stage ground="panel">
    <div className="wg-metrics" style={{ width: '100%', maxWidth: 260 }}>
      {METRICS.map((m, i) => (
        <button
          type="button"
          className={`wg-metric ${m.tone}`}
          key={m.label}
          style={{ '--fill': m.fill, '--fill-delay': `${i * 90}ms` } as CSSProperties}
        >
          <span className="wg-metric__fill" />
          <span className="wg-metric__icon">
            <Icon name={m.icon} size={22} variant="duotone" />
          </span>
          <span className="wg-metric__tx">
            <small>{m.label}</small>
            <b>
              {m.value}
              <span>{m.unit}</span>
            </b>
          </span>
        </button>
      ))}
    </div>
  </Stage>
)

const InsightDemo = () => (
  <Stage ground="panel">
    <div className="wg-insight wg-card-line" style={{ maxWidth: 380 }}>
      <div className="wg-insight__top">
        <span className="wg-tag">
          <Icon name="spark" size={14} variant="duotone" />
          Focus
        </span>
        <span className="wg-insight__more">...</span>
      </div>
      <h3 style={{ margin: '0 0 var(--space-4)', font: 'inherit' }}>
        <span style={{ display: 'block', fontSize: 23, fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
          Chase the bank before Friday
        </span>
      </h3>
      <p>The mortgage papers stall everything else this week. One call clears it, and I have the number ready.</p>
      <div className="wg-insight__item">
        <span className="wg-chip blue xs">
          <Icon name="calendar" size={17} variant="duotone" />
        </span>
        <span className="tx">
          <strong>Call the bank</strong>
          <small>Ten minutes, before their lines close at 5</small>
        </span>
      </div>
    </div>
  </Stage>
)

export const DayCardDoc = () => (
  <>
    <p className="wgd-lead">
      Home's read of the whole day in one card: what today is, how many things need you, and a
      sixteen-tick meter of the day being closed out. Its sun turns once every 24 seconds - the one
      ambient motion in the app, alive only if you look at it.
    </p>

    <DocSection title="Specimen">
      <DayDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'The day tint (--day-bg / --day-ink) - the card\'s own hue, not one of the six chip tones. Radius lg, padding --space-16, overflow hidden; press scales to 0.98.' },
          { part: 'Top row', spec: 'The sun chip (--day-disc ground, --day-strong glyph, the tile chip size) and a chevron at 0.45 opacity in the card\'s own colour - a grey chevron would be the one thing not belonging to the tint.' },
          { part: 'Readout', spec: 'A 13/500 label at 0.8, then the 19/500 figure - "{n} need you" stays one translatable string, never a split numeral ([D-003]).' },
          { part: 'Foot band', spec: 'Full-bleed (--day-foot), lifting rather than darkening in both themes, so the split between "what today is" and "how it is going" is structural.' },
          { part: 'Meter', spec: 'Sixteen discrete ticks, fixed --space-4 gaps, ticks flex - a narrower card thins them, never drops one. Two identical rows; the lit row is clipped over the unlit one.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Meter draw', rule: 'The clip opens across the row over 900ms with cubic-bezier(0.2, 0.7, 0.2, 1); each tick comes up whole as it passes, so the segmentation staggers itself. Deliberately off the motion scale: a figure drawing itself is not interface motion.' },
          { state: 'The sun', rule: 'One full turn per 24s, linear, forever - eased rotation stutters where a loop closes. Ambient: fast enough to be alive, slow enough that nothing competes.' },
          { state: 'Press', rule: 'The card goes somewhere (Attention), so it answers the press like the metric pills: scale 0.98.' },
          { state: 'Reduced motion', rule: 'The sun stills; the meter places at its value.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --day-bg, --day-ink, --day-disc, --day-strong, --day-foot, --day-track, --sun-turn,
        --ease-linear, --radius-lg, --radius-pill, --space-4/8/12/16, --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The tick draw is a clip revealing a pre-laid row, not sixteen individually animated views -
        port it as one animated clip (or width mask) over the lit row, and the stagger costs nothing.
        Sixteen delayed animations is the expensive, drifting version of the same picture.
      </Trap>
      <Contract label="wg/DayCard.tsx" code={DAY_CONTRACT} />
    </DocSection>
  </>
)

export const MetricPillDoc = () => (
  <>
    <p className="wgd-lead">
      The three count pills: email, tasks, events - each a tinted card whose ground fills to its
      figure like a gauge, each a door to its tab. Three tones of their own (teal, amber, violet),
      sampled for vibrancy, separate from the six chip tones.
    </p>

    <DocSection title="Specimen">
      <MetricDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Pill', spec: 'The tone\'s bg and ink pair, radius lg, padding 8 / 12 / 8 / 8; press scales to 0.98. A column of three at the lg widget rung; the md rung folds them to a row of three stacked pills.' },
          { part: 'Fill', spec: 'A full-height band under the content, growing from the start edge to the value in the tone\'s vibrant fill colour.' },
          { part: 'Disc', spec: '40 circle: the tone\'s pale disc with its deep duotone glyph - the same pale-disc-plus-deep-glyph recipe the day card uses.' },
          { part: 'Text', spec: 'Label 11.5/500 at 0.85; figure 20/500; unit 13/400 at 0.8 beside it.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Fill draw', rule: '0 to value over 900ms with cubic-bezier(0.2, 0.7, 0.2, 1), staggered 90ms per pill on mount. Off the motion scale, same reasoning as the day meter.' },
          { state: 'Mixed scripts', rule: 'The unit centres against the figure instead of sharing its baseline: Arabic and Urdu drop real ink below the baseline and read as slipped beside a 20px figure. One rule covers every script.' },
          { state: 'Not connected', rule: 'The figure becomes a quiet 16/500 Connect line in the tone\'s deep colour; the band stays empty. The pill then leads to More instead of its tab.' },
          { state: 'Reduced motion', rule: 'The band places at its value.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --metric-teal/amber/violet (each with -fill, -disc, -ink, -icon), --metric-veil, --radius-lg,
        --radius-pill, --space-4/8/12, --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/MetricPill.tsx" code={METRIC_CONTRACT} />
    </DocSection>
  </>
)

export const InsightCardDoc = () => (
  <>
    <p className="wgd-lead">
      Wingman's one recommendation for the day: a badge, a headline, why it matters, and at most a
      short list of the steps - the roomiest card on Home, and the only one set at radius XL. Business
      restates it for the business day with its own copy of the anatomy.
    </p>

    <DocSection title="Specimen">
      <InsightDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Home-surface, --radius-xl (the roomiest card on Home), hairline, padding --space-16.' },
          { part: 'Top row', spec: 'The Tag pill (lavender "Focus") and a muted "..." affordance pushed apart, --space-12 below. Wingman\'s Day re-tones its Tag to sand so the two badges never echo in the feed.' },
          { part: 'Title', spec: '23/400 / 1.15, -0.01em - a headline, not a label.' },
          { part: 'Body', spec: '14 muted / 1.45, --space-16 below. Why this, why today.' },
          { part: 'Items', spec: 'Optional step rows on --panel-inner at radius lg, padding 12: a 15/500 title over a 12.5 muted meta, led by a chip.' },
          { part: 'CTA', spec: 'The WhatsApp handoff Button (wg-btn full wa), --space-12 above.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'One per day', rule: 'The card holds a single recommendation; a second insight is tomorrow\'s. The steps list stays short - it is a push, not a plan.' },
          { state: 'Not pressable', rule: 'The card itself is not a target; the CTA and the "..." are.' },
          { state: 'Bare in the grid', rule: 'As a dashboard widget it rides a bare cell: this card is its own surface.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --panel-inner, --chip-lavender, --tone-lavender, --muted,
        --radius-xl, --radius-lg, --radius-pill, --space-4/8/12/16.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/InsightCard.tsx" code={INSIGHT_CONTRACT} />
    </DocSection>
  </>
)
