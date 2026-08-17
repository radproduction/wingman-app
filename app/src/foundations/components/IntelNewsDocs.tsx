import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const TL_CONTRACT = `// wg/Timeline.tsx - implement to match.

type TimelineKind = 'decision' | 'completed' | 'recommendation'
  | 'approval' | 'insight'

interface TimelineItemProps {
  kind: TimelineKind
  at: string               // "09:14" - tabular numerals
  text: string
}

// Geometry, from the theme:
//   list: plain, no markers; items at 16 below-padding
//   rail: a 12-wide column per item - the 12 dot (ringed 3 in the
//   surface so the rail line never touches it) and, between items, a
//   2-wide line in the line colour running from under the dot to the
//   next one
//   dot colours BY KIND: decision accent, completed okSoft,
//   recommendation lavender, approval warn, insight peach - the same
//   meanings the State pill vocabulary uses
//   text: the 12/600 muted time (tabular nums), the 14 / 1.45 line
//   under it
//
// The rail is layout, not decoration: the line segment belongs to the
// ITEM (absent on the last), so the list virtualises cleanly.`

const NROW_CONTRACT = `// wg/StoryRow.tsx - implement to match.

interface StoryRowProps {
  tone: ChipTone
  icon: IconName           // the topic's identity chip
  headline: string
  meta: string             // source and age, one line
  tag?: string             // the accent "why you" pill ("Following: AI")
  read?: boolean
  onPress: () => void
}

// Geometry, from the theme:
//   row: panelInner ground (the news list is tonal-on-white), radius lg,
//   padding 16, gap 12, top-aligned; chip nudged 4 down
//   headline 15/500 / 1.34 (-0.01em); meta 12.5 muted, 4 below
//   tag: an 11.5/500 accentDeep-on-accentTonal pill, 4 above, self-start
//   chevron: muted, centred against the row
//
// read: the ground goes transparent behind an inset 1 lineSoft ring -
// the story recedes the way a read notice does. Settled, still legible.`

const TlDemo = () => (
  <Stage ground="home">
    <ul className="wg-tl" style={{ width: '100%', maxWidth: 360 }}>
      {(
        [
          ['decision', '08:02', 'Moved your 9:00 to 9:30 so the school run fits.'],
          ['approval', '09:14', 'Asked you about the electricity bill.'],
          ['completed', '09:31', 'Paid it, the moment you said yes.'],
          ['insight', '11:40', 'Noticed Thursday is your only free evening this week.'],
        ] as const
      ).map(([kind, at, text]) => (
        <li key={at}>
          <span className="wg-tl__mark">
            <span className={`wg-tl__dot ${kind}`} />
          </span>
          <div className="wg-tl__tx">
            <div className="wg-tl__at">{at}</div>
            <div className="wg-tl__text">{text}</div>
          </div>
        </li>
      ))}
    </ul>
  </Stage>
)

const NrowDemo = () => (
  <Stage ground="home">
    <div className="wg-nlist" style={{ width: '100%', maxWidth: 380 }}>
      <button type="button" className="wg-nrow">
        <span className="wg-chip blue sm">
          <Icon name="spark" size={20} variant="duotone" />
        </span>
        <span className="wg-nrow__tx">
          <span className="wg-nrow__head">The quiet shift in how teams use AI assistants</span>
          <span className="wg-nrow__meta">The Verge, 2h</span>
          <span className="wg-nrow__tag">
            <Icon name="spark" size={12} variant="duotone" />
            Following: AI
          </span>
        </span>
        <Icon name="chevronRight" size={18} className="chev" />
      </button>
      <button type="button" className="wg-nrow read">
        <span className="wg-chip mint sm">
          <Icon name="globe" size={20} variant="duotone" />
        </span>
        <span className="wg-nrow__tx">
          <span className="wg-nrow__head">Karachi's new coastal line opens early</span>
          <span className="wg-nrow__meta">Dawn, yesterday</span>
        </span>
        <Icon name="chevronRight" size={18} className="chev" />
      </button>
    </div>
  </Stage>
)

export const TimelineDoc = () => (
  <>
    <p className="wgd-lead">
      What Wingman did today, in order: a dot per event on a hairline rail, coloured by kind -
      decision, completion, recommendation, approval, insight. The receipt that makes an autonomous
      assistant auditable at a glance.
    </p>

    <DocSection title="Specimen">
      <TlDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'List', spec: 'Plain, markerless; items at --space-16 below-padding, none on the last.' },
          { part: 'Rail', spec: 'A 12-wide column: the 12 dot ringed 3 in the surface (the line never touches it), and a 2-wide --line segment running to the next item\'s dot.' },
          { part: 'Dot kinds', spec: 'Decision --accent, completed --ok-soft, recommendation --tone-lavender, approval --warn, insight --tone-peach - the same meanings the State pill speaks in words.' },
          { part: 'Entry', spec: 'The 12/600 muted time in tabular numerals, with the 14 / 1.45 line under it.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Order', rule: 'Chronological, newest last - the day reads downward like a ledger.' },
          { state: 'Kind, not severity', rule: 'The colours classify, they never alarm; an approval\'s amber dot is "this involved you", not a warning.' },
          { state: 'Cross-vocabulary', rule: 'The dot kinds and the State pill share one vocabulary: what the pill says on a row, the dot says in the ledger.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --accent, --ok-soft, --tone-lavender, --warn, --tone-peach, --line, --home-surface, --muted,
        --radius-pill, --space-4/16.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The rail segment belongs to each item (and is absent on the last), not to the list - that is
        what lets the ledger virtualise in a plain FlatList. A single absolutely-positioned rail
        behind the list breaks the moment rows vary in height.
      </Trap>
      <Contract label="wg/Timeline.tsx" code={TL_CONTRACT} />
    </DocSection>
  </>
)

export const StoryRowDoc = () => (
  <>
    <p className="wgd-lead">
      A news story as Wingman curates it: the topic's chip, the headline, source and age, and - when
      it matters - the accent pill saying why this reached you. A read story recedes behind a
      hairline, settled but still legible.
    </p>

    <DocSection title="Specimen">
      <NrowDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: '--panel-inner ground (the news list is tonal-on-white), radius lg, padding --space-16, gap --space-12, top-aligned; the list stacks at gap --space-8.' },
          { part: 'Chip', spec: 'The sm rung, the topic\'s identity, nudged --space-4 onto the first line.' },
          { part: 'Headline', spec: '15/500 / 1.34, -0.01em - allowed its two lines.' },
          { part: 'Meta', spec: '12.5 muted: source and age, one line.' },
          { part: 'Why-you tag', spec: 'An 11.5/500 --accent-deep on --accent-tonal pill, self-start, --space-4 above: "Following: AI". Only when the reason is real.' },
          { part: 'Chevron', spec: 'Muted, centred against the row - the one feed row that shows one, because a story always opens.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Read', rule: 'The ground goes transparent behind an inset --line-soft ring - the recede notices use, softened: still in the list, visibly done.' },
          { state: 'Why-you', rule: 'The tag appears only when Wingman has an actual reason (a followed topic, a mentioned company); a feed of tags is a feed of noise.' },
          { state: 'Press', rule: 'Opens the story view; the whole row is the target.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --panel-inner, --line-soft, --accent-tonal, --accent-deep, --muted, --radius-lg,
        --radius-pill, --space-4/8/12/16, the chip tone pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/StoryRow.tsx" code={NROW_CONTRACT} />
    </DocSection>
  </>
)
