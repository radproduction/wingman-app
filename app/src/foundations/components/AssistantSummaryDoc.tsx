import { IconSpark } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/AssistantSummary.tsx - implement to match.

interface AssistantSummaryProps {
  children: ReactNode      // the paragraph; <b> runs render at 600
}

// Geometry, from the theme:
//   card: home-surface fill, radius lg, hairline (cardLine), padding 16
//   row at gap 12, top-aligned
//   spark: the 18 spark glyph in toneMint, nudged 4 down so it sits on the
//   first line's cap height rather than floating above it
//   text: 15.5 / 1.5 - a step warmer and larger than a brief line; bold
//   runs at 600 for the parts that matter ("Good morning, Asif.")
//
// The voice rule outranks the geometry: this is Wingman speaking in the
// first person about YOUR day - never a heading, never a label, never
// system text. If the copy could sit on a dashboard tile, it does not
// belong here.
//
// Natively the bold runs are nested Text spans with fontWeight 600 inside
// the paragraph Text - one Text block, so the line wraps as one paragraph.`

export const AssistantSummaryDoc = () => (
  <>
    <p className="wgd-lead">
      The personalized read at the top of a screen: Wingman, in its own voice, telling you what the day
      or the screen amounts to before you scan a single row. One spark, one paragraph, first person -
      and seventeen screens open with it.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-bc__summary wg-card-line" style={{ width: '100%', maxWidth: 420 }}>
          <IconSpark size={18} />
          <p>
            <b>Good morning, Asif.</b> Two meetings, one decision waiting, and traffic is on your side.
            The Meridian call is the one to prepare for - I've drafted the brief.
          </p>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Home-surface fill, radius lg, hairline (--card-line), padding --space-16. A row at gap --space-12, top-aligned.' },
          { part: 'Spark', spec: 'The 18 spark glyph in --tone-mint, nudged --space-4 down to sit on the first line\'s cap height.' },
          { part: 'Paragraph', spec: '15.5 / 1.5 - a step warmer and larger than a brief line. Bold runs at 600 carry the address and the verdict.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'children', type: 'ReactNode', rn: 'children: ReactNode', desc: 'The paragraph, with bold runs where the weight belongs. The component adds nothing else - no title, no action.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Voice', rule: 'First person, present tense, addressed to the user. It reads the screen for you; it never labels it. If the sentence would survive as a heading, rewrite it.' },
          { state: 'Placement', rule: 'First in the panel, before any list or grid - the read comes before the rows it is a read of.' },
          { state: 'Not pressable', rule: 'A statement, not a control. Anything actionable it mentions has its own row or button below.' },
          { state: 'RTL', rule: 'Spark leads in the writing direction; the paragraph is one text run and follows the script.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--home-surface, --card-line, --tone-mint, --radius-lg, --space-4/12/16.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Keep the paragraph ONE Text element with nested bold spans - splitting the address into its own
        Text puts it on its own line and the card stops reading as a spoken sentence. And the component
        deliberately has no <code>title</code>, <code>icon</code> or <code>action</code> props: the
        moment it grows them it becomes another card, and the one block that is unmistakably Wingman's
        voice disappears.
      </Trap>
      <Contract label="wg/AssistantSummary.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
