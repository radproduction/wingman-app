import { CHIP_ICON_TOKENS, CHIP_TOKENS, RADIUS_TOKENS, ROW_TOKENS, SPACING_TOKENS } from '../data'
import { Copy, Note, Section, Sub, TokenTable, Trap } from '../parts'
import { pxOf } from '../resolve'
import { tv } from '../tokenStore'

const RADIUS_USE: Record<string, string> = {
  '--radius-none': 'full bleed',
  '--radius-xs': 'the smallest inner shape',
  '--radius-sm': 'small inner shapes',
  '--radius-md': 'inner shapes',
  '--radius-lg': 'cards',
  '--radius-xl': 'content containers, sheet tops',
  '--radius-pill': 'actions and inputs',
}

const CHIP_USE: Record<string, string> = {
  '--chip-xs': 'dense rows: business, settings, memory',
  '--chip-sm': 'the workhorse: list rows, cards, feed chips',
  '--chip-md': 'feature lead: article, empty, hub',
  '--chip-lg': 'screen and widget hero',
}

export const ScaleSection = () => (
  <Section
    id="scale"
    title="Spacing, shape and size"
    lead="Three closed scales. Every padding, margin, gap, radius and chip in the app resolves to a step on one of them, and there are no off-scale values anywhere."
  >
    <Sub
      title="Spacing"
      note="Eight steps. Snap to the nearest; ties round up, because roomier is the house style. The panel column runs on one 16 rhythm: side gutter, top inset, row gap, and the gap above a section head."
    >
      <div className="wgd-bars">
        {SPACING_TOKENS.map((name) => {
          const px = pxOf(tv(name).light)
          return (
            <div className="wgd-bar" key={name}>
              <code className="wgd-bar__name">{name}</code>
              <span className="wgd-bar__fill" style={{ width: px ?? 0 }} />
              <span className="wgd-bar__val">{tv(name).light}</span>
              <Copy text={name} />
            </div>
          )
        })}
      </div>
      <Note>
        Two carve-outs from &ldquo;no exceptions&rdquo;, both deliberate: absolute-positioned optical glyph
        offsets stay pixel-precise, and the tab bar&rsquo;s responsive geometry is out of scope.
      </Note>
    </Sub>

    <Sub title="Radius" note="Seven semantic rungs, each with a job.">
      <div className="wgd-shapes">
        {RADIUS_TOKENS.map((name) => (
          <div className="wgd-shape" key={name}>
            <span className="wgd-shape__box" style={{ borderRadius: `var(${name})` }} />
            <code>{name}</code>
            <span className="wgd-shape__val">{tv(name).light}</span>
            <span className="wgd-shape__use">{RADIUS_USE[name]}</span>
          </div>
        ))}
      </div>
      <Trap>
        Two shapes in the app are <strong>ratios, not radii</strong>, and sit outside the scale on purpose:
        circles are 50% and the icon tiles are 22%. React Native does not accept a percentage{' '}
        <code>borderRadius</code>, so both become a value computed from the rendered size, never a hardcoded
        number. Hardcode it and the shape breaks the moment the chip rung changes.
      </Trap>
    </Sub>

    <Sub
      title="Chip size"
      note="Four rungs, each pairing a diameter with an inner icon size. There is no fifth diameter and no raw-px chip anywhere in the app. Compact density folds the small rung down to extra small, which is why a component asks for the rung and never for the number."
    >
      <div className="wgd-chips">
        {CHIP_TOKENS.map((name, i) => {
          const size = pxOf(tv(name).light) ?? 0
          const icon = pxOf(tv(CHIP_ICON_TOKENS[i]).light) ?? 0
          return (
            <div className="wgd-chipspec" key={name}>
              <span className="wgd-chipspec__disc" style={{ width: size, height: size }}>
                <span className="wgd-chipspec__glyph" style={{ width: icon, height: icon }} />
              </span>
              <code>{name}</code>
              <span className="wgd-shape__val">
                {size} / icon {icon}
              </span>
              <span className="wgd-shape__use">{CHIP_USE[name]}</span>
            </div>
          )
        })}
      </div>
    </Sub>

    <Sub
      title="List rhythm"
      note="Every feed row across Email, Tasks, Notifications, the modules and the connector list is built from the same five numbers, so density is one decision rather than thirty. Side padding stays out of it on purpose: the chip column and the settings-row separator are measured off it."
    >
      <TokenTable tokens={ROW_TOKENS} />
    </Sub>
  </Section>
)
