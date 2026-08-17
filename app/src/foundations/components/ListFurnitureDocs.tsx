import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'


const RAIL_CONTRACT = `// wg/FilterRail.tsx - implement to match.

interface FilterRailProps {
  filters: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
}

// One horizontally scrolling rail, gap 8, scrollbar hidden. The web bleeds
// it 4 outward (negative margin + matching padding) so nothing clips at the
// screen edge; natively that is contentContainer padding on a horizontal
// ScrollView with showsHorizontalScrollIndicator={false}.
//
// Pill: 13/500 on cardTonal, muted text, padding 8/16, radius pill.
// Selected: accent ground, onAccent text. Colour is the whole state -
// no border, no scale.
//
// One selected at a time, always: it filters a list, it is not a toggle
// set. accessibilityRole tablist / tab + selected.`

const FILTERS = ['All', 'Today', 'This week', 'To prepare', 'Done'] as const

const RailDemo = () => {
  const [on, setOn] = useState<string>('Today')
  return (
    <Stage ground="panel">
      <div className="wg-mfilter" role="tablist" style={{ width: '100%', maxWidth: 420 }}>
        {FILTERS.map((f) => (
          <button
            type="button"
            key={f}
            role="tab"
            aria-selected={on === f}
            className={on === f ? 'on' : ''}
            onClick={() => setOn(f)}
          >
            {f}
          </button>
        ))}
      </div>
    </Stage>
  )
}

export const FilterRailDoc = () => (
  <>
    <p className="wgd-lead">
      The row of filter pills above a long list. One rail, one selected pill, and the list below
      re-cuts as you tap - it reads as a single control, so it sits flush and scrolls its own overflow
      past the screen edge.
    </p>

    <DocSection title="Specimen">
      <RailDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Rail', spec: 'A flex row at gap --space-8, scrolling horizontally with the scrollbar hidden; bled 4 outward (negative margin, matching padding) so pills never clip at the edge.' },
          { part: 'Pill', spec: '13/500 on --card-tonal, muted text, padding --space-8 by --space-16, radius pill.' },
          { part: 'Selected', spec: 'Accent ground, on-accent text. Colour is the entire state - no border, no scale.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'filters', type: '{key, label}[]', rn: 'filters: Filter[]', desc: 'The cuts this list offers.' },
          { prop: 'value', type: 'string', rn: 'value: string', desc: 'The selected cut. Exactly one, always.' },
          { prop: 'onChange', type: '(key) => void', rn: 'onChange: (key: string) => void', desc: 'Re-cuts the list in place.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Select', rule: 'Ground and text colour swap over the quick duration. The list re-cuts in place; the rail does not move.' },
          { state: 'Overflow', rule: 'The rail scrolls; the pills never wrap or shrink. No fade or arrow furniture - the cut-off pill is the affordance.' },
          { state: 'vs Segmented', rule: 'Segmented is a closed set of equal-width options in a trough; the rail is an open list that can outgrow the screen. A filter set that will never exceed four fixed options wants Segmented instead.' },
          { state: 'RTL', rule: 'The rail starts from the writing edge and scrolls the other way.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --card-tonal, --accent, --on-accent, --muted, --radius-pill, --space-4/8/16, --duration-quick,
        --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/FilterRail.tsx" code={RAIL_CONTRACT} />
    </DocSection>
  </>
)


const SEARCH_CONTRACT = `// wg/SearchField.tsx - implement to match.

interface SearchFieldProps {
  value: string
  onChange: (next: string) => void
  placeholder: string
  leadingIcon?: ReactNode   // the muted search glyph; omitted when the
                            // field is a composer rather than a search
  action?: ReactNode        // a trailing inline text action ("Add"),
                            // disabled while the field is empty
}

// Geometry, from the theme:
//   field: home-surface fill, radius md - NOT the pill: Field (the form
//   input) is the pill, and this flat field is list furniture, not a form
//   step. padding 12/16, gap 12
//   glyph: 18, muted
//   input: 14.5, ink, transparent ground, placeholder muted
//
// No focus ring: it sits in a list, already where your eye is, and a
// ring would say "form". (Field, by contrast, wears the 3 focus ring.)
//
// Two lives, one anatomy: glyph-led search (Meetings), and the live
// meeting's note composer - no glyph, a trailing Link action instead,
// disabled until there is something to add.`

const SearchDemo = () => {
  const [q, setQ] = useState('')
  const [note, setNote] = useState('')
  return (
    <Stage ground="panel">
      <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <div className="wg-msearch">
          <Icon name="search" size={18} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by person, company or project" aria-label="Search" />
        </div>
        <div className="wg-msearch">
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Write a note" aria-label="Write a note" />
          <button type="button" className="wg-link" disabled={!note.trim()}>
            Add
          </button>
        </div>
      </div>
    </Stage>
  )
}

export const SearchFieldDoc = () => (
  <>
    <p className="wgd-lead">
      The flat field that sits above a list: glyph-led search on Meetings, and - same anatomy, no
      glyph - the note composer during a live meeting, with an inline Add action on the end. List
      furniture, deliberately quieter than the form Field.
    </p>

    <DocSection title="Specimen">
      <SearchDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Field', spec: 'Home-surface fill, radius md - not the Field pill: this is list furniture, not a form step. Padding --space-12 by --space-16, gap --space-12.' },
          { part: 'Glyph', spec: 'The 18 search glyph, muted. Omitted when the field composes rather than searches.' },
          { part: 'Input', spec: '14.5 ink on a transparent ground, placeholder muted. The app font, inherited.' },
          { part: 'Action', spec: 'Optionally a trailing inline link ("Add"), disabled while the field is empty.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'value / onChange', type: 'string / (s) => void', rn: 'value; onChange', desc: 'Controlled, filtering or composing as you type.' },
          { prop: 'placeholder', type: 'string', rn: 'placeholder: string', desc: 'Says what the field reaches: "Search by person, company or project".' },
          { prop: 'leading glyph', type: 'ReactNode', rn: 'leadingIcon?: ReactNode', desc: 'The search glyph. Present when searching, absent when composing.' },
          { prop: 'action', type: 'ReactNode', rn: 'action?: ReactNode', desc: 'A trailing inline text action, gated on content.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Focus', rule: 'No focus ring - it lives in a list, not a form. The caret and the keyboard are the state.' },
          { state: 'Filter', rule: 'Search filters the list live on every keystroke; there is no submit.' },
          { state: 'Empty action', rule: 'The composer\'s trailing action is disabled until the field holds something; Enter commits the same way the action does.' },
          { state: 'RTL', rule: 'Glyph leads, action trails, text aligns to the script.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--home-surface, --ink, --muted, --radius-md, --space-12/16.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Radius md, not the pill, and no focus ring - both deliberate, both easy to "correct" into Field's
        anatomy by accident. If a screen needs a form input, use Field; this component exists so a list's
        search does not dress like a form step.
      </Trap>
      <Contract label="wg/SearchField.tsx" code={SEARCH_CONTRACT} />
    </DocSection>
  </>
)
