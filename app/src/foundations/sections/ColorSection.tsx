import { COLOR_GROUPS } from '../data'
import { Copy, Note, Section, Sub, Trap } from '../parts'
import { isUnthemed } from '../resolve'
import { tv } from '../tokenStore'

const Swatch = ({ name }: { name: string }) => {
  const value = tv(name)
  const flat = isUnthemed(value)
  return (
    <div className="wgd-sw">
      <div className="wgd-sw__pair">
        <span className="wgd-sw__chip" style={{ background: value.light }} title={`light ${value.light}`} />
        <span className="wgd-sw__chip wgd-sw__chip--dark" style={{ background: value.dark }} title={`dark ${value.dark}`} />
      </div>
      <div className="wgd-sw__meta">
        <code className="wgd-sw__name">{name}</code>
        <Copy text={name} />
        <span className="wgd-sw__val">{flat ? value.light : `${value.light} / ${value.dark}`}</span>
      </div>
    </div>
  )
}

export const ColorSection = () => (
  <Section
    id="color"
    title="Colour"
    lead={
      <>
        Named by job, not by appearance. <code>--surface</code> is what a card is made of;{' '}
        <code>--on-accent</code> is what a label on an accent fill is made of. That is what makes one dark
        block enough to re-theme the app, and it is the property most worth keeping in a native theme.
      </>
    }
  >
    <Note>
      Every swatch below is read off the running stylesheet in both themes. The left half of each pair is
      light, the right half is dark.
    </Note>

    {COLOR_GROUPS.map((group) => (
      <Sub key={group.id} title={group.title} note={group.note}>
        <div className="wgd-sw-grid">
          {group.tokens.map((name) => (
            <Swatch key={name} name={name} />
          ))}
        </div>
      </Sub>
    ))}

    <Trap>
      Colour is the one family that converts cleanly: every value is a hex or an <code>rgba()</code> string,
      which React Native accepts as-is. Two things to carry across anyway. The tokens under{' '}
      <strong>Deliberately unthemed</strong> hold one value in both themes on purpose and must not be given
      dark values. And <code>color-scheme</code> is a browser hint for form controls with no native
      equivalent and no need for one.
    </Trap>
  </Section>
)
