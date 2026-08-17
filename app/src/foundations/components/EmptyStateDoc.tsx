import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// wg/EmptyState.tsx - implement to match.

interface EmptyStateProps {
  icon: ReactNode         // inside a md chip; the screen picks tone + glyph
  tone: ChipTone
  title: string           // "Nothing waiting" - a statement, not an apology
  body: string            // what happens next, in Wingman's own voice
}

// Geometry, from the theme:
//   card: home-surface fill, radius lg, hairline (cardLine)
//   column, centred, gap 4; padding 24 / 24 / 32 (extra at the foot so the
//   card does not end tight under the body line)
//   chip: the md rung, 8 below-margin to the title
//   title 15/500; body 13 / 1.45, muted, measure capped at 30ch
//
// It renders IN PLACE OF the list, on the same panel ground - never as an
// overlay and never as a bare centred column. An empty screen still gets a
// card, so "nothing here" reads as a state the app is holding, not a hole.`

export const EmptyStateDoc = () => (
  <>
    <p className="wgd-lead">
      What a list shows when it has nothing to show. A calm card in the list's place: a toned chip, a
      short statement, and a line about what happens next - never a blank panel, and never an apology.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-empty wg-card-line" style={{ width: '100%', maxWidth: 420 }}>
          <span className="wg-chip mint md">
            <Icon name="checkCircle" size={22} variant="duotone" />
          </span>
          <strong>Nothing waiting</strong>
          <p>You're through every decision I've raised. I'll bring you the next one when it matters.</p>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Home-surface fill, radius lg, hairline (--card-line). A centred column at gap --space-4, padding --space-24 with --space-32 at the foot.' },
          { part: 'Chip', spec: 'The md rung, --space-8 below-margin. The screen picks the tone and glyph: mint check for an inbox cleared, a spark for something Wingman will fill.' },
          { part: 'Title', spec: '15/500. A statement of the state, two or three words.' },
          { part: 'Body', spec: '13 / 1.45, muted, measure capped at 30ch so the line never runs the card\'s full width.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Placement', rule: 'Renders in place of the list it stands for, on the same panel ground. Never an overlay, never a bare column.' },
          { state: 'Voice', rule: 'First person, forward-looking: what Wingman will do next, not what the user failed to have. "Nothing on file. I\'ll start again from whatever you tell me next."' },
          { state: 'Not pressable', rule: 'A plain element. If the empty state should lead somewhere, the action is a Button below it, never the card itself.' },
          { state: 'RTL', rule: 'Centred, so direction costs nothing; the body line follows the script.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --radius-lg, --space-4/8/24/32, the chip tone pair the
        screen picks.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The 30ch measure cap is a text-width constraint, not a container width: natively give the body
        a <code>maxWidth</code> derived from the font size (roughly 30 x the body size's average
        character) or set a fixed 240 and check it against the longest translation - Arabic and Hindi
        bodies run wider than the English they translate.
      </Trap>
      <Contract label="wg/EmptyState.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
