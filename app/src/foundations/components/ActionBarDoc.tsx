import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// wg/ActionBar.tsx - implement to match.

interface ActionBarProps {
  variant?: 'row' | 'stack' | 'intro'
  children: ReactNode
}

// Geometry, from the theme:
//   row (default): flex, space-between, gap 12, text action left and the
//   pill Button right; 16 padding above to clear the content
//   stack: a column at gap 8 - the primary on top, a ghost/text action
//   under it (onboarding steps)
//   intro: a centred column at gap 16 - pager dots above a full-width
//   Button (the welcome panes)
//
// Keyboard: paddingBottom = exactly what the soft keyboard covers,
// animated over durationQuick - the frame never collapses, the bar
// rides up. Natively: KeyboardAvoidingView or reanimated keyboard
// handling on the bar alone, not the screen.
//
// On detail screens the pinned footer slot (Panel's footer) wraps this
// bar outside the scroll track, so Save can never scroll away.`

export const ActionBarDoc = () => (
  <>
    <p className="wgd-lead">
      The bar at a flow's foot that carries the commitment: Continue, Save, the skip beside it. Three
      arrangements - text-and-pill, stacked, and the intro's dots-over-button - and one physical rule:
      it always rides above the soft keyboard.
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 'var(--space-24)' }}>
          <div className="wg-actions" style={{ paddingTop: 0 }}>
            <button type="button" className="wg-btn-text">Not now</button>
            <button type="button" className="wg-btn">Continue</button>
          </div>
          <div className="wg-actions wg-actions--stack" style={{ paddingTop: 0 }}>
            <button type="button" className="wg-btn full">Connect Google</button>
            <button type="button" className="wg-btn-text">Skip for now</button>
          </div>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Flex, space-between at gap --space-12: the quiet text action starts, the pill Button ends. --space-16 padding above.' },
          { part: 'Stack', spec: 'A column at gap --space-8: the full-width primary with a ghost or text action under it. Onboarding\'s shape.' },
          { part: 'Intro', spec: 'A centred column at gap --space-16: the page dots above a full-width Button, on the welcome panes.' },
          { part: 'Keyboard lift', spec: 'Padding-bottom equals exactly what the keyboard covers (--wm-kb), transitioned over the quick duration.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'One primary', rule: 'The bar holds one filled Button at most. A second choice is text or ghost, never a second pill.' },
          { state: 'Keyboard', rule: 'The frame never collapses for the keyboard; the bar rides up by exactly the covered height and settles back when it goes.' },
          { state: 'Pinned on detail', rule: 'Detail screens pin the bar outside the scroll track (the panel\'s footer slot), so it never scrolls away and never enters the foot dissolve.' },
          { state: 'Static in flows', rule: 'In onboarding the bar holds still between steps; only the step content animates.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--space-8/12/16, --wm-kb, --duration-quick, --ease, plus the Button and text-button tokens.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Lift the BAR for the keyboard, not the screen: a whole-screen <code>KeyboardAvoidingView</code>
        squashes the content and replays every layout; here only the bar's bottom padding animates,
        over the quick duration, and the content stands still behind it.
      </Trap>
      <Contract label="wg/ActionBar.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
