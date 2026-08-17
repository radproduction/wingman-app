import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/GalleryRow.tsx (+ Gallery, SizePill) - implement to match.

interface GalleryRowProps {
  icon: IconName
  tone: ChipTone
  name: string
  desc: string
  sizes: WidgetSize[]      // > 1: pills to pick from; exactly 1: a FIXED
                           // label pill, so the row never looks half-loaded
  onAdd: (size: WidgetSize) => void
}

// Geometry, from the theme:
//   list: column, gap 8 - inside a bottom sheet, so...
//   row: panelInner fill (TONAL, not white: a white row inside a white
//   sheet would vanish), radius lg, padding 12, gap 12, start-aligned
//   chip: sm rung
//   name 15/500; desc 12.5 / 1.35, muted; column gap 4
//   sizes: a row of SizePills, gap 4, 4 above-gap
//   add: a 32 disc, accentTonal ground with accentDeep glyph, self-centred;
//   presses to scale 0.9
//
// SizePill - the micro choice pill: 11/500, padding 4/8, radius pill.
//   off:   cardTonalCool ground, muted text
//   on:    accent ground, onAccent text
//   fixed: transparent with an inset 1 lineStrong ring - a LABEL, not a
//          choice, so it must never look pressable
// The capture sheet and the instant-meeting people picker borrow SizePill
// as their own micro choice pill - it is a real primitive, ship it as one.`

const ROWS = [
  { icon: 'calendar', tone: 'blue', name: 'Today', desc: 'Your next events at a glance', sizes: ['md', 'lg'] },
  { icon: 'car', tone: 'mint', name: 'Traffic', desc: 'Leave-by time for your usual route', sizes: ['md'] },
] as const

const GalleryRows = () => {
  const [size, setSize] = useState('md')
  return (
    <Stage ground="home">
      <div className="wg-gal" style={{ width: '100%', maxWidth: 420 }}>
        {ROWS.map((row) => (
          <div className="wg-gal__row" key={row.name}>
            <span className={`wg-chip ${row.tone} sm`}>
              <Icon name={row.icon} size={20} variant="duotone" />
            </span>
            <span className="wg-gal__tx">
              <strong>{row.name}</strong>
              <span>{row.desc}</span>
              <span className="wg-gal__sizes" role="group" aria-label="Size">
                {row.sizes.length > 1 ? (
                  row.sizes.map((s) => (
                    <button
                      type="button"
                      className={`wg-gal__size ${size === s ? 'on' : ''}`}
                      key={s}
                      aria-pressed={size === s}
                      onClick={() => setSize(s)}
                    >
                      {s === 'md' ? 'Half' : 'Full'}
                    </button>
                  ))
                ) : (
                  <span className="wg-gal__size is-fixed">Half</span>
                )}
              </span>
            </span>
            <button type="button" className="wg-gal__add" aria-label={`Add ${row.name}`}>
              <Icon name="plus" size={18} />
            </button>
          </div>
        ))}
      </div>
    </Stage>
  )
}

export const GalleryDoc = () => (
  <>
    <p className="wgd-lead">
      The list you add widgets from: one tonal row per available widget, its size choice made inline
      before you commit, and a small add disc on the end. Lives inside the dashboard's Add-a-widget
      sheet, so its rows are tonal where a list on the panel would be white.
    </p>

    <DocSection title="Specimen">
      <GalleryRows />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'List', spec: 'A column at gap --space-8, inside the bottom sheet.' },
          { part: 'Row', spec: '--panel-inner fill (tonal, deliberately: a white row inside the white sheet would vanish), radius lg, padding --space-12, gap --space-12, start-aligned.' },
          { part: 'Chip', spec: 'The sm rung, the widget\'s identity.' },
          { part: 'Text', spec: 'Name 15/500, description 12.5 / 1.35 muted, stacked at gap --space-4.' },
          { part: 'Size pills', spec: '11/500 micro pills, padding --space-4 by --space-8: --card-tonal-cool when off, accent when on. A widget with one size gets the fixed form - transparent with an inset --line-strong ring - a label, never a choice.' },
          { part: 'Add', spec: 'A 32 disc, --accent-tonal ground with an --accent-deep glyph, centred against the row. Presses to scale 0.9.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'icon + tone', type: 'IconName + ChipTone', rn: 'icon: IconName; tone: ChipTone', desc: 'The widget\'s chip.' },
          { prop: 'name', type: 'string', rn: 'name: string', desc: 'The widget.' },
          { prop: 'desc', type: 'string', rn: 'desc: string', desc: 'What it shows, in one line.' },
          { prop: 'sizes', type: 'WidgetSize[]', rn: 'sizes: WidgetSize[]', desc: 'More than one: a choice. Exactly one: still shown, as the fixed label - a row with no pill reads as a row whose sizes failed to load.' },
          { prop: 'onAdd', type: '(size) => void', rn: 'onAdd: (size: WidgetSize) => void', desc: 'Adds at the picked (or only) size.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Pick then add', rule: 'The size pills set a local choice; nothing happens until the add disc commits it. The row itself is not pressable.' },
          { state: 'Fixed size', rule: 'One rung still says which - as a ringed label that never looks pressable.' },
          { state: 'Emptied', rule: 'When every widget is already placed, the sheet says so in a sentence and the gallery renders nothing - no empty rows.' },
          { state: 'RTL', rule: 'Chip leads, add disc trails; the pills run in the writing direction.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --panel-inner, --card-tonal-cool, --accent, --on-accent, --accent-tonal, --accent-deep,
        --line-strong, --muted, --radius-lg, --radius-pill, --space-4/8/12, --duration-quick, --ease,
        the chip tone pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The size pill is quietly a shared primitive: the capture sheet's owner, due and priority rows
        and the instant meeting's people picker all draw <code>wg-gal__size</code> pills outside any
        gallery. Ship it as its own small component (SizePill) with the on / off / fixed forms, and let
        the gallery be one of its callers - porting it as gallery-internal styling loses those screens.
      </Trap>
      <Contract label="wg/GalleryRow.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
