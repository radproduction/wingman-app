import { useState } from 'react'
import { Switch } from '../../shell/Switch'
import { Note } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'


const FOOTNOTE_CONTRACT = `// wg/Footnote.tsx - implement to match.
interface FootnoteProps { children: ReactNode }
// Text, 12/500-weight-400, lineHeight 12 * 1.5, colour theme.palette.*.muted,
// textAlign center, margin [4, 8]. That is the whole component: the small
// print under a group - a data promise, a version line, a member-since.`

export const FootnoteDoc = () => (
  <>
    <p className="wgd-lead">
      The small print under a group: a data promise, a version line, a member-since. Muted, centred, and
      the second most reused block in the app (23 screens) precisely because it is this boring.
    </p>
    <DocSection title="Specimen">
      <Stage ground="panel">
        <p className="wg-footnote" style={{ maxWidth: 360 }}>
          Wingman reads your calendar to build the briefing. Nothing is shared, and you can disconnect any
          time in Settings.
        </p>
      </Stage>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Text', spec: '12, Regular, line-height 1.5, --muted, centred. Margin --space-4 block, --space-8 inline.' },
          { part: 'That is all', spec: 'No icon slot, no tone, no emphasis. A footnote that needs more is a Notice.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Long text', rule: 'Wraps freely; it is a paragraph, not a label.' },
          { state: 'Placement', rule: 'Directly under the group it annotates, inside the same panel rhythm.' },
        ]}
      />
    </DocSection>
    <DocSection title="React Native">
      <Contract label="wg/Footnote.tsx" code={FOOTNOTE_CONTRACT} />
    </DocSection>
  </>
)


const CAPTION_CONTRACT = `// wg/Caption.tsx - implement to match.
interface CaptionProps { children: string }
// 11/500, letterSpacing 11 * 0.08, uppercase, theme.palette.*.muted,
// paddingHorizontal 4. The web pulls the control up under it with a negative
// margin; natively, give the caption+control column a tight fixed gap instead
// of a negative margin.`

export const CaptionDoc = () => {
  const [on, setOn] = useState(true)
  return (
  <>
    <p className="wgd-lead">
      A small all-caps label above a control, for the times a section head would be too loud: one head can
      own several controls and this names each one quietly.
    </p>
    <DocSection title="Specimen">
      <Stage ground="panel">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 280 }}>
          <p className="wg-cap">Meeting audio</p>
          <button
            type="button"
            onClick={() => setOn(!on)}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, background: 'var(--surface)', border: '1px solid var(--card-line)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-16)', font: 'inherit', fontSize: 15, cursor: 'pointer', color: 'inherit' }}
          >
            Record by default
            <Switch on={on} />
          </button>
        </div>
      </Stage>
      <Note>Shown labelling a switch row; the caption itself is only the label above the control.</Note>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Text', spec: '11, Medium, +8% letter-spacing, uppercase, --muted. The overline role from the type ramp.' },
          { part: 'Fit', spec: 'Padding --space-4 inline; the web pulls its control up under it with a negative --space-8 margin.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'One per control', rule: 'A caption names exactly one control. Several controls under one section head means several captions.' },
          { state: 'RTL', rule: 'Letter-spacing is removed on Arabic-script languages (it breaks joining); the caption falls back to weight alone.' },
        ]}
      />
    </DocSection>
    <DocSection title="React Native">
      <Contract label="wg/Caption.tsx" code={CAPTION_CONTRACT} />
    </DocSection>
  </>
  )
}


const SECT_CONTRACT = `// wg/SectionHeading.tsx - implement to match.
interface SectionHeadingProps { children: string }
// 21/500, letterSpacing 21 * -0.01, theme.palette.*.ink,
// margin [16, 8, 8]. Weight 500 is this system's ONLY emphasis weight -
// a bold section head is a design change, not a preference.`

export const SectionHeadDoc = () => (
  <>
    <p className="wgd-lead">
      The heading that opens a group of cards or rows on a panel ("Your day so far"). Larger and darker
      than everything under it, and that is its entire job.
    </p>
    <DocSection title="Specimen">
      <Stage ground="panel">
        <div style={{ minWidth: 300 }}>
          <h2 className="wg-sect" style={{ marginTop: 0 }}>
            Your day so far
          </h2>
          <p className="wg-footnote" style={{ textAlign: 'start', margin: 0 }}>
            (the cards it introduces sit under it on the panel)
          </p>
        </div>
      </Stage>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Text', spec: '21, Medium, -1% tracking, --ink. Margin --space-16 above, --space-8 sides and below.' },
          { part: 'Weight', spec: 'Medium (500) - the only emphasis weight in the system. Never bold.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Rhythm', rule: 'The gap above a section head is the panel column rhythm ([D-030]): one --space-16 step, not an ad-hoc gap.' },
          { state: 'Quiet alternative', rule: 'When a head would be too loud for what it labels, use a Caption instead.' },
        ]}
      />
    </DocSection>
    <DocSection title="React Native">
      <Contract label="wg/SectionHeading.tsx" code={SECT_CONTRACT} />
    </DocSection>
  </>
)
