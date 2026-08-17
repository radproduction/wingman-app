import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// theme.palette.*.cardLine - a TREATMENT, not a component.
//
// The rule: a white card or row sitting on the panel ground gets a 1-width
// border of cardLine, so its edge reads against the low-contrast surface -
// a soft line in light, a faint lift on charcoal in dark.
//
// Only the stroke is shared. Fill, radius and padding stay on each card,
// because they vary (homeSurface vs surface read differently in dark; radius
// is lg or xl by card). Receded states - settled, read, past - opt out, so
// the stroke never doubles an outline they already carry.
//
// DO NOT build a <Card> wrapper. The app has a card treatment worn by forty
// different blocks, not a card component everything nests inside - the audit
// (docs/component-inventory.md) calls this the fastest way for a native build
// to drift. Spread a cardStyle constant; do not invent a component boundary
// the design does not have.`

export const CardLineDoc = () => (
  <>
    <p className="wgd-lead">
      The one sanctioned line in a system that separates by tone: a hairline around a white card sitting
      on the panel, added at the call site next to the card's own class. Forty-plus blocks wear it; none
      of them is a Card component.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          <div className="wg-card-line" style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-16)', width: 200 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>With the hairline</p>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>The edge reads on the panel.</p>
          </div>
          <div style={{ background: 'var(--surface)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-16)', width: 200 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 500 }}>Without it</p>
            <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--muted)' }}>The card dissolves into the ground.</p>
          </div>
        </div>
      </Stage>
      <Note>Flip the theme with the cord: in dark the same token turns from a soft line into a faint lift.</Note>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Stroke', spec: '1 solid --card-line. That is the whole treatment.' },
          { part: 'What stays per card', spec: 'Fill (--home-surface or --surface), radius (lg or xl), padding - they vary by card and never move into the utility.' },
          { part: 'Opt-outs', spec: 'Receded states (settled, read, past) skip it, so the stroke never doubles an outline they already carry.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'When', rule: 'A white card or row on the --panel ground. A card on --home-surface (the white top surface) does not need an edge.' },
          { state: 'Never', rule: 'Not a divider, not a section rule, not a second border weight. One line, one job.' },
        ]}
      />
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The audit's sharpest finding lives here: the app has a card <em>treatment</em>, not a Card{' '}
        <em>component</em>. A native <code>&lt;Card&gt;</code> wrapper invents a boundary the design does
        not have, and every screen built through it drifts a little. Ship a style constant, spread it.
      </Trap>
      <Contract label="theme: cardLine" code={CONTRACT} />
    </DocSection>
  </>
)
