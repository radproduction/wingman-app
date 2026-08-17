import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// wg/ApprovalAction.tsx + wg/ApprovalCard.tsx - implement to match.

interface ApprovalActionProps {
  id: string               // the decision; the host renders the card
}
// Inline, wherever the decision surfaces (a bill row, a mail row, a
// notice). PENDING: the small soft accent pill carrying the CTA ("Pay
// it"). DECIDED: no pill - a 12.5 status line in the state's own colour
// (in-flight accentDeep, done okSoft, dismissed muted, failed warn) with
// its 14 icon. A list of decisions visibly RESOLVES as you work through
// it - the same law that recedes a read notice.

interface ApprovalCardProps {   // rendered inside the Sheet by one host
  approval: Approval
}
// The sheet's anatomy, top to bottom:
//   state strip: a pill naming where the decision is - pending
//   (accentTonal/accentDeep), done (mint/okSoft), dismissed
//   (cardTonal/muted), failed (sand/warn). In flight it carries the
//   7 pulse dot (the pulse tokens) - the ONE place the app admits it is
//   doing something in the world.
//   why: 14.5 / 1.5 muted - why Wingman is asking, or what came of it.
//   One slot for both, so the card never rearranges.
//   facts: a panelInner card of label/value lines (13.5, baseline-
//   justified, lineSoft hairlines) - exactly what will happen, so
//   approving is never a leap of faith. A line the user edited turns
//   its value accentDeep: marked as yours.
//   edit: the standard Field, when the decision has a changeable part.
//   actions: the sheet action tiers - approve (primary), change /
//   dismiss (quiet), never an alarm.
//
// The card never times out and never auto-approves. dismissable: false
// while a decision is in flight - the sheet owns its exit then.`

const ActionsDemo = () => (
  <Stage ground="home">
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)', alignItems: 'flex-start' }}>
      <button type="button" className="wg-btn sm soft wg-act">Pay it</button>
      <span className="wg-act wg-act--settled work">
        <Icon name="clock" size={14} />
        Paying it now
      </span>
      <span className="wg-act wg-act--settled done">
        <Icon name="checkCircle" size={14} />
        Paid, Tuesday 14:02
      </span>
      <span className="wg-act wg-act--settled">
        <Icon name="close" size={14} />
        Dismissed
      </span>
    </div>
  </Stage>
)

const CardDemo = () => (
  <Stage ground="panel">
    <div
      className="wg-card-line"
      style={{ width: '100%', maxWidth: 340, background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-24)' }}
    >
      <div style={{ marginBottom: 'var(--space-16)' }}>
        <span className="wm-ap__state">
          <span className="wm-ap__pulse" aria-hidden="true" />
          Waiting on you
        </span>
      </div>
      <p className="wm-ap__why">
        The electricity bill came in higher than usual. I checked: the rate changed, not your usage.
        Pay it as normal?
      </p>
      <div className="wm-ap__facts">
        <div className="wm-ap__fact">
          <span>Amount</span>
          <strong>$84.20</strong>
        </div>
        <div className="wm-ap__fact">
          <span>To</span>
          <strong>City Power</strong>
        </div>
        <div className="wm-ap__fact changed">
          <span>When</span>
          <strong>Friday morning</strong>
        </div>
      </div>
      <div className="wm-ap__acts">
        <button type="button" className="wg-btn full">Pay it</button>
        <button type="button" className="wg-btn full quiet">Change something</button>
      </div>
    </div>
  </Stage>
)

export const ApprovalCardDoc = () => (
  <>
    <p className="wgd-lead">
      The one pattern the whole product hangs on: Wingman proposes, you decide. Inline, a decision is
      a small accent pill that recedes into a status line once made; in the sheet, the full card
      states where the decision is, why it is being asked, and exactly what will happen.
    </p>

    <DocSection title="Specimen">
      <Note>The inline action's four lives: pending, in flight, done, dismissed.</Note>
      <ActionsDemo />
      <Note>The card, as the sheet carries it: state strip, the why, the facts, the tiers.</Note>
      <CardDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Inline pending', spec: 'The small soft accent pill (wg-btn sm soft) carrying the CTA, --space-8 above its row\'s content. Opens the sheet.' },
          { part: 'Inline settled', spec: 'No pill: a 12.5 status line with a 14 icon in the state\'s own colour - in flight --accent-deep, done --ok-soft (the mint mid-tone, [D-005]), dismissed muted, failed --warn.' },
          { part: 'State strip', spec: 'A 12.5/500 pill naming where the decision is: accent-tonal pending, mint done, card-tonal dismissed, sand failed. In flight it carries the 7 pulse dot on the pulse tokens.' },
          { part: 'Why', spec: '14.5 / 1.5 muted: why Wingman is asking, or what came of it - one slot for both, so the card never rearranges.' },
          { part: 'Facts', spec: 'A --panel-inner card of label/value lines at 13.5, baseline-justified, --line-soft hairlines between. A line you edited turns its value --accent-deep: marked as yours.' },
          { part: 'Actions', spec: 'The sheet tiers: approve as the primary, change and dismiss quiet. Destructive dismissal takes the warn tier, never an alarm.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Resolving', rule: 'Pending is a pill; decided is a line. A list of decisions visibly resolves as you work through it - the same law that recedes a read notice and keeps a paid bill in place.' },
          { state: 'In flight', rule: 'The pulse dot is the one place the app admits it is doing something in the world. While in flight the sheet is not dismissable - the decision owns its exit.' },
          { state: 'Never assumed', rule: 'The card never times out, never auto-approves, and never buries the dismissal. The facts say exactly what will happen before you say yes.' },
          { state: 'Edited', rule: 'A changed fact is marked as yours (accent-deep value) and the recommendation updates; the card keeps its shape.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --accent-tonal, --accent-deep, --chip-mint, --ok-soft, --card-tonal, --chip-sand, --warn,
        --panel-inner, --line-soft, --muted, --radius-pill, --radius-lg, --space-4/8/12/16/24,
        --pulse-dur, --pulse-min, --ease-in-out, plus the Button and Sheet tokens.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        One host renders every approval sheet; rows only carry the id. Port that shape - if each row
        owns its own sheet, two taps can race two sheets open, and the in-flight dismissability rule
        has to be re-implemented everywhere. The settled status line is NOT a Button restyled: it is a
        plain pressable line, and reusing Button's geometry for it re-inflates the row.
      </Trap>
      <Contract label="wg/ApprovalCard.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
