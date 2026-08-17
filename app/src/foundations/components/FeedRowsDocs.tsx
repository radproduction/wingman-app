import { useState, type CSSProperties } from 'react'
import { Icon } from '../../app/icons'
import { Avatar } from '../../app/Avatar'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const TASK_CONTRACT = `// wg/TaskRow.tsx - implement to match.

interface TaskRowProps {
  title: string
  source?: { label: string; tone: ChipTone; icon?: ReactNode }
  due?: string
  done: boolean
  onToggle: () => void
}

// Geometry, from the theme:
//   row: homeSurface, radius lg, hairline, padding rowPadY / 16, gap
//   rowGap; press scales to 0.99. List stacks at listGap.
//   check: a 24 circle - open, an inset 2 track ring; done, accent fill
//   title fsRow/500; done: muted with a line-through in the track colour
//   source: an 11.5/500 tone pill ("From WhatsApp"), 8 above-gap
//   due: 12.5/500 muted on the end; done turns it ok-green
//
// THE CHECK DRAW (motion.named.check) - the app's signature completion:
//   1. the disc fills first: ring -> accent over 150ms
//   2. the tick draws itself along its own path over 350ms - stroke
//      dash offset from the path's MEASURED length to 0, never a fade
//   3. un-checking reverses the draw in 150ms; a half-drawn tick can
//      reverse cleanly because only the offset ever hides it
// Measure the path (getTotalLength / RN equivalent) - hardcoding breaks
// the draw the day the glyph changes. Reduced motion: fill and tick
// simply appear.`

const MAIL_CONTRACT = `// wg/MailRow.tsx - implement to match.

interface MailRowProps {
  from: string
  subject: string
  time: string
  tone: ChipTone
  initial: string          // letter chip; person: true draws the portrait
  person?: boolean
  unread?: boolean
  ready?: string           // the drafted-reply tag ("Reply drafted")
  did?: string             // what Wingman already did (the handled list)
  handled?: boolean
  onPress?: () => void
}

// Geometry, from the theme:
//   row: homeSurface, radius lg, hairline, padding rowPadY / 16, gap
//   rowGap; press scales to 0.99
//   chip: sm, the sender's letter (fsRow/500) or drawn face; unread
//   wears the 10 ALERT-red dot ringed 2.5 in the surface - unread shares
//   the bell badge's red, never the blue accent
//   top line: from fsRow/500 and the time (12 muted), baseline-justified
//   subject: fsSub muted, one line, ellipsised
//   ready tag: 11.5/500 accentDeep on accentTonal, 8 above-gap - the
//   draft itself stays behind the tap
//   did tag: the same tag cooled to muted-on-panel, so the handled list
//   reads as a receipt, not another thing to action
//
// handled: chip at 0.62, sender relaxed to 400 muted - a step back from
// the rows still wanting you, without receding below the panel.`

const TaskDemo = () => {
  const [done, setDone] = useState(false)
  return (
    <Stage ground="panel">
      <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
        <button
          type="button"
          className={`wg-task wg-card-line${done ? ' done' : ''}`}
          onClick={() => setDone(!done)}
          style={{ '--check-len': 16 } as CSSProperties}
        >
          <span className="wg-task__check" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <span className="wg-task__tx">
            <span className="wg-task__title">Reply to the school about Thursday</span>
            <span className="wg-task__src blue">
              <Icon name="chat" size={12} />
              From WhatsApp
            </span>
          </span>
          <span className="wg-task__due">Today</span>
        </button>
        <button type="button" className="wg-task wg-card-line" style={{ '--check-len': 16 } as CSSProperties}>
          <span className="wg-task__check" aria-hidden="true">
            <Icon name="check" size={14} />
          </span>
          <span className="wg-task__tx">
            <span className="wg-task__title">Renew the car insurance</span>
            <span className="wg-task__src sand">
              <Icon name="mail" size={12} />
              From Email
            </span>
          </span>
          <span className="wg-task__due">Fri</span>
        </button>
      </div>
    </Stage>
  )
}

const MailDemo = () => (
  <Stage ground="panel">
    <div style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
      <button type="button" className="wg-mail-row wg-card-line">
        <span className="wg-chip lavender sm">
          M
          <i className="wg-mail-row__unread" aria-hidden="true" />
        </span>
        <span className="wg-mail-row__tx">
          <span className="wg-mail-row__top">
            <span className="wg-mail-row__from">Maryam Khan</span>
            <span className="wg-mail-row__time">9:14</span>
          </span>
          <span className="wg-mail-row__subj">Thursday pickup - can we swap this week?</span>
          <span className="wg-mail-row__ready">
            <Icon name="spark" size={12} variant="duotone" />
            Reply drafted
          </span>
        </span>
      </button>
      <button type="button" className="wg-mail-row wg-card-line handled">
        <span className="wg-chip blue sm">
          <Avatar id="bank" />
        </span>
        <span className="wg-mail-row__tx">
          <span className="wg-mail-row__top">
            <span className="wg-mail-row__from">First National</span>
            <span className="wg-mail-row__time">Yesterday</span>
          </span>
          <span className="wg-mail-row__subj">Your statement is ready</span>
          <span className="wg-mail-row__did">
            <Icon name="check" size={12} />
            Filed under Finances
          </span>
        </span>
      </button>
    </div>
  </Stage>
)

export const TaskRowDoc = () => (
  <>
    <p className="wgd-lead">
      A task, where it came from, and when it is due - with the app's signature completion: tap
      anywhere on the row and the disc fills first, then the tick draws itself along its own path.
      Tap the first specimen.
    </p>

    <DocSection title="Specimen">
      <TaskDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Home-surface, radius lg, hairline, padding --row-pad-y by --space-16, gap --row-gap; the list stacks at --list-gap. Press scales to 0.99.' },
          { part: 'Check', spec: 'A 24 circle: open, an inset 2 --track ring with nothing visible inside; done, --accent fill with the on-accent tick.' },
          { part: 'Title', spec: '--fs-row/500 / 1.25. Done: muted, line-through in the track colour - crossed out gently, not cancelled.' },
          { part: 'Source', spec: 'An 11.5/500 tone pill naming where Wingman pulled it from ("From WhatsApp"), --space-8 above-gap.' },
          { part: 'Due', spec: '12.5/500 muted on the end; done turns it --ok green.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'The draw', rule: 'Disc fills over --check-box (150ms), then the tick draws along its measured path over --check-draw (350ms) - hidden only ever by dash offset, never by colour, so a half-drawn tick reverses cleanly.' },
          { state: 'Un-check', rule: 'The draw runs backwards over --check-uncheck (150ms) and the disc empties.' },
          { state: 'Whole-row target', rule: 'The row toggles; the check is never the only target.' },
          { state: 'Reduced motion', rule: 'Fill and tick appear in place.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --track, --accent, --on-accent, --ok, --muted, --row-pad-y,
        --row-gap, --list-gap, --fs-row, --radius-lg, --radius-pill, --space-8/16, --check-box,
        --check-draw, --check-uncheck, --check-ease, the chip tone pairs for source pills.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Measure the tick's path length at runtime (react-native-svg exposes it) and drive only
        <code> strokeDashoffset</code> - the app deliberately never hides the tick with colour, and
        that is what makes mid-draw reversal free. A hardcoded length breaks silently the day the
        glyph changes.
      </Trap>
      <Contract label="wg/TaskRow.tsx" code={TASK_CONTRACT} />
    </DocSection>
  </>
)

export const MailRowDoc = () => (
  <>
    <p className="wgd-lead">
      An email as Wingman presents it: who, what, when - and what Wingman already did about it. The
      unread dot rides the sender chip in the alert red, a drafted reply announces itself as a quiet
      tag, and handled rows step back without leaving the list.
    </p>

    <DocSection title="Specimen">
      <MailDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Home-surface, radius lg, hairline, padding --row-pad-y by --space-16, gap --row-gap; press scales to 0.99.' },
          { part: 'Chip', spec: 'The sm rung: the sender\'s letter at --fs-row/500, or the drawn portrait for a person. Unread wears the 10 dot in --alert red ringed 2.5 in the surface - unread shares the bell badge\'s red, never the accent.' },
          { part: 'Top line', spec: 'Sender --fs-row/500 and the time (12 muted) baseline-justified apart.' },
          { part: 'Subject', spec: '--fs-sub muted, one line, ellipsised.' },
          { part: 'Ready tag', spec: '11.5/500 in --accent-deep on --accent-tonal, --space-8 above: "Reply drafted". The draft itself stays behind the tap.' },
          { part: 'Did tag', spec: 'The same tag cooled to muted-on-panel: what Wingman already did, so the handled list reads as a receipt.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Handled', rule: 'Chip dims to 0.62 and the sender relaxes to 400 muted - a step back from the rows still wanting you, without receding below the panel.' },
          { state: 'Approval rows', rule: 'A row holding a decision opens its approval sheet on tap instead of the thread.' },
          { state: 'Unread discipline', rule: 'The dot is the only unread signal; the row never bolds its whole line the way a mail client does.' },
          { state: 'RTL', rule: 'Chip leads, time trails; the dot rides inset-inline-end.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --alert, --surface, --accent-deep, --accent-tonal, --panel,
        --muted, --row-pad-y, --row-gap, --fs-row, --fs-sub, --radius-lg, --radius-pill,
        --space-4/8/12/16, --duration-quick, --ease, the chip tone pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/MailRow.tsx" code={MAIL_CONTRACT} />
    </DocSection>
  </>
)
