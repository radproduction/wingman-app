import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { ICON_NAMES } from '../sections/IconsSection'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/Icon.tsx - implement to match. The glyph data ships in the kit
// (icons/duotone.ts): each glyph is a list of [tag, attributes] SVG elements
// for react-native-svg.

type IconName = /* the closed union of the 51 vendored names - generate it
                   from the glyph module's exports; an unvendored name is a
                   type error, not a runtime blank */

interface IconProps {
  name: IconName
  size: number             // ALWAYS from the chip rung: theme.chipIcon[rung]
                           // (18/22/24/26) - never a call-site number
  color?: string           // ONE colour; both duotone layers derive from it
}

// Drawing rules:
//   - duotone is two layers of the same hue: the fill layer carries its own
//     opacity (~0.4) in the glyph data; paint stroke AND fill from 'color'.
//     Never accept a second colour prop.
//   - viewBox is 24x24 for every glyph; scale by 'size'.
//   - decorative by default: accessibilityElementsHidden / importantForAccessibility
//     (the web sets aria-hidden). A meaningful icon gets its label from the
//     component that contains it, never from the glyph.`

const VARIANTS = ['duotone', 'stroke', 'solid'] as const

export const IconDoc = () => {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('duotone')
  const [picked, setPicked] = useState<(typeof ICON_NAMES)[number]>('spark')

  return (
    <>
      <p className="wgd-lead">
        One library, one style, one closed list. Every glyph in the app is Hugeicons drawn duotone - a
        soft fill under a full-weight stroke, both painted from one colour - and the 51 names below are
        the whole vocabulary. A new icon is added to the set deliberately, never improvised at a call
        site.
      </p>

      <DocSection title="Specimen">
        <div className="wgd-playbar" role="group" aria-label="variant">
          {VARIANTS.map((v) => (
            <button key={v} type="button" className="wgd-play" aria-pressed={variant === v} onClick={() => setVariant(v)}>
              {v}
            </button>
          ))}
        </div>
        <Stage ground="home">
          {([18, 22, 24, 26] as const).map((size) => (
            <span key={size} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, color: 'var(--accent-deep)' }}>
              <Icon name={picked} variant={variant} size={size} />
              <code>{size}</code>
            </span>
          ))}
        </Stage>
        <Note>
          The four sizes are the chip rungs' icon sizes (18/22/24/26) - an icon is sized by the rung it
          sits in, never by the call site. Duotone is what the app draws; stroke and solid exist and are
          used sparingly (the tab bar's active state is the main solid).
        </Note>
        <div className="wgd-icons">
          {ICON_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              className="wgd-icons__cell"
              aria-pressed={picked === name}
              onClick={() => setPicked(name)}
            >
              <Icon name={name} variant={variant} size={22} />
              <code>{name}</code>
            </button>
          ))}
        </div>
      </DocSection>

      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Glyph', spec: 'A 24x24 viewBox, scaled by size. Duotone: a fill layer at ~0.4 opacity under a 1.5-weight stroke, both from one colour.' },
            { part: 'Sizes', spec: 'Exactly four, paired to the chip rungs: 18 (xs), 22 (sm), 24 (md), 26 (lg). Buttons use 18 (14 on the small pill), a documented exception.' },
            { part: 'Colour', spec: 'currentColor by default; on a tinted chip, the same hue at a MID tone ([D-005]), never the deepest shade.' },
          ]}
        />
      </DocSection>

      <DocSection title="Props">
        <PropsTable
          rows={[
            { prop: 'name', type: 'IconName', rn: 'name: IconName', desc: 'The closed union. A name outside it fails the build, not the render.' },
            { prop: 'variant', type: 'IconVariant', default: "'stroke'", rn: '(duotone only)', desc: 'duotone, stroke or solid. The web default is stroke for legacy reasons, but the app draws duotone; native ships duotone alone until a screen needs otherwise.' },
            { prop: 'size', type: 'number', default: '22', rn: 'size: number', desc: 'From the chip rung. The call site never invents a size.' },
            { prop: 'color', type: 'string', default: 'currentColor', rn: 'color?: string', desc: 'One colour; both layers derive from it.' },
          ]}
        />
      </DocSection>

      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'Decorative', rule: 'Hidden from assistive tech by default (aria-hidden on web). A meaningful icon is labelled by its containing component.' },
            { state: 'RTL', rule: 'A chevron means onward and back, not right and left - it turns with the writing direction. Nothing else mirrors.' },
            { state: 'Reuse', rule: 'A near-match already in the set beats a new glyph that means the same thing (chevronRight over a new arrowRight).' },
          ]}
        />
      </DocSection>

      <DocSection title="React Native">
        <Trap>
          The kit's <code>icons/duotone.ts</code> is the source: dependency-free SVG element data, one
          export per glyph. Build one Icon component over <code>react-native-svg</code> and generate the
          name union from the module's exports, so the web's closed-list guarantee survives the port. The
          one rule that must not be lost: <strong>one colour prop</strong> - duotone is two layers of the
          same hue, and a second colour prop is how the recipe dies.
        </Trap>
        <Contract label="wg/Icon.tsx" code={CONTRACT} />
      </DocSection>
    </>
  )
}
