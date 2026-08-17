import { SHADOW_TOKENS } from '../data'
import { Copy, Note, Section, Sub, Trap } from '../parts'
import { parseShadow, type ShadowLayer } from '../resolve'
import { tv } from '../tokenStore'

const ANDROID_FALLBACK: Record<string, number> = {
  '--shadow-card': 3,
  '--shadow-nav': 12,
  '--shadow-sheet': 16,
  '--shadow-thumb': 2,
  '--shadow-toast': 12,
}

const SHADOW_USE: Record<string, string> = {
  '--shadow-card': 'a card lifted off the panel',
  '--shadow-nav': 'the floating tab bar',
  '--shadow-sheet': 'a bottom sheet, throwing upward',
  '--shadow-thumb': 'a dragged thumb, plus its hairline ring',
  '--shadow-toast': 'the toast',
}

const isRing = (layer: ShadowLayer) => layer.x === 0 && layer.y === 0 && layer.blur === 0

export const ElevationSection = () => (
  <Section
    id="elevation"
    title="Elevation"
    lead="Separation is tonal first. Shadow is reserved for things that genuinely float above the screen. A shadow used to separate two things that are both flat on the same surface is a mistake, and the fix is tone."
  >
    <div className="wgd-elev">
      {SHADOW_TOKENS.map((name) => {
        const value = tv(name)
        const layers = parseShadow(value.light)
        const rings = layers.filter(isRing)
        const shadows = layers.filter((layer) => !isRing(layer))
        const boxShadow = value.light
          .split(/,(?![^(]*\))/)
          .map((part) => part.trim())
          .filter((part) => !/^0\s+0\s+0\s/.test(part))
          .join(', ')
        return (
          <div className="wgd-elev__row" key={name}>
            <span className="wgd-elev__box" style={{ boxShadow: `var(${name})` }} />
            <div className="wgd-elev__meta">
              <code>{name}</code>
              <Copy text={name} />
              <span className="wgd-shape__use">
                {SHADOW_USE[name]}
                {shadows.length > 1 ? ` (${shadows.length} layers)` : ''}
              </span>
              <span className="wgd-elev__css">light: {value.light}</span>
              {value.dark !== value.light ? <span className="wgd-elev__css">dark: {value.dark}</span> : null}
              <span className="wgd-elev__rn">
                <code>boxShadow: '{boxShadow}'</code>
                {rings.length ? <> plus a 1px border for the ring</> : null}
              </span>
              <span className="wgd-elev__rn wgd-elev__rn--quiet">
                Android 7-8 fallback: <code>elevation: {ANDROID_FALLBACK[name]}</code>
              </span>
            </div>
          </div>
        )
      })}
    </div>

    <Note>
      Shadows go deeper in dark rather than lighter: on charcoal a light shadow does not register, so the
      surfaces do the lifting instead. Take the dark value from the row above, never the light one at a
      different opacity.
    </Note>

    <Sub title="How this carries across">
      <Trap>
        <p>
          <strong>On the New Architecture this is nearly a copy.</strong> React Native 0.76 added{' '}
          <code>boxShadow</code> as a real style prop, New Architecture only: CSS-like syntax, the same on
          both platforms, and <strong>multiple shadows are supported</strong>. This project is on the New
          Architecture, so the five values above transfer as their own strings. None of the old workarounds
          apply: no one-shadow-per-view limit, no <code>elevation</code>-only Android, no nested wrapper per
          layer, no shadow library.
        </p>
        <p>
          <strong>The one real catch is the Android floor.</strong>{' '}
          <code>boxShadow</code> needs Android 9, and this project ships to minSdk 24, so on Android 7 and 8
          the prop does nothing and those versions need the <code>elevation</code> fallback shown on each
          row. It is a thin slice of devices and a flatter shadow is acceptable there, but it should be a
          decision rather than a surprise. The sheet is the one that degrades visibly, because Android
          cannot throw a shadow upward at all.
        </p>
        <p>
          <strong>The thumb&rsquo;s ring is not a shadow.</strong> Its <code>0 0 0 1px</code> layer is a
          hairline drawn as a shadow, a CSS idiom for a ring that costs no layout. Natively it is a{' '}
          <code>borderWidth</code> of 1, and the unringed state needs a transparent border of the same
          width or the layout shifts the moment the ring appears.
        </p>
        <p>
          <strong>The old 2-sigma trap only applies to the legacy path.</strong> If anything ever drops back
          to <code>shadowOffset</code> and <code>shadowRadius</code>, the blur number does not carry: CSS
          blur-radius is two sigma and iOS <code>shadowRadius</code> is sigma, so convert with{' '}
          <code>sigma = r * 0.57735 + 0.5</code>. On the New Architecture it should never come up.
        </p>
      </Trap>
    </Sub>
  </Section>
)
