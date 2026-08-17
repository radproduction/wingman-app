import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// wg/NotConnected.tsx - implement to match.

interface NotConnectedProps {
  art: ReactNode           // the tab's own drawing (calendar, envelope)
  title: string            // "Your calendar isn't connected"
  body: string             // what connecting gets you, truthfully
  action: ReactNode        // ONE Button that starts the connect flow
}

// Geometry, from the theme:
//   a centred column filling the leftover space (the screen already
//   clears the tab bar - clearing it twice pushes the block above
//   centre); padding 0 / 24, gap 8
//   art: sized by HEIGHT - min(15vh, 112) - because the drawings have
//   different aspect ratios and it is the vertical presence that must
//   match across tabs; 24 below-margin
//   title 19/500, -0.01em; body 14 / 1.5, muted, 24 below-margin
//   then the one Button
//
// The artwork animates idly (the calendar's days fill in one after
// another and hold, 3.6s loop) so the drawing reads as the tab waiting
// to be filled, never as a loading bar. Reduced motion stills it.
// The art ink is the COOL tonal twin: the page under it is cool grey,
// and a warm cell reads as beige on it.`

export const NotConnectedDoc = () => (
  <>
    <p className="wgd-lead">
      What a tab shows before its service is connected: the tab's own drawing, one truthful line about
      what connecting gets you, and the single button that starts it. Centred in the space the content
      would fill - the screen is honest about being empty without ever looking broken.
    </p>

    <DocSection title="Specimen">
      <Note>
        Stand-in glyph: the real screens draw hand-authored artwork (a calendar filling itself in, an
        envelope) that lives with the app, not in the kit.
      </Note>
      <Stage ground="panel">
        <div className="wg-nc" style={{ width: '100%', maxWidth: 340, minHeight: 300 }}>
          <span className="wg-chip blue lg" style={{ marginBottom: 'var(--space-24)' }}>
            <Icon name="calendar" size={26} variant="duotone" />
          </span>
          <strong>Your calendar isn't connected</strong>
          <p>Connect Google Calendar and I plan your day around what is actually in it.</p>
          <button type="button" className="wg-btn">Connect calendar</button>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Block', spec: 'A centred column in the leftover space, padding 0 by --space-24, gap --space-8. The screen already clears the tab bar; the block does not clear it twice.' },
          { part: 'Art', spec: 'Sized by height - min(15vh, 112) - so tabs with different drawings take the same vertical presence. --space-24 below. Its ink is the cool tonal twin (--art-ink).' },
          { part: 'Title', spec: '19/500, -0.01em. States the fact: "isn\'t connected", never "empty".' },
          { part: 'Body', spec: '14 / 1.5, muted, --space-24 below. What connecting gets you - truthful, one sentence.' },
          { part: 'Action', spec: 'One Button. It starts the connect flow; there is nothing else to do here.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Idle motion', rule: 'The artwork animates gently on a 3.6s loop (the calendar\'s days fill in and hold) - the tab waiting to be filled, never a spinner or a bar.' },
          { state: 'After connecting', rule: 'The tab simply renders its content; this screen has no exit of its own.' },
          { state: 'Reduced motion', rule: 'The artwork stills; everything else is static already.' },
          { state: 'Voice', rule: 'The truthful line: what is missing and what fixing it buys, in Wingman\'s first person. No blame, no mascot sadness.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--art-ink, --accent-tonal, --muted, --space-8/24, --ease, plus the Button tokens.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The artwork is inline SVG that ships with the app (react-native-svg), and its idle loop is a
        fill-colour cycle, not a transform - cheap anywhere. Keep the height-based sizing: matching
        widths across tabs is what makes differently-shaped drawings look inconsistent.
      </Trap>
      <Contract label="wg/NotConnected.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
