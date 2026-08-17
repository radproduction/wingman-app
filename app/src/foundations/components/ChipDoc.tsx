import { useState } from 'react'
import { Icon, type IconName } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const TONES = ['blue', 'lavender', 'mint', 'peach', 'sand', 'rose'] as const
const SIZES = ['xs', 'sm', 'md', 'lg'] as const
const ICON_PER_SIZE: Record<(typeof SIZES)[number], number> = { xs: 18, sm: 22, md: 24, lg: 26 }
const TONE_ICON: Record<(typeof TONES)[number], IconName> = {
  blue: 'calendar',
  lavender: 'mail',
  mint: 'check',
  peach: 'box',
  sand: 'receipt',
  rose: 'heart',
}

const CONTRACT = `// wg/Chip.tsx - implement to match.

type ChipTone = 'blue' | 'lavender' | 'mint' | 'peach' | 'sand' | 'rose'
type ChipSize = 'xs' | 'sm' | 'md' | 'lg'   // 32 / 40 / 48 / 52, icon 18 / 22 / 24 / 26

interface ChipProps {
  size?: ChipSize        // default 'sm', the workhorse rung
  tone?: ChipTone        // pale ground + same-hue MID-tone glyph; omit for a
                         // face or brand chip, which paints itself
  children: ReactNode    // the glyph. The chip sizes it: theme.chipIcon[size]
}

// Geometry, from the theme:
//   diameter: theme.chip[size]  - borderRadius = diameter / 2, computed,
//   never a hardcoded number (a ratio, not a radius)
//   the glyph is centred and sized by the rung, NOT by the call site
//
// Invariants that must survive the port:
//   - exactly four diameters. Never a fifth, never a raw number.
//   - the glyph on a tinted chip is the same hue at a MID tone
//     (theme.tone[tone]), never the deepest shade of it. [D-005]
//   - compact density folds the sm rung to xs IN THE THEME, so a component
//     asks for the rung and never learns which density it is in.`

const Playground = () => {
  const [size, setSize] = useState<(typeof SIZES)[number]>('sm')
  return (
    <>
      <div className="wgd-playbar" role="group" aria-label="size">
        {SIZES.map((s) => (
          <button key={s} type="button" className="wgd-play" aria-pressed={size === s} onClick={() => setSize(s)}>
            {s}
          </button>
        ))}
      </div>
      <Stage ground="home">
        {TONES.map((tone) => (
          <span key={tone} className={`wg-chip ${tone} ${size}`}>
            <Icon name={TONE_ICON[tone]} size={ICON_PER_SIZE[size]} variant="duotone" />
          </span>
        ))}
      </Stage>
    </>
  )
}

export const ChipDoc = () => (
  <>
    <p className="wgd-lead">
      The circular identity holder that leads a row, a card or a hero: who or what this item is, told by
      tone and glyph. Six tones, four sizes, and both lists are closed.
    </p>

    <DocSection title="Specimen">
      <Playground />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Disc', spec: 'A circle at one of the four rungs: 32 / 40 / 48 / 52 (--chip-xs..lg). The radius is diameter / 2 - a ratio, deliberately off the radius scale.' },
          { part: 'Glyph', spec: 'Centred, sized by the rung (18 / 22 / 24 / 26), duotone, painted in the same hue as the ground at a mid tone - never the deepest shade ([D-005]).' },
          { part: 'Tones', spec: 'blue, lavender, mint, peach, sand, rose. The sixth exists because a heart is red ([D-019]).' },
          { part: 'Face and brand chips', spec: 'A chip may hold a portrait or a connector mark instead of a glyph; those paint themselves and the chip stays untinted.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'size', type: 'ChipSize', default: "'sm'", rn: 'size?: ChipSize', desc: 'xs / sm / md / lg. sm is the workhorse; lg is the screen and widget hero.' },
          { prop: 'tone', type: 'ChipTone', rn: 'tone?: ChipTone', desc: 'The pale ground. Omitted for face and brand chips.' },
          { prop: 'children', type: 'ReactNode', rn: 'children: ReactNode', desc: 'The glyph. The chip sizes it by the rung; the call site never picks an icon size.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Compact density', rule: 'The sm rung folds down to xs, icon included. This lives in the theme, not in call sites.' },
          { state: 'Selection', rule: 'A chip never changes on select: the row around it carries the selected state. The tinted glyph is unchanged on select.' },
          { state: 'Dark', rule: 'The six grounds and six tones re-point; the recipe (pale ground, mid-tone glyph) holds in both themes.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --chip-xs/sm/md/lg, --chip-icon-xs/sm/md/lg, --chip-blue..rose, --tone-blue..rose, --radius-pill
        (the CSS spells the circle as a pill; natively it is diameter / 2).
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The whole value of this component is its invariants: four diameters and no fifth, glyph sized by
        the rung and not the call site, mid-tone glyph on the tinted ground. A native Chip that accepts a
        numeric <code>size</code> prop has already broken all three. <code>borderRadius</code> must be
        computed from the diameter - React Native takes no percentage radius.
      </Trap>
      <Contract label="wg/Chip.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
