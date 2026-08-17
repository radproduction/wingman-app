import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'


const GROUP_CONTRACT = `// wg/SettingGroup.tsx - implement to match.

interface SettingGroupProps {
  children: ReactNode     // ListRows
}

// One surface card, radius lg, overflow hidden - the card exists to clip its
// rows to one shape. It sets NO padding and NO gap: the rows own their own
// 16, and the separator between them is drawn by the row (see ListRow).
//
// SettingGroup vs SettingList (the settings screens' wg-set-list): the same
// idea - one card, many rows - but this one holds label rows with in-place
// controls (a time input, a picker), while SettingList holds navigation and
// value rows. Do not merge them: their rows differ in anatomy, separator
// inset and press behaviour.`

const ROW_CONTRACT = `// wg/ListRow.tsx - implement to match.

interface ListRowProps {
  icon: ReactNode          // 38 disc, toned to the chip recipe
  tone?: ChipTone
  title: string
  support?: string         // 12.5 muted line under the title
  control: ReactNode       // the row's point: a time value, a picker
}

// Geometry, from the theme:
//   row: flex, centred, gap 16, padding 16; no surface of its own - the
//   group card behind it is the surface
//   disc: 38 circle on the chip recipe (pale ground, mid-tone glyph) -
//   the same disc Option Row leads with
//   title 15/500; support 12.5, muted, 4 above-gap
//   separator: a 1 line in the CANVAS colour between rows, full width -
//   unlike SettingList's inset hairline, because these rows lead with a
//   disc, not a chip column
//
// The row is a LABEL, not a button: tapping anywhere focuses/open the
// trailing control. Natively: Pressable that forwards to the control's
// open(), with the row as the accessibility target.
//
// The trailing time control draws as a card-tonal pill: padding 8/16,
// 15/500, radius pill. It is the platform's own picker behind a pill face.`

export const SettingGroupDoc = () => (
  <>
    <p className="wgd-lead">
      The card that groups label rows into one block: the schedule card on onboarding, quiet hours in
      Permissions. It exists to give its rows one surface and one radius - everything else belongs to
      the rows.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-group wg-card-line" style={{ width: '100%', maxWidth: 420 }}>
          <label className="wg-row">
            <span className="wg-glyph lavender" style={{ width: 38, height: 38, margin: 0 }}>
              <Icon name="clock" size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>Quiet from</strong>
              <span>I hold anything that is not urgent</span>
            </span>
            <input type="time" defaultValue="21:30" />
          </label>
          <label className="wg-row">
            <span className="wg-glyph mint" style={{ width: 38, height: 38, margin: 0 }}>
              <Icon name="sun" size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>Back on at</strong>
              <span>Mornings pick up as normal</span>
            </span>
            <input type="time" defaultValue="07:00" />
          </label>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Card', spec: 'Surface fill, radius lg, overflow hidden, hairline (--card-line). No padding, no gap: the rows own their spacing.' },
          { part: 'Rows', spec: 'List rows (the next page), stacked flush; each pair separated by the row\'s own canvas-colour line.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'vs Setting list', rule: 'Same idea, different rows: this card holds label rows with in-place controls; the settings screens\' list holds navigation and value rows. They are not the same component.' },
          { state: 'Clipping', rule: 'overflow hidden is load-bearing: it clips the first and last rows to the card\'s radius.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--surface, --card-line, --radius-lg.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/SettingGroup.tsx" code={GROUP_CONTRACT} />
    </DocSection>
  </>
)


export const ListRowDoc = () => (
  <>
    <p className="wgd-lead">
      The label row inside a grouped card: a 38 toned disc, a title with its support line, and the
      control the row exists for on the end - a time you can change, right where the label names it.
      The whole row is the label, so tapping anywhere reaches the control.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-group wg-card-line" style={{ width: '100%', maxWidth: 420 }}>
          <label className="wg-row">
            <span className="wg-glyph peach" style={{ width: 38, height: 38, margin: 0 }}>
              <Icon name="sun" size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>Morning briefing</strong>
              <span>Your day, before it starts</span>
            </span>
            <input type="time" defaultValue="07:30" />
          </label>
          <label className="wg-row">
            <span className="wg-glyph mint" style={{ width: 38, height: 38, margin: 0 }}>
              <Icon name="clock" size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>Workday starts</strong>
            </span>
            <input type="time" defaultValue="09:00" />
          </label>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Flex, centred, gap --space-16, padding --space-16. No surface: the group card behind it is the surface.' },
          { part: 'Disc', spec: '38 circle on the chip recipe (pale ground, same-hue mid-tone glyph) - the same disc Option Row leads with.' },
          { part: 'Text', spec: 'Title 15/500; optional support line 12.5 muted, 4 below.' },
          { part: 'Control', spec: 'The trailing control the row labels. The time input draws as a card-tonal pill: padding --space-8 by --space-16, 15/500, radius pill.' },
          { part: 'Separator', spec: 'Rows after the first carry a 1 line in the canvas colour, full width - these rows lead with a disc, so there is no chip column to protect with an inset.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'icon + tone', type: 'ReactNode + ChipTone', rn: 'icon: ReactNode; tone?: ChipTone', desc: 'The 38 toned disc.' },
          { prop: 'title', type: 'string', rn: 'title: string', desc: 'What the control sets.' },
          { prop: 'support', type: 'string', rn: 'support?: string', desc: 'The muted line under it.' },
          { prop: 'control', type: 'ReactNode', rn: 'control: ReactNode', desc: 'The trailing control. The row is its label and its press target.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Tap', rule: 'The row is a label: tapping anywhere opens or focuses the trailing control. The control is never the only target.' },
          { state: 'Density', rule: 'Unchanged under compact density - these rows appear in onboarding and short settings groups, not in the lists density exists for.' },
          { state: 'RTL', rule: 'Disc leads, control trails, in the writing direction.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --surface, --canvas, --card-tonal, --muted, --radius-pill, --space-4/8/16, --pill-line, plus
        the chip tone pair of the disc.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Two things the web hides. The disc is drawn today by borrowing the onboarding glyph disc with an
        inline size override - that borrowing does not cross; natively it is the same 38 disc Option Row
        specifies. And the time control is <code>input type="time"</code>, the browser's own picker
        behind a pill face - natively it is the platform date-time picker opened from the row, with the
        chosen value drawn in the pill.
      </Trap>
      <Contract label="wg/ListRow.tsx" code={ROW_CONTRACT} />
    </DocSection>
  </>
)
