import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const WEEK_CONTRACT = `// wg/DayCell.tsx (+ WeekStrip, MonthGrid) - implement to match.

interface DayCellProps {
  date: string
  selected: boolean
  today: boolean
  dim?: boolean            // a neighbouring month's day, in the grid
  dots: number             // event marks under the number
  inStrip?: boolean        // the strip shows the weekday initial above
  onPick: (date: string) => void
}

// ONE cell, two layouts: the strip is a single 7-column row with weekday
// initials inside each cell; the month grid is the same cells in as many
// rows as the month needs, with a separate weekday header row, plus dim
// for the bleed-in days. Do not build two components.
//
// Geometry, from the theme:
//   7 equal columns, gap 4; cell is a column: initial (11/500 muted,
//   0.04em), the 36 num disc (15/500), the 4-high dots row
//   today: an inset 1.5 accent ring on the disc, accentDeep number
//   selected: accent fill, onAccent number - selected BEATS today (the
//   ring drops when the fill arrives)
//   dots: 4 circles at gap 4 in the track colour; selected turns them
//   accent
//
// The grid enters with a small drop-in (opacity + 6 of travel) over
// durationFast; the strip-to-grid swap is a fold the Calendar screen
// owns, not the cell. Strip cells are tabs (tablist semantics); grid
// cells are plain buttons - a tablist with header cells would lie.`

const EV_CONTRACT = `// wg/EventCard.tsx (+ Agenda) - implement to match.

interface EventCardProps {
  time: string             // "9:00", with its meridiem under it
  meridiem?: string
  title: string
  meta?: string
  attendees?: string[]     // stacked 24 initial discs, -8 overlap
  flag?: string            // the amber "reply first" pill
  state?: 'past' | 'next'
  prep?: { label: string; action: string; onAct: () => void }
  onPress: () => void
}

// Geometry, from the theme:
//   row: a 44 time gutter + the card, gap 12; agenda stacks at gap 8
//   gutter: end-aligned, 14/500 time over a 10.5 muted meridiem
//   card: homeSurface, radius lg, padding rowPadY / 12; press scales
//   to 0.99. Title fsRow/500; meta 12.5 muted, 4 below.
//   attendees: 24 discs, 10/500 initials, lavender recipe, ringed 2 in
//   the surface, overlapping -8; "+n" takes cardTonal/muted
//
// past: the whole row at 0.5; the card gives up its fill for an inset
// cardTonal outline - done is see-through, not deleted.
// next: the card takes accentTonal and the gutter time accentDeep; an
// optional prep footer (12.5/500 accentDeep) splits off above an
// accentLine hairline, with a surface pill action on its end.
// The now divider between past and upcoming is the screen's, not the
// card's.`

const DAYS = [
  { d: 'M', n: 11, dots: 1 },
  { d: 'T', n: 12, dots: 2 },
  { d: 'W', n: 13, dots: 0 },
  { d: 'T', n: 14, dots: 3 },
  { d: 'F', n: 15, dots: 1 },
  { d: 'S', n: 16, dots: 0 },
  { d: 'S', n: 17, dots: 0 },
] as const

const WeekDemo = () => {
  const [picked, setPicked] = useState(4)
  return (
    <Stage ground="home">
      <div className="wg-week" style={{ width: '100%', maxWidth: 380 }} role="tablist" aria-label="Week">
        {DAYS.map((day, i) => (
          <button
            type="button"
            role="tab"
            aria-selected={picked === i}
            key={i}
            className={`${picked === i ? 'on' : ''} ${i === 5 ? 'today' : ''}`}
            onClick={() => setPicked(i)}
          >
            <small>{day.d}</small>
            <span className="num">{day.n}</span>
            <span className="dots" aria-hidden="true">
              {Array.from({ length: day.dots }, (_, d) => (
                <i key={d} />
              ))}
            </span>
          </button>
        ))}
      </div>
    </Stage>
  )
}

const EventDemo = () => (
  <Stage ground="panel">
    <div className="wg-agenda" style={{ width: '100%', maxWidth: 380 }}>
      <div className="wg-ev past">
        <div className="wg-ev__time">
          <b>8:30</b>
          <span>AM</span>
        </div>
        <div className="wg-ev__card wg-card-line">
          <div className="wg-ev__main">
            <div className="tx">
              <strong>School run</strong>
              <small>Done and dusted</small>
            </div>
          </div>
        </div>
      </div>
      <div className="wg-ev next">
        <div className="wg-ev__time">
          <b>11:00</b>
          <span>AM</span>
        </div>
        {}
        <div className="wg-ev__card wg-card-line">
          <span className="wg-ev__main">
            <span className="tx">
              <strong>Meridian review call</strong>
              <small>45 min, video</small>
            </span>
            <span className="wg-ev__ava" aria-hidden="true">
              <span>SA</span>
              <span>MK</span>
              <span className="more">+2</span>
            </span>
          </span>
          <span className="wg-ev__prep">
            <Icon name="spark" size={14} variant="duotone" />
            Brief is ready
            <button type="button">Read it</button>
          </span>
        </div>
      </div>
    </div>
  </Stage>
)

export const WeekStripDoc = () => (
  <>
    <p className="wgd-lead">
      Seven day columns: a weekday initial, the number in its 36 disc, and up to three event dots
      under it. The expanded month grid is the same cell in more rows - one anatomy, two layouts,
      and selection always beats today's ring.
    </p>

    <DocSection title="Specimen">
      <WeekDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Seven equal columns at gap --space-4, padding 4 above and 12 below. The month grid reuses the columns with a separate weekday header row.' },
          { part: 'Cell', spec: 'A centred column at gap --space-8: the 11/500 muted initial (strip only), the 36 number disc at 15/500, the 4-high dots row.' },
          { part: 'Today', spec: 'An inset 1.5 accent ring on the disc, number in --accent-deep.' },
          { part: 'Selected', spec: 'Accent fill, on-accent number, dots turned accent. Selection beats today: the ring drops when the fill arrives.' },
          { part: 'Dim', spec: 'Month-grid days bleeding in from neighbours: number at 0.45, dots at 0.4 - legible but receded.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Pick', rule: 'The disc\'s ground transitions over the quick duration; the agenda below re-cuts to the day.' },
          { state: 'Grid enter', rule: 'The month grid drops in (opacity plus 6 of travel) over --duration-fast with --ease-smooth-out. The strip-to-grid fold is the Calendar screen\'s, not the cell\'s.' },
          { state: 'Semantics', rule: 'Strip cells are tabs; grid cells are plain toggles - a tablist whose children include weekday headers would not be a truthful tablist.' },
          { state: 'RTL', rule: 'The week runs in the writing direction; the grid follows.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --accent, --accent-deep, --on-accent, --track, --muted, --ink, --radius-pill, --space-4/8,
        --duration-quick, --duration-fast, --ease, --ease-smooth-out.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/DayCell.tsx" code={WEEK_CONTRACT} />
    </DocSection>
  </>
)

export const EventCardDoc = () => (
  <>
    <p className="wgd-lead">
      The agenda row: a slim time gutter beside a white event card. Past events go see-through, the
      next one up takes an accent wash and grows a prep footer - the agenda tells you where you are
      in the day by how the cards are dressed.
    </p>

    <DocSection title="Specimen">
      <EventDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'A 44 time gutter and the card, gap --space-12; the agenda stacks rows at gap --space-8.' },
          { part: 'Gutter', spec: 'End-aligned: 14/500 time over its 10.5 muted meridiem, top-padded to sit on the card\'s first line.' },
          { part: 'Card', spec: 'Home-surface, radius lg, hairline, padding --row-pad-y by --space-12 (the feed density token); press scales to 0.99. Title --fs-row/500, meta 12.5 muted.' },
          { part: 'Attendees', spec: 'Stacked 24 discs: 10/500 initials on the lavender recipe, ringed 2 in the surface, overlapping by 8; the overflow disc ("+2") takes --card-tonal and muted.' },
          { part: 'Past', spec: 'The whole row at 0.5, and the card trades its fill for an inset --card-tonal outline - done is see-through, not deleted.' },
          { part: 'Next', spec: 'The card on --accent-tonal, the gutter time in --accent-deep, and the prep footer above an --accent-line hairline with a surface-pill action on its end.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Press', rule: 'The card opens the event; scale 0.99. The prep footer\'s pill is its own target inside it.' },
          { state: 'One next', rule: 'Exactly one event wears the accent wash - the next one up. The now divider between past and upcoming belongs to the screen.' },
          { state: 'Empty day', rule: 'A day with nothing renders the Empty state card in the agenda\'s place.' },
          { state: 'RTL', rule: 'The gutter leads in the writing direction; its text end-aligns against the card.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --card-tonal, --accent-tonal, --accent-line, --accent-deep,
        --surface, --chip-lavender, --tone-lavender-text, --chip-sand, --warn, --muted, --row-pad-y,
        --fs-row, --radius-lg, --radius-pill, --space-4/8/12, --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The gutter is part of the row, not an absolute rail: each row lays out its own 44 column, so
        the agenda virtualises row by row in a plain list. And "next" is data-driven, not
        time-driven-in-the-component - the screen decides which event is next and dresses one card;
        the card never reads the clock itself.
      </Trap>
      <Contract label="wg/EventCard.tsx" code={EV_CONTRACT} />
    </DocSection>
  </>
)
