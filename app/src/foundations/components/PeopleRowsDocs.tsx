import { Icon } from '../../app/icons'
import { Note } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'


const CONN_CONTRACT = `// wg/ConnectorRow.tsx - implement to match.

interface ConnectorRowProps {
  mark: ReactNode          // the brand's own multicolour mark
  name: string
  desc: string
  status: 'connected' | 'off' | 'soon'
  count?: number           // what it feeds Wingman ("3 calendars")
  onPress?: () => void     // opens the connector's own screen
  onConnect?: () => void   // the sm Button, when status is off
}

// Geometry, from the theme:
//   row: homeSurface, radius lg, hairline, padding rowPadY / 16, gap
//   rowGap
//   chip: the BRAND chip - a neutral brandDisc ground so official
//   multicolour marks read true; a tone tint would fight the logo
//   name fsRow/500; desc 12.5 muted, 4 below
//   status: connected - a 13/500 ok-green line with its check;
//   soon - an amber 12 pill (warn on warnTonal): "not yet" is a state,
//   not a failure; off - the small connect Button (wg-btn sm), pinned
//   at its own width
//
// The grouped variant fuses rows into one card (a single surface,
// hairline dividers) the way a settings list reads - the row gives up
// its own ground and radius; the card owns both.`


const MEM_CONTRACT = `// wg/MemoryRow.tsx - implement to match.

interface MemoryRowProps {
  icon?: IconName
  tone?: ChipTone
  text: string             // the fact, in plain words
  value?: string           // a figure on the end, when the fact has one
  source: string           // WHERE IT CAME FROM - never omitted
  action: IconName         // the trailing affordance (edit, forget)
  onPress: () => void
}

// Geometry, from the theme:
//   row: homeSurface, radius lg, hairline, padding 12 / 16, gap 12,
//   top-aligned; press scales to 0.99
//   chip: the xs rung, nudged 4 down onto the first line
//   text 14.5 / 1.4; value 14/500 baseline-justified on the end
//   source: 12.5 muted, 4 below - the provenance line
//
// The source line is the row's reason to exist: memory you cannot trace
// is memory you cannot argue with. It never renders empty, and deleting
// the fact is offered wherever the fact is shown.`


const MEETING_CONTRACT = `// wg/MeetingRow.tsx - implement to match.

interface MeetingRowProps {
  tone: ChipTone
  initial?: string         // the counterpart's letter or face
  face?: boolean
  name: string
  time: string
  meta?: string            // "45 min - video - 3 attending"
  status?: MeetingStatus   // the shared Status pill vocabulary
  cancelled?: boolean
  onPress: () => void      // opens the meeting detail
}

// Geometry, from the theme:
//   row: homeSurface, radius lg, hairline, padding rowPadY / 16, gap
//   rowGap, top-aligned; press scales to 0.99
//   text column at gap 4: name 15/500 (-0.01em) and the 12.5 muted time
//   baseline-justified; meta 12.5 muted; the foot slot holds the Status
//   pill (documented as its own primitive - the meeting vocabulary:
//   go / wait / live / done / off)
//
// cancelled: the row at 0.6 with the name struck - visible history,
// not deletion.`

const ConnDemo = () => (
  <Stage ground="panel">
    <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <button type="button" className="wg-conn wg-card-line">
        <span className="wg-chip wg-chip--brand sm">
          <Icon name="calendar" size={22} variant="duotone" />
        </span>
        <span className="wg-conn__tx">
          <span className="wg-conn__name">Google Calendar</span>
          <span className="wg-conn__desc">Events, invitations, your working hours</span>
        </span>
        <span className="wg-conn__status done">
          <Icon name="check" size={14} />
          Connected
        </span>
      </button>
      {}
      <div className="wg-conn wg-card-line">
        <span className="wg-chip wg-chip--brand sm">
          <Icon name="heart" size={22} variant="duotone" />
        </span>
        <span className="wg-conn__tx">
          <span className="wg-conn__name">Health</span>
          <span className="wg-conn__desc">Sleep, recovery, your morning readiness</span>
        </span>
        <button type="button" className="wg-btn sm">Connect</button>
      </div>
    </div>
  </Stage>
)

const MemDemo = () => (
  <Stage ground="panel">
    <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <button type="button" className="wg-mem wg-card-line">
        <span className="wg-chip peach xs">
          <Icon name="sun" size={17} variant="duotone" />
        </span>
        <span className="wg-mem__tx">
          <span className="wg-mem__top">
            <span className="wg-mem__text">You prefer the morning briefing before 7:30</span>
          </span>
          <span className="wg-mem__source">You told me, during onboarding</span>
        </span>
        <Icon name="chevronRight" size={17} className="wg-mem__act" />
      </button>
      <button type="button" className="wg-mem wg-card-line">
        <span className="wg-chip blue xs">
          <Icon name="plane" size={17} variant="duotone" />
        </span>
        <span className="wg-mem__tx">
          <span className="wg-mem__top">
            <span className="wg-mem__text">Window seat, always</span>
            <span className="wg-mem__val">Travel</span>
          </span>
          <span className="wg-mem__source">From your last three bookings</span>
        </span>
        <Icon name="chevronRight" size={17} className="wg-mem__act" />
      </button>
    </div>
  </Stage>
)

const MeetingDemo = () => (
  <Stage ground="panel">
    <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <button type="button" className="wg-meeting wg-card-line">
        <span className="wg-chip lavender sm wg-chip--letter">M</span>
        <span className="wg-meeting__tx">
          <span className="wg-meeting__top">
            <span className="wg-meeting__name">Meridian review call</span>
            <span className="wg-meeting__time">11:00</span>
          </span>
          <span className="wg-meeting__meta">45 min, video, 4 attending</span>
          <span className="wg-meeting__foot">
            <span className="wg-mstatus go">
              <Icon name="check" size={12} />
              Prepared
            </span>
          </span>
        </span>
      </button>
      <button type="button" className="wg-meeting wg-card-line cancel">
        <span className="wg-chip sand sm wg-chip--letter">R</span>
        <span className="wg-meeting__tx">
          <span className="wg-meeting__top">
            <span className="wg-meeting__name strike">Vendor catch-up</span>
            <span className="wg-meeting__time">15:30</span>
          </span>
          <span className="wg-meeting__meta">Cancelled by the organiser</span>
        </span>
      </button>
    </div>
  </Stage>
)

export const ConnectorRowDoc = () => (
  <>
    <p className="wgd-lead">
      A service Wingman can read from: the brand's own mark on a neutral disc, what it feeds Wingman,
      and one of three honest states - connected, not yet available, or a Connect button. The row is
      how the whole More tab says what the assistant can currently see.
    </p>

    <DocSection title="Specimen">
      <Note>Stand-in glyphs: the real rows draw each connector's hand-authored brand mark.</Note>
      <ConnDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Home-surface, radius lg, hairline, padding --row-pad-y by --space-16, gap --row-gap.' },
          { part: 'Brand chip', spec: 'The sm rung on the neutral --brand-disc ground, so official multicolour marks read true - a tone tint would fight the logo\'s own colours.' },
          { part: 'Text', spec: 'Name --fs-row/500; description 12.5 muted, --space-4 below - what connecting feeds Wingman, in plain words.' },
          { part: 'Status', spec: 'Connected: a 13/500 --ok line with its check. Not yet: an amber 12 pill (--warn on --warn-tonal) - a state, not a failure. Off: the small Connect Button, pinned at its own width.' },
          { part: 'Count + chevron', spec: 'A connected row that opens its own screen trails a count and the chevron, paired at --space-8 rather than a full row-gap apart.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Grouped', rule: 'The grouped variant fuses rows into one card with hairline dividers, the way a settings list reads; the row gives up its ground and radius to the card.' },
          { state: 'Connect', rule: 'The Button starts the connect flow in its sheet; the row itself is not the target then.' },
          { state: 'Disconnect', rule: 'Undone from the connector\'s own screen, behind a confirm sheet - never from this row.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --brand-disc, --ok, --warn, --warn-tonal, --muted, --ink,
        --row-pad-y, --row-gap, --fs-row, --radius-lg, --radius-pill, --space-4/8/16.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/ConnectorRow.tsx" code={CONN_CONTRACT} />
    </DocSection>
  </>
)

export const MemoryRowDoc = () => (
  <>
    <p className="wgd-lead">
      One fact Wingman holds, and - always - where it came from. The provenance line is the row's
      reason to exist: memory you cannot trace is memory you cannot argue with, and every fact here
      can be corrected or forgotten from the row itself.
    </p>

    <DocSection title="Specimen">
      <MemDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Home-surface, radius lg, hairline, padding --space-12 by --space-16, gap --space-12, top-aligned; press scales to 0.99.' },
          { part: 'Chip', spec: 'The xs rung, nudged --space-4 down onto the first text line.' },
          { part: 'Fact', spec: '14.5 / 1.4 - the fact in plain words, with an optional 14/500 value baseline-justified on the end.' },
          { part: 'Source', spec: '12.5 muted, --space-4 below: "You told me, during onboarding", "From your last three bookings". Never empty.' },
          { part: 'Action', spec: 'A trailing 17 glyph - the row opens editing or forgetting.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Traceable', rule: 'Every fact names its source. A fact Wingman inferred says so, and says from what.' },
          { state: 'Correctable', rule: 'Tapping opens the fact for editing or forgetting; forgetting is immediate and confirmed by the list visibly shrinking.' },
          { state: 'Empty', rule: 'A cleared memory shows the Empty state: "Nothing on file. I\'ll start again from whatever you tell me next."' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --radius-lg, --space-4/12/16, --chip-xs,
        --duration-quick, --ease, the chip tone pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/MemoryRow.tsx" code={MEM_CONTRACT} />
    </DocSection>
  </>
)

export const MeetingRowDoc = () => (
  <>
    <p className="wgd-lead">
      A meeting in the Business list: who it is with, when, the one-line facts, and the shared status
      vocabulary in its foot - prepared, waiting, live, done. A cancelled meeting stays visible,
      struck and dimmed, because history you can see beats history that vanished.
    </p>

    <DocSection title="Specimen">
      <MeetingDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Home-surface, radius lg, hairline, padding --row-pad-y by --space-16, gap --row-gap, top-aligned; press scales to 0.99.' },
          { part: 'Chip', spec: 'The sm rung: the counterpart\'s letter or face, toned.' },
          { part: 'Top line', spec: 'Name 15/500 (-0.01em) and the 12.5 muted time, baseline-justified apart.' },
          { part: 'Meta', spec: '12.5 muted: duration, medium, attendance - one line.' },
          { part: 'Foot', spec: 'The Status pill (its own primitive: go / wait / live / done / off), --space-4 above.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Cancelled', rule: 'The row dims to 0.6 and the name strikes through; it stays in the list as visible history.' },
          { state: 'Live', rule: 'The status pill\'s rose form carries the breathing dot - the shared "happening right now" beat, on the pulse tokens.' },
          { state: 'Press', rule: 'Opens the meeting detail; scale 0.99.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --row-pad-y, --row-gap, --radius-lg, --space-4/12/16,
        --chip-sm, the chip tone pair, plus the Status pill tokens.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/MeetingRow.tsx" code={MEETING_CONTRACT} />
    </DocSection>
  </>
)
