import { useState } from 'react'
import { Icon, type IconName } from '../../app/icons'
import { CHIP_ICON_TOKENS } from '../data'
import { Copy, Note, Section, Sub, Trap } from '../parts'
import { pxOf } from '../resolve'
import { tv } from '../tokenStore'

export const ICON_NAMES = [
  'chat', 'mail', 'calendar', 'check', 'checkCircle', 'task', 'bell', 'clock', 'globe', 'user',
  'users', 'plane', 'box', 'receipt', 'heart', 'moon', 'sun', 'home', 'grid', 'briefcase',
  'chevronLeft', 'chevronRight', 'plus', 'shield', 'spark', 'phone', 'trash', 'alert', 'download',
  'truck', 'card', 'pin', 'passport', 'hotel', 'office', 'edit', 'addCircle', 'gym', 'activity',
  'logout', 'close', 'palette', 'volume', 'motion', 'translate', 'car', 'walk', 'train', 'scooter',
  'search', 'news',
] as const satisfies readonly IconName[]

type MissingIcons = Exclude<IconName, (typeof ICON_NAMES)[number]>
const _iconsCovered: MissingIcons extends never ? true : MissingIcons = true
void _iconsCovered

const VARIANTS = ['duotone', 'stroke', 'solid'] as const

export const IconsSection = () => {
  const [variant, setVariant] = useState<(typeof VARIANTS)[number]>('duotone')

  return (
    <Section
      id="icons"
      title="Iconography"
      lead="One library, one style. Every glyph is Hugeicons drawn duotone: a soft fill under a full-weight stroke, both painted from one colour, so a single token moves both layers. There is no second icon set and no hand-drawn path anywhere in the app."
    >
      <div className="wgd-playbar">
        <span className="wgd-note">Variant</span>
        {VARIANTS.map((v) => (
          <button
            key={v}
            type="button"
            className="wgd-play"
            aria-pressed={variant === v}
            onClick={() => setVariant(v)}
          >
            {v}
          </button>
        ))}
        <span className="wgd-note">
          {ICON_NAMES.length} vendored glyphs. Duotone is what the app draws; the other two are available and
          used sparingly.
        </span>
      </div>

      <Sub title="The set">
        <div className="wgd-icons">
          {ICON_NAMES.map((name) => (
            <div className="wgd-icons__cell" key={name}>
              <Icon name={name} variant={variant} size={24} />
              <code>{name}</code>
              <Copy text={name} />
            </div>
          ))}
        </div>
      </Sub>

      <Sub
        title="Size follows the chip rung"
        note="An icon does not choose its own size at the call site; it takes the size of the chip it sits in."
      >
        <div className="wgd-icons__sizes">
          {CHIP_ICON_TOKENS.map((token) => {
            const size = pxOf(tv(token).light) ?? 22
            return (
              <div className="wgd-icons__size" key={token}>
                <Icon name="spark" variant="duotone" size={size} />
                <code>{token}</code>
                <span className="wgd-shape__val">{size}</span>
              </div>
            )
          })}
        </div>
      </Sub>

      <Note>
        Reuse before adding. A near-match already in the set beats a new glyph that means the same thing, and
        the glyph on a tinted chip is the same hue at a mid tone rather than the deepest shade of it. The
        brand mark is hand-authored and is not part of this set.
      </Note>

      <Trap>
        The glyph data is vendored as SVG paths, so it crosses through{' '}
        <code>react-native-svg</code> without needing the icon vendor&rsquo;s token at build time. Two things
        to preserve: duotone is <strong>two layers painted from one colour</strong>, so the native component
        takes a single colour prop and derives the fill opacity rather than accepting two colours; and size
        comes from the chip rung, not from the call site, or the four-rung invariant quietly dies.
      </Trap>
    </Section>
  )
}
