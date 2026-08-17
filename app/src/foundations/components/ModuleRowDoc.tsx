import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/ModuleRow.tsx - implement to match.

interface ModuleRowProps {
  tone: ChipTone
  icon?: IconName          // glyph chip, or...
  initial?: string         // ...a letter chip for a person (Email's language)
  face?: boolean           // draw the person instead of lettering them
  name: string
  value?: string           // the row's figure: an amount, a date, a count
  meta?: string
  note?: string            // Wingman's read - a step quieter than the facts
  approval?: string        // id of the approval action the row is holding
  done?: boolean
}

// Geometry, from the theme:
//   card: home-surface fill, radius lg, hairline (cardLine)
//   padding rowPadY (12; 8 compact) / 16; gap rowGap (12; 8 compact)
//   chip: the sm rung, top-aligned (flex-start) so it holds the name line
//   on rows that grow a note or an approval; a list of single-statement
//   rows centres it instead (rowListCenter)
//   top line: name fsRow/500 and value 14, baseline-justified apart
//   meta fsSub / 1.4, muted, 4 above-gap
//   note 12.5 / 1.45, muted - one step quieter than the meta
//
// done - A SETTLED ROW KEEPS ITS ELEVATION: same surface, no recess. What
// says "settled" is only the dimming - name to 400 muted, value muted, chip
// at 0.72. A paid bill is still part of the list you are scanning. (Read
// notices are the exception and DO recede: that list is an inbox you clear.
// See Notice.)
//
// The row is NOT pressable. Only the approval action inside it presses.`

export const ModuleRowDoc = () => (
  <>
    <p className="wgd-lead">
      The one row anatomy shared by all five module screens: who or what, the figure that matters, the
      facts under it, and Wingman's own read a step quieter. What varies per module is only the content;
      the row never changes shape.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
          <div className="wg-mrow wg-card-line">
            <span className="wg-chip sand sm">
              <Icon name="receipt" size={19} variant="duotone" />
            </span>
            <span className="wg-mrow__tx">
              <span className="wg-mrow__top">
                <span className="wg-mrow__name">Electricity</span>
                <span className="wg-mrow__val">$84.20</span>
              </span>
              <span className="wg-mrow__meta">Due Friday, autopay is off</span>
              <span className="wg-mrow__note">Higher than usual for August. I checked: the rate changed, not your usage.</span>
            </span>
          </div>
          <div className="wg-mrow wg-card-line">
            <span className="wg-chip blue sm wg-chip--letter">M</span>
            <span className="wg-mrow__tx">
              <span className="wg-mrow__top">
                <span className="wg-mrow__name">Maryam</span>
                <span className="wg-mrow__val">Thu</span>
              </span>
              <span className="wg-mrow__meta">Birthday in three days</span>
            </span>
          </div>
          <div className="wg-mrow wg-card-line done">
            <span className="wg-chip mint sm">
              <Icon name="checkCircle" size={19} variant="duotone" />
            </span>
            <span className="wg-mrow__tx">
              <span className="wg-mrow__top">
                <span className="wg-mrow__name">Internet</span>
                <span className="wg-mrow__val">Paid</span>
              </span>
              <span className="wg-mrow__meta">Settled Monday</span>
            </span>
          </div>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Home-surface fill, radius lg, hairline (--card-line). Padding --row-pad-y by --space-16, gap --row-gap.' },
          { part: 'Chip', spec: 'The sm rung: a toned glyph, a letter (--letter, 15/500 - Email\'s sender language), or a drawn or photographed face. Top-aligned on rows that grow; a single-statement list centres it (wg-row-list--center).' },
          { part: 'Top line', spec: 'Name --fs-row/500 and the figure (14) pushed apart, baseline-aligned - an amount, a date, a count.' },
          { part: 'Meta', spec: '--fs-sub / 1.4, muted, --space-4 above-gap. The facts.' },
          { part: 'Note', spec: '12.5 / 1.45, muted. Wingman\'s read on the row - one step quieter than the facts above it.' },
          { part: 'Approval', spec: 'When the row holds a decision, the inline approval action renders under the text. It is the row\'s only pressable part.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'tone', type: 'ChipTone', rn: 'tone: ChipTone', desc: 'The chip\'s tint.' },
          { prop: 'icon / initial / face', type: 'IconName | string | boolean', rn: 'icon?; initial?; face?', desc: 'Glyph chip, letter chip, or drawn portrait - one of the three.' },
          { prop: 'name', type: 'string', rn: 'name: string', desc: 'The row\'s subject.' },
          { prop: 'value', type: 'string', rn: 'value?: string', desc: 'The figure on the end.' },
          { prop: 'meta', type: 'string', rn: 'meta?: string', desc: 'The facts under the name.' },
          { prop: 'note', type: 'string', rn: 'note?: string', desc: 'Wingman\'s read, quieter still.' },
          { prop: 'approval', type: 'string', rn: 'approval?: string', desc: 'The approval card this row is holding for you.' },
          { prop: 'done', type: 'boolean', rn: 'done?: boolean', desc: 'Settled: dimmed, never recessed.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Not pressable', rule: 'The row is a plain element unless it carries a decision, and then only the approval action presses. No press transform, ever.' },
          { state: 'Done', rule: 'Same elevation as the active rows: what marks it settled is the dimmed name (400, muted), muted value and chip at 0.72 - a paid bill is still part of the list. Read notices are the one settled state that recedes instead.' },
          { state: 'Density', rule: 'Compact drops --row-pad-y and --row-gap from 12 to 8 and --fs-row to 13.5 - the module lists are exactly what density exists for.' },
          { state: 'RTL', rule: 'Chip leads, figure trails; the baseline line reverses with the script.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --row-pad-y, --row-gap, --fs-row, --fs-sub, --radius-lg,
        --space-4/16, --chip-sm, the chip tone pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The name and value are baseline-aligned across one flex line; RN's <code>alignItems:
        'baseline'</code> works but is easy to lose when the value becomes a nested element - keep both
        as direct Text children of the top line. And resist making the row a <code>Pressable</code> for
        convenience: the design says the state lives on the screen and the action lives in WhatsApp,
        and a row that presses promises a detail screen the app does not have.
      </Trap>
      <Contract label="wg/ModuleRow.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
