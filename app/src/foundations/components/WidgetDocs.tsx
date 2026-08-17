import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CELL_CONTRACT = `// wg/WidgetCell.tsx (+ the widget grid) - implement to match.

interface WidgetCellProps {
  size: 'sm' | 'md' | 'lg'   // sm: half width; md: full width; lg: full
                             // width AND two row units - the one with room
                             // for a list
  bare?: boolean             // widgets that paint their own card (the
                             // insight, the snapshot) get no second card
  children: ReactNode
}

// The grid: two columns, gap 8, rows at least one unit tall and growing
// to content; DENSE packing, so a lone small widget's hole is backfilled
// by the next small one. Only two spans exist, so a dense reflow can only
// ever move a small widget up beside another - which is what the canvas
// wants anyway.
//
// The cell: homeSurface, radius lg, padding 16. A SMALL widget is one
// target: head, value and support line are a single Pressable filling
// the card (press scales to 0.985).
//
// Head: xs chip (17 glyph) + 13/500 title (ellipsised) + an optional
// trailing end slot (count or "View all", 12 muted).
// Value: 26/400 / 1.1 - one number, the way every status card states one.
// Sub: 12.5 muted / 1.35, 4 above-gap.`

const ROW_CONTRACT = `// wg/WidgetRow.tsx (+ WidgetTick) - implement to match.

interface WidgetRowProps {
  name: string               // clamps at TWO lines, then ellipsis - a
                             // widget is a glance
  nameDone?: boolean         // muted + line-through
  meta?: string              // one line, ellipsised
  end?: ReactNode            // a flag pill, a tick, a time
  onPress?: () => void
}

// Rows: 8 block-padding, hairline (lineSoft) between rows, gap 12.
// In a LARGE widget the list takes the cell's slack height and rows share
// it (12 block-padding), so separators land on an even rhythm and the
// card ends where its last row does - slack pooling at the foot reads as
// a bug, not as breathing room.
//
// WidgetTick: the in-place completion ring, 24 circle, inset 1.5
// lineStrong ring; on: ok fill + onAccent tick. The Tasks list's ring
// language at the one size a widget row has room for.`

const CellDemo = () => (
  <Stage ground="panel">
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', width: '100%', maxWidth: 380 }}>
      {(
        [
          ['receipt', 'sand', 'Bills', '2', 'due this week'],
          ['box', 'blue', 'Deliveries', '1', 'arriving today'],
        ] as const
      ).map(([icon, tone, title, value, sub]) => (
        <div className="wg-wgt wg-card-line" key={title}>
          <button type="button" className="wg-wgt__open">
            <span className="wg-wgt__head">
              <span className={`wg-chip ${tone} xs`}>
                <Icon name={icon} size={17} variant="duotone" />
              </span>
              <span className="wg-wgt__title">{title}</span>
            </span>
            <span className="wg-wgt__val">{value}</span>
            <span className="wg-wgt__sub">{sub}</span>
          </button>
        </div>
      ))}
    </div>
  </Stage>
)

const RowsDemo = () => {
  const [done, setDone] = useState(false)
  return (
    <Stage ground="panel">
      <div className="wg-wgt wg-card-line" style={{ width: '100%', maxWidth: 380 }}>
        <span className="wg-wgt__head">
          <span className="wg-chip mint xs">
            <Icon name="task" size={17} variant="duotone" />
          </span>
          <span className="wg-wgt__title">Tasks</span>
          <span className="wg-wgt__end">
            View all
            <Icon name="chevronRight" size={14} />
          </span>
        </span>
        <div className="wg-wlist">
          <div className="wg-wrow">
            <span className="wg-wrow__tx">
              <span className={`wg-wrow__name${done ? ' done' : ''}`}>Reply to the school about Thursday</span>
              <span className="wg-wrow__meta">From WhatsApp, this morning</span>
            </span>
            <span className="wg-wrow__end">
              <button
                type="button"
                className={`wg-wtick${done ? ' on' : ''}`}
                aria-pressed={done}
                aria-label="Mark done"
                onClick={() => setDone(!done)}
              >
                <Icon name="check" size={14} />
              </button>
            </span>
          </div>
          <div className="wg-wrow">
            <span className="wg-wrow__tx">
              <span className="wg-wrow__name">Renew the car insurance</span>
              <span className="wg-wrow__meta">Due in six days</span>
            </span>
            <span className="wg-wrow__end">
              <span className="wg-flag sand">Due soon</span>
            </span>
          </div>
        </div>
      </div>
    </Stage>
  )
}

export const WidgetCellDoc = () => (
  <>
    <p className="wgd-lead">
      The unit the dashboard is laid out in: a white card the grid places at one of three rungs -
      half-width, full-width, or full-width-and-two-rows for the one that holds a list. A small
      widget is a single glance and a single target.
    </p>

    <DocSection title="Specimen">
      <CellDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Grid', spec: 'Two columns at gap --space-8, rows at least one unit and growing to content, packed dense - a lone small widget\'s hole is backfilled by the next small one.' },
          { part: 'Cell', spec: 'Home-surface, radius lg, hairline, padding --space-16. sm spans one column; md spans both; lg spans both and two row units.' },
          { part: 'Bare cell', spec: 'Widgets that paint their own card (the insight, the snapshot, the commute card) get no second card around them; the edit-mode ring still shows.' },
          { part: 'Head', spec: 'xs chip (17 glyph), 13/500 ellipsised title, an optional trailing end slot (a count, "View all") at 12 muted.' },
          { part: 'Value + sub', spec: 'The glance: one 26/400 number, with a 12.5 muted support line 4 below.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Small = one target', rule: 'Head, value and support line are a single button filling the card; press scales to 0.985. Larger widgets carry their own targets per row.' },
          { state: 'Dense reflow', rule: 'Only two spans exist, so dense packing can only ever move a small widget up beside another - the behaviour the canvas wants.' },
          { state: 'Empty', rule: 'An empty widget is an invitation in a sentence, never a blank box.' },
          { state: 'Edit mode', rule: 'The dashboard\'s edit bar owns add, remove and resize; the cell itself only wears the edit ring.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --wgt-unit, --radius-lg, --space-4/8/12/16, --chip-xs,
        --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The dense backfill is CSS grid behaviour a naive flex port silently loses: a native layout
        must re-order small widgets into holes itself (place items column-first per row pair, or use
        a small packing pass). Losing it leaves blank cells the web never shows.
      </Trap>
      <Contract label="wg/WidgetCell.tsx" code={CELL_CONTRACT} />
    </DocSection>
  </>
)

export const WidgetRowDoc = () => (
  <>
    <p className="wgd-lead">
      The row a list widget draws: a two-line-max name, a one-line meta, and one trailing thing - a
      flag pill, a completion tick, a time. Rows share the large widget's slack height so the card
      always ends where its last row does.
    </p>

    <DocSection title="Specimen">
      <RowsDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Flex at gap --space-12, block-padding --space-8 (12 in a large widget); a --line-soft hairline between rows.' },
          { part: 'Name', spec: '--fs-row/500 / 1.25, clamped at two lines then ellipsis - a wrapped fifth line would push the row below off the card. Done: muted with a line-through.' },
          { part: 'Meta', spec: '--fs-sub muted, one line, ellipsised.' },
          { part: 'End slot', spec: 'One trailing thing: a tone flag pill (the chip palette, because overdue and blocked are identities), a tick, or a time.' },
          { part: 'Tick', spec: 'The 24 completion ring: inset 1.5 --line-strong; on, --ok fill with the on-accent check. The Tasks ring language at widget size.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Slack sharing', rule: 'In a large widget the list takes the cell\'s leftover height and rows share it - separators land on an even rhythm instead of slack pooling at the foot.' },
          { state: 'Tick in place', rule: 'Completing happens in the widget; the row dims and strikes without leaving. The full draw ceremony belongs to the Tasks list.' },
          { state: 'Flags', rule: 'Tone pills from the chip palette; the alert red stays reserved for the header\'s unread dot.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --line-soft, --line-strong, --ok, --on-accent, --muted, --fs-row, --fs-sub, --radius-pill,
        --space-4/8/12, --duration-quick, --ease, the chip tone pairs for flags.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/WidgetRow.tsx" code={ROW_CONTRACT} />
    </DocSection>
  </>
)
