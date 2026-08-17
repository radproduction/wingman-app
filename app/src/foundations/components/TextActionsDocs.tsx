import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'


const LINK_CONTRACT = `// wg/InlineLink.tsx - implement to match.
interface InlineLinkProps {
  label: string
  onPress: () => void
  chevron?: boolean        // the trailing onward chevron, 14, gap 4
  danger?: boolean         // the CALM rose (toneRose), never the alert red -
                           // a deletion reads as deliberate, not an alarm [D-009]
  end?: boolean            // push to the trailing edge of a flex row
}
// 13/500, accentDeep (toneRose when danger). An inline-flex row, gap 4.
// Hit area: the text is small, so carry hitSlop up to the 44 target.
// The chevron turns with the writing direction (it means onward, not right).`

export const InlineLinkDoc = () => (
  <>
    <p className="wgd-lead">
      The small accent action that trails a row: a "Manage connection", an "Undo", a "Details" with its
      chevron. One identity that used to be three drifting lookalikes, consolidated by [D-028].
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        <button type="button" className="wg-link">
          Manage connection
        </button>
        <button type="button" className="wg-link">
          Details <Icon name="chevronRight" size={14} />
        </button>
        <button type="button" className="wg-link wg-link--danger">
          Delete recording
        </button>
      </Stage>
      <Note>Plain, chevroned, and the destructive form in the calm rose.</Note>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Text', spec: '13/500, --accent-deep. An inline-flex row on a --space-4 gap.' },
          { part: 'Chevron', spec: 'Optional, trailing, 14. It means onward, so it turns with the writing direction.' },
          { part: 'Danger', spec: 'The calm --tone-rose, never the bright alert red: a deletion reads as deliberate, not an alarm ([D-009]).' },
          { part: 'End', spec: 'The --end modifier pushes it to the trailing edge of the flex row it lives in.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'label', type: 'string', rn: 'label: string', desc: 'Says what happens.' },
          { prop: 'chevron', type: 'boolean', default: 'false', rn: 'chevron?: boolean', desc: 'The trailing onward mark.' },
          { prop: 'danger', type: 'boolean', default: 'false', rn: 'danger?: boolean', desc: 'The calm rose for destructive inline actions.' },
          { prop: 'end', type: 'boolean', default: 'false', rn: 'end?: boolean', desc: 'Rides the trailing edge of its row.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Placement', rule: 'Trails a row or a card line; never stands alone as the primary action of a screen - that is a Button.' },
          { state: 'Hit area', rule: 'The text is small; the target is not. 44 minimum, carried by padding or hitSlop.' },
        ]}
      />
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/InlineLink.tsx" code={LINK_CONTRACT} />
    </DocSection>
  </>
)


const TEXTBTN_CONTRACT = `// wg/TextButton.tsx - implement to match.
interface TextButtonProps {
  label: string
  onPress: () => void
  inline?: boolean         // inside a note's running sentence: tap padding
                           // collapses to zero so it aligns with the text
}
// 15/500, accentDeep - Button-size type with none of Button's chrome.
// Standing alone it carries its own tap padding [12, 8]; inside a sentence
// (inline) the padding goes and the surrounding Text gives the line height.
// Hit area: hitSlop to 44 either way.`

export const TextButtonDoc = () => (
  <>
    <p className="wgd-lead">
      An action styled as text at Button size: the back-bar's "Edit", the "Resend code" inside a
      verification note. Folded into the one-button system by [D-028] - same voice, no chrome.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <button type="button" className="wg-btn-text">
          Resend code
        </button>
        <p className="wg-note" style={{ marginTop: 0, maxWidth: 300 }}>
          <Icon name="clock" size={16} variant="duotone" />
          <span>
            Codes can take a minute to arrive.{' '}
            <button type="button" className="wg-btn-text">
              Resend code
            </button>
          </span>
        </p>
      </Stage>
      <Note>
        Standing alone with its own tap padding, and inside a note's running sentence, where the padding
        collapses so it sits on the text line.
      </Note>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Text', spec: '15/500, --accent-deep - the Button label without the pill.' },
          { part: 'Tap padding', spec: '--space-12 / --space-8 standing alone; zero inside a note, where the sentence owns the line.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Vs Inline link', rule: 'This is Button-sized text for a real action; the Inline link is the smaller 13px trail on a row. They are not interchangeable.' },
          { state: 'Hit area', rule: '44 minimum via hitSlop, especially in the inline form where visual padding is zero.' },
        ]}
      />
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The inline form nests a pressable inside running text: natively that is a{' '}
        <code>Text onPress</code> span inside the sentence's Text, not a View - a View would break the
        line-wrapping.
      </Trap>
      <Contract label="wg/TextButton.tsx" code={TEXTBTN_CONTRACT} />
    </DocSection>
  </>
)
