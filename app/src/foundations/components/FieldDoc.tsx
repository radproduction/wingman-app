import { useState } from 'react'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/Field.tsx - implement to match.
interface FieldProps {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: KeyboardTypeOptions   // the web sets inputmode per field
  leading?: ReactNode                  // the phone field's country-code select
  autoFocus?: boolean
}
// Geometry, from the theme:
//   surface fill, radius pill, padding [8, 16], minHeight 58, inner gap 12
//   input text 17 (title/lg - a field is something you read back)
//   a leading select: cardTonal ground, radius pill, padding 12, 15/500
//
// Focus: a 3 focusRing halo around the WHOLE field (focus-within on web) -
// the pill carries the ring, never the bare input. Native: track focus state
// and paint the ring as a border/shadow on the container.
//
// Field-state rules the app already keeps, restated for native:
//   - autofocus: a screen that exists to be typed into focuses its first
//     field; one field per screen, never one that validates on blur mid-flow.
//   - the primary action gates on EMPTY, not on valid, so an error state
//     stays reachable.
//   - platform pickers over custom wheels; keyboardType set per field the way
//     the web sets inputmode.`

export const FieldDoc = () => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [cc, setCc] = useState('+92')
  return (
    <>
      <p className="wgd-lead">
        The text input: a pill-shaped surface hosting the platform's own input. The pill carries the focus
        ring for everything inside it, and native pickers always beat custom wheels.
      </p>

      <DocSection title="Specimen">
        <Stage ground="panel">
          <div style={{ display: 'grid', gap: 'var(--space-12)', width: 340 }}>
            <div className="wg-field">
              <input
                placeholder="Your first name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Your first name"
              />
            </div>
            <div className="wg-field">
              <select aria-label="Country code" value={cc} onChange={(e) => setCc(e.target.value)}>
                <option>+92</option>
                <option>+971</option>
                <option>+44</option>
                <option>+1</option>
              </select>
              <input
                placeholder="Phone number"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                aria-label="Phone number"
              />
            </div>
          </div>
        </Stage>
        <Note>
          Click into one: the ring wraps the whole pill, not the bare input. The second is the phone
          field's anatomy - a leading country-code select on the same surface.
        </Note>
      </DocSection>

      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Pill', spec: 'Surface fill, radius pill, padding --space-8/--space-16, min-height 58, inner gap --space-12. Sides match the 16 inner padding of option and setting rows, so field content lines up with every other step.' },
            { part: 'Input', spec: 'The platform input, bare: no border, no background, text 17 (title/lg - a field is something you read back).' },
            { part: 'Leading select', spec: 'Optional (the country code): card-tonal ground, radius pill, padding --space-12, 15/500, native appearance removed.' },
            { part: 'Focus', spec: 'A 3 --focus-ring halo around the whole field, driven by focus-within. The pill carries the ring, never the input.' },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            { prop: 'value / onChange', type: 'string', rn: 'value / onChangeText', desc: 'Controlled, always.' },
            { prop: 'placeholder', type: 'string', rn: 'placeholder?: string', desc: 'Says what goes here, in the product voice.' },
            { prop: 'inputmode', type: 'string', rn: 'keyboardType?', desc: 'Set per field: tel for phones, numeric for codes. The right keyboard is part of the design.' },
            { prop: 'leading', type: 'ReactNode', rn: 'leading?: ReactNode', desc: 'The country-code select, and nothing else so far.' },
          ]}
        />
      </DocSection>

      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'Autofocus', rule: 'A screen that exists to be typed into focuses its first field. One field per screen in a flow.' },
            { state: 'Validation', rule: 'The primary action gates on EMPTY, never on valid - so an error state stays reachable rather than the button silently refusing.' },
            { state: 'Pickers', rule: 'Native pickers over custom wheels, on every platform.' },
            { state: 'RTL', rule: 'The leading select leads in the writing direction; text alignment follows the language.' },
          ]}
        />
      </DocSection>

      <DocSection title="React Native">
        <Trap>
          The ring belongs to the pill, so the native Field tracks focus itself (onFocus/onBlur) and paints
          the halo on the container - a TextInput's own focus styling cannot reach its parent. And the
          keyboard type is part of the contract: the web sets <code>inputmode</code> per field, native sets{' '}
          <code>keyboardType</code> the same way.
        </Trap>
        <Contract label="wg/Field.tsx" code={CONTRACT} />
      </DocSection>
    </>
  )
}
