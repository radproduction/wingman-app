import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/Segmented.tsx - implement to match.
interface SegmentedProps<V extends string> {
  options: { value: V; label: string; icon?: ReactNode }[]  // 2..4
  value: V
  onChange: (v: V) => void
}
// Geometry, from the theme:
//   trough: cardTonal, radius pill, padding 4, gap 4
//   option: flex 1 (EQUAL widths - the trough divides evenly, whatever the
//   labels), radius pill, padding 12, 14/500, lineHeight 14 * pillLine,
//   muted label; the pill-nudge applies as everywhere text sits in a pill
//   active: accent fill, onAccent label
//   optional leading glyph rides a flex row, gap 8 (the mode picker)
//
// The active fill SWAPS between options - the app does not slide a pill
// between segments here. If a slide is ever wanted it is a design change,
// not a port decision.
//
// Accessibility: one radio group; each option checked/unchecked, never a
// bare row of buttons.`

const DETAIL = ['Low', 'Medium', 'High'] as const
const MODES = [
  ['car', 'Drive'],
  ['train', 'Transit'],
  ['walk', 'Walk'],
] as const

export const SegmentedDoc = () => {
  const [detail, setDetail] = useState<(typeof DETAIL)[number]>('Medium')
  const [mode, setMode] = useState<(typeof MODES)[number][0]>('car')
  return (
    <>
      <p className="wgd-lead">
        A small set of mutually exclusive options in a tonal trough, the active one filled with accent.
        Two to four options; anything more is a list of Option Rows, not a wider trough.
      </p>

      <DocSection title="Specimen">
        <Stage ground="panel">
          <div style={{ display: 'grid', gap: 'var(--space-16)', width: 340 }}>
            <div className="wg-seg">
              {DETAIL.map((d) => (
                <button key={d} type="button" className={detail === d ? 'on' : undefined} onClick={() => setDetail(d)}>
                  {d}
                </button>
              ))}
            </div>
            <div className="wg-seg">
              {MODES.map(([icon, label]) => (
                <button key={icon} type="button" className={mode === icon ? 'on' : undefined} onClick={() => setMode(icon)}>
                  <span className="m">
                    <Icon name={icon} size={18} variant="duotone" />
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </Stage>
        <Note>
          The plain form (detail level, density) and the glyph-led form (the mode picker) - the same
          trough, the second wrapping glyph and label in one flex unit.
        </Note>
      </DocSection>

      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Trough', spec: 'Card-tonal, radius pill, padding --space-4, gap --space-4.' },
            { part: 'Option', spec: 'Equal flex widths whatever the labels, radius pill, padding --space-12, 14/500, muted.' },
            { part: 'Active', spec: 'Accent fill, on-accent label. The fill swaps between options; nothing slides.' },
            { part: 'Glyph form', spec: 'A leading 18 duotone glyph and the label as one flex unit on a --space-8 gap, tinting with the label.' },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            { prop: 'options', type: 'SegmentedOption[]', rn: 'options', desc: 'Two to four of {value, label, icon?}. Equal widths always.' },
            { prop: 'value / onChange', type: 'V', rn: 'value / onChange', desc: 'Single-select, controlled.' },
          ]}
        />
      </DocSection>

      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'Selection', rule: 'The fill swaps; the app deliberately does not slide a pill between segments here.' },
            { state: 'Count', rule: 'Two to four options. More is a list of Option Rows.' },
            { state: 'A11y', rule: 'One radio group; each option carries checked state, never a bare row of buttons.' },
          ]}
        />
      </DocSection>

      <DocSection title="React Native">
        <Trap>
          Equal widths come from <code>flex: 1</code> on every option, not from measuring labels - the
          trough divides evenly whatever the copy, which is what keeps three languages from producing
          three layouts. The active state is a fill swap; resist adding a sliding pill during the port.
        </Trap>
        <Contract label="wg/Segmented.tsx" code={CONTRACT} />
      </DocSection>
    </>
  )
}
