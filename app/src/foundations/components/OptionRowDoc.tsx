import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Switch } from '../../shell/Switch'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/OptionRow.tsx (+ OptionList) - implement to match.

interface OptionRowProps {
  title: string
  support?: string             // the muted line under the title
  icon?: ReactNode             // leading 38 disc; card-tonal ground unless toned
  iconTone?: ChipTone          // per-item tinted disc (the skills list)
  flag?: ImageSource           // 30 circular flag instead of the disc (Language)
  selected: boolean
  onPress: () => void
  variant?: 'select' | 'switch'
  // 'select' (default): trailing 22 mark, outer accent ring when selected.
  // 'switch': trailing Switch carries the state; NO ring, NO deep title -
  //   a list with everything on must not read as a wall of selection.
  // multi-select and single-select are the same row; the LIST decides the
  // semantics (checkbox vs radio) and owns accessibilityRole/state
}

// Geometry, from the theme:
//   card: surface fill, radius lg, padding 16, row gap 16
//   disc: 38 circle - a stated size, not a chip rung
//   flag: 30 circle, inset 1 line-strong ring so white flag areas keep an edge
//   title 15/500; support 13, muted, 4 above-gap, lineHeight 1.35 * 13
//   mark: 22 circle; unselected an inset 2 track ring; selected accent fill
//         with an on-accent check
//   list: column, gap 8
//
// Selected: an OUTER 2 accent ring around the card (the white card already
// stands out on the cool panel, so selection is a ring, not a tonal fill),
// and the title reads accent-deep. Natively the ring is a border: the
// unselected card carries a transparent border of the same width, or the
// layout shifts on select.
//
// The web's inset track ring on the mark is also a border natively.`

const Row = ({
  title,
  support,
  on,
  toned,
  onPress,
}: {
  title: string
  support?: string
  on: boolean
  toned?: boolean
  onPress: () => void
}) => (
  <button type="button" className={`wg-option wg-card-line${on ? ' on' : ''}`} aria-pressed={on} onClick={onPress}>
    <span className={`ic${toned ? ' blue' : ''}`}>
      <Icon name={toned ? 'calendar' : 'bell'} size={20} variant="duotone" />
    </span>
    <span className="tx">
      <strong>{title}</strong>
      {support ? <span>{support}</span> : null}
    </span>
    <span className="mark">
      <Icon name="check" size={14} />
    </span>
  </button>
)

const Playground = () => {
  const [picked, setPicked] = useState(0)
  return (
    <Stage ground="panel">
      <div className="wg-options" style={{ width: '100%', maxWidth: 420 }}>
        <Row title="Morning briefing" support="A summary before your day starts" on={picked === 0} onPress={() => setPicked(0)} />
        <Row title="Calendar" support="Tinted disc, unchanged on select" toned on={picked === 1} onPress={() => setPicked(1)} />
        <Row title="Only when urgent" on={picked === 2} onPress={() => setPicked(2)} />
      </div>
    </Stage>
  )
}

const SwitchRows = () => {
  const [a, setA] = useState(true)
  const [b, setB] = useState(false)
  return (
    <Stage ground="panel">
      <div className="wg-options" style={{ width: '100%', maxWidth: 420 }}>
        <button type="button" className={`wg-option wg-card-line wg-option--switch${a ? ' on' : ''}`} onClick={() => setA(!a)}>
          <span className="ic mint">
            <Icon name="volume" size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>Tap sounds</strong>
            <span>The state lives in the switch, not in a ring</span>
          </span>
          <Switch on={a} />
        </button>
        <button type="button" className={`wg-option wg-card-line wg-option--switch${b ? ' on' : ''}`} onClick={() => setB(!b)}>
          <span className="tx">
            <strong>Leave-by reminders</strong>
            <span>A switch row may carry no disc at all</span>
          </span>
          <Switch on={b} />
        </button>
      </div>
    </Stage>
  )
}

export const OptionRowDoc = () => (
  <>
    <p className="wgd-lead">
      The choice card. One anatomy for single and multi select, for onboarding questions and settings
      alike; the list around it decides the semantics. Selection is an outer accent ring, never a fill -
      and the switch variant drops the ring entirely, because its Switch already tells the state.
    </p>

    <DocSection title="Specimen">
      <Playground />
      <Note>The switch variant: same card, same disc and text, a Switch where the mark would be.</Note>
      <SwitchRows />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Surface fill, radius lg, padding --space-16, hairline (--card-line). Rows stack in a column at gap --space-8.' },
          { part: 'Disc', spec: '38 circle, card-tonal ground with an ink glyph; a per-item tone (the skills list) tints it to the chip recipe, and it does not change on select. A switch row may omit it.' },
          { part: 'Flag', spec: 'The Language rows lead with a 30 circular country flag instead of the disc, ringed inset 1 in --line-strong so a flag with white in it keeps an edge.' },
          { part: 'Text', spec: 'Title 15/500; optional support line 13 muted, 4 below the title. The language rows step the title up to 17 in their own script, with a stated 1.45 line height.' },
          { part: 'Mark', spec: '22 circle. Unselected: an inset 2 track ring, contents invisible. Selected: accent fill, on-accent check. The switch variant replaces it with the Switch.' },
          { part: 'Selected ring', spec: 'An outer 2 accent ring around the whole card, plus the title in accent-deep. Select rows only - never on the switch variant.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'title', type: 'string', rn: 'title: string', desc: 'The choice.' },
          { prop: 'support', type: 'string', rn: 'support?: string', desc: 'The muted line under it.' },
          { prop: 'icon', type: 'ReactNode', rn: 'icon?: ReactNode', desc: 'The leading disc glyph. A switch row may carry none.' },
          { prop: 'iconTone', type: 'ChipTone', rn: 'iconTone?: ChipTone', desc: 'Tints the disc per item. Unchanged on select.' },
          { prop: 'flag', type: 'img', rn: 'flag?: ImageSource', desc: 'A 30 circular flag replacing the disc (the Language screen).' },
          { prop: 'selected ("on")', type: 'boolean', rn: 'selected: boolean', desc: 'Select rows: ring, deep title, filled mark together. Switch rows: only the Switch moves.' },
          { prop: 'variant ("--switch")', type: "'select' | 'switch'", default: "'select'", rn: "variant?: 'select' | 'switch'", desc: 'Switch rows trail a Switch and stand the ring down.' },
          { prop: 'onClick', type: '() => void', rn: 'onPress: () => void', desc: 'Toggles or picks; the list decides which.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Selected', rule: 'Ring, deep title and filled mark arrive together over the quick duration. The disc never changes.' },
          { state: 'Switch variant', rule: 'The Switch carries the state, so the ring and the deep title stand down - a settings list with everything on must not read as a wall of selection. The whole row is still the press target; the Switch is only the pill.' },
          { state: 'Single vs multi', rule: 'The row is identical; the list owns the semantics and the accessibility role and state.' },
          { state: 'Density', rule: 'Onboarding option rows deliberately ignore compact density: a flow you walk through once, not a list you live in.' },
          { state: 'RTL', rule: 'Disc leads, mark trails, in the writing direction. All layout is logical. The Language rows name each language in its own script whatever the app is set to.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --surface, --card-tonal, --card-line, --ink, --muted, --accent, --accent-deep, --on-accent,
        --track, --line-strong, --radius-lg, --radius-pill, --space-4/8/16, --duration-quick, --ease,
        plus the chip tone pairs for tinted discs.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Both rings on this row are borders natively, and both need a transparent twin: the card's selected
        ring wants a permanent 2-width border that is transparent until selected, and the mark's track ring
        the same at its own width - otherwise the layout jumps on select. The whole row is one{' '}
        <code>Pressable</code>; neither the mark nor the Switch is ever its own target.
      </Trap>
      <Contract label="wg/OptionRow.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
