import { useRef, useState } from 'react'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/CodeBox.tsx - implement to match.
interface CodeBoxProps {
  length: number                 // 6 in the app
  value: string
  onChange: (code: string) => void
}
// Geometry: a flex row, gap 8; each box flex 1 at aspect 0.86 (taller than
// wide), surface fill, radius lg, centred 24/500 digit, accent caret.
// Focus ring: 3 focusRing on the FOCUSED BOX (each box carries its own).
//
// Interaction contract, exactly the web's:
//   - typing a digit advances focus to the next box
//   - backspace on an empty box moves back and clears the previous
//   - paste anywhere fills the row from its first box
//   - numeric keyboard (inputmode numeric / keyboardType number-pad)
//   - each box labelled "Digit n" for assistive tech
//   - the primary action gates on the row being COMPLETE (all digits), the
//     one place the empty-gates rule yields to completeness
//
// Native option worth taking: one hidden TextInput holding the whole code
// with the boxes as a purely visual layer - it makes paste and autofill
// (textContentType oneTimeCode / autofill sms-otp) work for free. The
// CONTRACT is the look and the interaction above, not the DOM shape.`

export const CodeBoxDoc = () => {
  const [digits, setDigits] = useState(['', '', '', '', '', ''])
  const refs = useRef<(HTMLInputElement | null)[]>([])

  const put = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '').slice(-1)
    setDigits((d) => d.map((x, j) => (j === i ? v : x)))
    if (v && i < 5) refs.current[i + 1]?.focus()
  }
  const key = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      setDigits((d) => d.map((x, j) => (j === i - 1 ? '' : x)))
      refs.current[i - 1]?.focus()
    }
  }
  const paste = (e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (!text) return
    e.preventDefault()
    setDigits(Array.from({ length: 6 }, (_, i) => text[i] ?? ''))
    refs.current[Math.min(text.length, 5)]?.focus()
  }

  return (
    <>
      <p className="wgd-lead">
        The verification-code entry: one box per digit, focus walking forward as you type, backspace
        walking back, paste filling the row. Six digits in the app.
      </p>

      <DocSection title="Specimen">
        <Stage ground="panel">
          <div className="wg-code" style={{ width: 340 }} onPaste={paste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el
                }}
                inputMode="numeric"
                aria-label={`Digit ${i + 1}`}
                value={d}
                onChange={(e) => put(i, e.target.value)}
                onKeyDown={(e) => key(i, e)}
              />
            ))}
          </div>
        </Stage>
        <Note>Type into it - focus advances per digit, backspace walks back, and pasting a code fills the row.</Note>
      </DocSection>

      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Row', spec: 'Flex, gap --space-8; each box flex 1 at aspect ratio 0.86, taller than wide.' },
            { part: 'Box', spec: 'Surface fill, radius lg, centred 24/500 digit, --accent caret, its own 3 --focus-ring when focused.' },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            { prop: 'length', type: 'number', default: '6', rn: 'length: number', desc: 'One box per digit.' },
            { prop: 'value / onChange', type: 'string', rn: 'value / onChange', desc: 'The whole code as one string, controlled.' },
          ]}
        />
      </DocSection>

      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'Typing', rule: 'A digit advances focus; backspace on an empty box moves back and clears the previous.' },
            { state: 'Paste', rule: 'Pasting anywhere fills the row from its first box.' },
            { state: 'Gate', rule: 'The primary action gates on the row being complete - the one place the empty-gates rule yields to completeness.' },
            { state: 'A11y', rule: 'Numeric keyboard; each box labelled "Digit n".' },
          ]}
        />
      </DocSection>

      <DocSection title="React Native">
        <Trap>
          Take the hidden-input option: one TextInput holding the whole code with the boxes as a visual
          layer makes paste and OS autofill (<code>textContentType: 'oneTimeCode'</code>, autofill{' '}
          <code>sms-otp</code>) work for free. The contract is the look and the interaction, not the DOM
          shape.
        </Trap>
        <Contract label="wg/CodeBox.tsx" code={CONTRACT} />
      </DocSection>
    </>
  )
}
