import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/Notice.tsx - implement to match.

interface NoticeProps {
  icon: IconName
  tone: ChipTone
  title: string
  time: string             // "2h", "Yesterday" - already formatted
  body: string
  read: boolean
  onRead: () => void       // tapping an unread notice marks it read
  approval?: string        // a notice can hold an inline approval action
}

// Geometry, from the theme:
//   card: home-surface fill, radius lg, hairline (cardLine)
//   padding rowPadY / 16, gap rowGap, top-aligned
//   chip: sm rung; unread wears the dot: a 10 accent circle riding the
//   chip's top-end corner at -1 overhang (optical, the [D-029] carve-out),
//   ringed 2.5 in the surface colour - the same dot Email's sender chip uses
//   top line: title fsRow/500 and time (12, muted) baseline-justified apart
//   body fsSub / 1.4, muted, 4 above-gap
//
// read - THE ONE SETTLED STATE THAT RECEDES: ground drops to settled (below
// the panel), the stroke goes, title to 400 muted, chip to 0.72. This list
// is an inbox you clear, so clearing must visibly empty it. (A paid bill
// does the opposite and keeps its elevation - see ModuleRow.done.)`

const DemoNotice = ({
  tone,
  icon,
  title,
  time,
  body,
}: {
  tone: string
  icon: 'receipt' | 'plane' | 'bell'
  title: string
  time: string
  body: string
}) => {
  const [read, setRead] = useState(false)
  return (
    <button type="button" className={`wg-notice wg-card-line ${read ? 'read' : ''}`} onClick={() => setRead(!read)}>
      <span className={`wg-chip ${tone} sm`}>
        <Icon name={icon} size={19} variant="duotone" />
        {!read && <i className="wg-notice__unread" aria-hidden="true" />}
      </span>
      <span className="wg-notice__tx">
        <span className="wg-notice__top">
          <span className="wg-notice__title">{title}</span>
          <span className="wg-notice__time">{time}</span>
        </span>
        <span className="wg-notice__body">{body}</span>
      </span>
    </button>
  )
}

export const NoticeDoc = () => (
  <>
    <p className="wgd-lead">
      A notification row. Unread sits on a white card, its chip wearing the accent dot; tap it (or
      Mark all read) and it recedes into the panel. The screen literally empties as you clear it - the
      state change is the feedback.
    </p>

    <DocSection title="Specimen">
      <Note>Tap a notice to toggle it read.</Note>
      <Stage ground="panel">
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <DemoNotice tone="sand" icon="receipt" title="Electricity bill is in" time="2h" body="Due Friday. Higher than usual - I checked, the rate changed." />
          <DemoNotice tone="peach" icon="plane" title="Check-in opens tomorrow" time="Yesterday" body="I can check you in the moment it opens. Window seat, as always?" />
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Home-surface fill, radius lg, hairline (--card-line). Padding --row-pad-y by --space-16, gap --row-gap, top-aligned.' },
          { part: 'Chip', spec: 'The sm rung with the notice\'s tone and glyph.' },
          { part: 'Unread dot', spec: 'A 10 accent circle on the chip\'s top-end corner, overhanging by 1 (optical geometry, the [D-029] carve-out), ringed 2.5 in --surface. The same dot Email\'s sender chip wears.' },
          { part: 'Top line', spec: 'Title --fs-row/500 and the time (12, muted) pushed apart on one baseline.' },
          { part: 'Body', spec: '--fs-sub / 1.4, muted, --space-4 above-gap.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'icon + tone', type: 'IconName + ChipTone', rn: 'icon: IconName; tone: ChipTone', desc: 'What kind of notice this is.' },
          { prop: 'title', type: 'string', rn: 'title: string', desc: 'The event.' },
          { prop: 'time', type: 'string', rn: 'time: string', desc: 'Relative time, already formatted.' },
          { prop: 'body', type: 'string', rn: 'body: string', desc: 'Wingman\'s line about it.' },
          { prop: 'read', type: 'boolean', rn: 'read: boolean', desc: 'Recedes the row and drops the dot.' },
          { prop: 'onRead', type: '() => void', rn: 'onRead: () => void', desc: 'Marks it read on tap.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Read', rule: 'Ground drops to --settled, the hairline goes, the title relaxes to 400 muted, the chip dims to 0.72 - the row visibly leaves the pile. The one settled state that recedes; a settled module row keeps its elevation instead.' },
          { state: 'Press', rule: 'The ground transitions over the quick duration; no transform - the row is barely a button, and only an approval action inside it is a real control.' },
          { state: 'Mark all read', rule: 'The screen action recedes every row at once; the emptying is the feedback, so no toast follows it.' },
          { state: 'RTL', rule: 'The dot rides inset-inline-end, so it flips to the chip\'s leading corner with the script; title and time swap ends.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --settled, --card-line, --surface, --accent, --muted, --row-pad-y, --row-gap,
        --fs-row, --fs-sub, --radius-lg, --radius-pill, --space-4/16, --duration-quick, --ease, the
        chip tone pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The dot's ring is a <code>box-shadow</code> spread on the web; natively make it a 2.5 border in
        the surface colour on a 15 circle (10 + 2.5 each side), positioned absolutely off the chip's
        top-end corner. The overhang is a stated -1, an optical carve-out from the geometry rules - do
        not "fix" it to 0.
      </Trap>
      <Contract label="wg/Notice.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
