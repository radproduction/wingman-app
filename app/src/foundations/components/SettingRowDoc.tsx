import { Icon, type IconName } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/SettingRow.tsx (+ SettingList) - implement to match.

interface SettingRowProps {
  icon: IconName
  tone: ChipTone
  name: string
  value?: string          // current value, muted, end-aligned, ellipsised
  onPress?: () => void
  inPlace?: boolean       // drops the chevron: the row acts here, it does
                          // not lead anywhere, and a chevron would promise
                          // a screen that does not exist
  warn?: boolean          // destructive: name + chip in the rose mid-tone,
                          // stated calmly, never alarmed
}

// Geometry, from the theme:
//   list: ONE home-surface card, radius lg, overflow hidden; the rows carry
//   no radius of their own
//   row: paddingVertical setPadY (12; 8 compact), paddingHorizontal 16, gap 12
//   chip: the xs rung (32) - one step under a free-standing row's 40, so a
//   field list stays scannable by glyph without reading as a stack of cards
//   name fsRow, allowed to SHRINK AND WRAP (translated labels cannot be
//   measured in advance; two lines beat a truncated question)
//   value 13.5 muted, end-aligned, single line, ellipsised
//   chevron 18, ink
//
// Separator: a 1 hairline (line) between rows, starting AT THE LABEL, not the
// card edge: inset start = 16 + 32 + 12. The chips read as one column and the
// hairline stops competing with them. Natively: a View per boundary with
// marginStart 60, never a row border.
//
// Press: the row flashes panelInner while active. No transform.`

const DemoRow = ({
  icon,
  tone,
  name,
  value,
  warn,
  chev = true,
}: {
  icon: IconName
  tone: string
  name: string
  value?: string
  warn?: boolean
  chev?: boolean
}) => (
  <button type="button" className={`wg-set${warn ? ' warn' : ''}`}>
    <span className={`wg-chip ${tone} xs`}>
      <Icon name={icon} size={17} variant="duotone" />
    </span>
    <span className="wg-set__name">{name}</span>
    {value ? <span className="wg-set__val">{value}</span> : null}
    {chev ? <Icon name="chevronRight" size={18} className="chev" /> : null}
  </button>
)

export const SettingRowDoc = () => (
  <>
    <p className="wgd-lead">
      The field row of every settings screen: rows share one white card with hairline separators, so
      settings read as a set of fields rather than the free-standing cards a feed uses. Each row leads
      with its own tinted chip - what makes a long column scannable by glyph instead of by reading.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-set-list wg-card-line" style={{ width: '100%', maxWidth: 420 }}>
          <DemoRow icon="bell" tone="peach" name="Notifications" value="Only when urgent" />
          <DemoRow icon="globe" tone="blue" name="Language" value="English" />
          <DemoRow icon="moon" tone="lavender" name="Appearance" value="System" />
          <DemoRow icon="trash" tone="rose" name="Delete everything I know" warn chev={false} />
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'List', spec: 'One home-surface card, radius lg, overflow hidden, hairline (--card-line). The rows carry no surface or radius of their own.' },
          { part: 'Row', spec: 'Padding --set-pad-y (12; 8 compact) by --space-16, gap --space-12. Active ground --panel-inner, no transform.' },
          { part: 'Chip', spec: 'The xs rung (32) with a 17 duotone glyph - one step under a free-standing row\'s 40, so a field list does not read as a stack of cards.' },
          { part: 'Name', spec: '--fs-row, allowed to shrink and wrap: labels ship in four languages and cannot be measured in advance, and two lines beat a question truncated mid-word.' },
          { part: 'Value', spec: '13.5 muted, end-aligned, single line with an ellipsis. Omitted on rows that just open.' },
          { part: 'Chevron', spec: '18, ink. Dropped on in-place rows: a chevron promises a screen.' },
          { part: 'Separator', spec: 'A 1 hairline (--line) between rows, starting at the label: inset-inline-start = 16 + 32 + 12, so the chip column stays clean.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'icon', type: 'IconName', rn: 'icon: IconName', desc: 'The row\'s glyph, on its chip.' },
          { prop: 'tone', type: 'ChipTone', rn: 'tone: ChipTone', desc: 'The chip\'s tint. Rose is reserved for destructive rows.' },
          { prop: 'name', type: 'string', rn: 'name: string', desc: 'The setting.' },
          { prop: 'value', type: 'string', rn: 'value?: string', desc: 'Current value on the end, muted. Names, numbers and times pass through untranslated.' },
          { prop: 'to / onTap', type: 'string | () => void', rn: 'onPress?: () => void', desc: 'Navigate, or act in place.' },
          { prop: 'inPlace', type: 'boolean', rn: 'inPlace?: boolean', desc: 'Drops the chevron for rows that ask something here.' },
          { prop: 'warn', type: 'boolean', rn: 'warn?: boolean', desc: 'Destructive: name and chip take the rose mid-tone. Calm, never alarmed.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Press', rule: 'The row\'s ground flashes --panel-inner over the quick duration. No scale, no lift.' },
          { state: 'Long label', rule: 'The name shrinks, then wraps to a second line at the point it would meet the chevron. Never truncated.' },
          { state: 'Warn', rule: 'The rose family, stated quietly: tinted chip, mid-tone name. The confirmation belongs to the sheet the row opens, not to the row.' },
          { state: 'Density', rule: 'Compact drops --set-pad-y from 12 to 8 and --fs-row from 15 to 13.5; the chip rung is unchanged.' },
          { state: 'RTL', rule: 'Chip leads, chevron trails and flips, the separator inset follows the writing direction. All logical properties.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --panel-inner, --line, --muted, --ink, --tone-rose, --chip-xs,
        --set-pad-y, --fs-row, --radius-lg, --space-12/16, --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The separator's start inset is the row's own arithmetic (padding + chip + gap = 60), so if the
        row's geometry ever changes the inset changes with it - derive it, do not restate it. And the
        list's <code>overflow: hidden</code> is what clips the first and last rows' press flash to the
        card's radius; natively that is <code>overflow: 'hidden'</code> on the list card, or the flash
        paints square corners.
      </Trap>
      <Contract label="wg/SettingRow.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
