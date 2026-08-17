import { Icon, IconSpark, IconWhatsapp } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// wg/ModuleHero.tsx (+ the module screen scaffold) - implement to match.

interface ModuleHeroProps {
  value: string            // "2 due this week" - the tile's value, grown up
  sub: string              // the evidence line
  icon: IconName
  tone: ChipTone
  brief?: string           // Wingman's one-line read, under the hero
  ask?: { thing: string; onAsk: () => void }   // the WhatsApp handoff
}

// Geometry, from the theme:
//   hero: homeSurface, radius lg, hairline, padding 16, gap 16 - the
//   value (26/400, -0.015em) and its 13.5 muted sub on the start side,
//   the module's lg chip on the end. NO title: the back bar carries it.
//   brief line: the spark + one sentence, under the hero.
//   ask: the full-width WhatsApp Button (wg-btn full wa), at the foot -
//   the FAB stands down on this layer, so each module carries its own
//   handoff. The app shows the state; WhatsApp is where you act.
//
// The hero must read as the tapped Bento tile EXPANDING: same chip, same
// words, one size up. Build hero and tile from the same data object so
// they cannot drift.
//
// One audit note, resolved: wg-mod is ONE component. The extra rules in
// business.css and mobility.css are context styles scoped under the
// module screen's class, not second definitions.`

const HeroDemo = () => (
  <Stage ground="home">
    <div style={{ width: '100%', maxWidth: 360, display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
      <div className="wg-mod__hero wg-card-line">
        <span className="wg-mod__tx">
          <span className="wg-mod__val">2 due this week</span>
          <span className="wg-mod__sub">Electricity is higher than usual</span>
        </span>
        <span className="wg-chip sand lg">
          <Icon name="receipt" size={24} variant="duotone" />
        </span>
      </div>
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>Both bills are covered by Friday's salary. Nothing needs to move.</span>
      </div>
      <button type="button" className="wg-btn full wa">
        <IconWhatsapp size={18} /> Ask Wingman about your bills
      </button>
    </div>
  </Stage>
)

export const ModuleHeroDoc = () => (
  <>
    <p className="wgd-lead">
      The tapped Home tile, restated as the module screen's opening card: the value at full size, the
      evidence under it, the module's chip grown to the lg rung - and no title, because the back bar
      already says where you are. Under it, Wingman's one-line read; at the foot, the WhatsApp handoff.
    </p>

    <DocSection title="Specimen">
      <HeroDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Hero card', spec: 'Home-surface, radius lg, hairline, padding --space-16, gap --space-16. Value and sub on the start side, the module\'s lg chip on the end.' },
          { part: 'Value', spec: '26/400 / 1.15, -0.015em - the tile\'s value one size up. No title: the back bar carries it, and repeating it would say the same word twice on one screen.' },
          { part: 'Sub', spec: '13.5 muted, --space-4 below: the evidence line, unchanged from the tile.' },
          { part: 'Brief line', spec: 'The spark and one sentence of Wingman\'s read, under the hero - quieter than the assistant summary, one line, never a paragraph.' },
          { part: 'Ask', spec: 'The full-width WhatsApp Button (wg-btn full wa) at the screen\'s foot. The FAB stands down on the detail layer, so every module carries its own handoff.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'The zoom', rule: 'Hero and Bento tile are the same object at two sizes - same chip, same words. Built from the same data, they cannot drift; the push reads as the tile expanding.' },
          { state: 'Unset module', rule: 'A module with nothing behind it yet carries its own closing state instead of the ask button (Health, before connecting).' },
          { state: 'Not pressable', rule: 'The hero states; the rows below carry the items and the ask button carries the action.' },
          { state: 'One anatomy, five screens', rule: 'Bills, Deliveries, Travel, People and Health all open with this exact block; only the content changes. The extra wg-mod rules in the area stylesheets are context styles, not variants - one component.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --radius-lg, --space-4/8/12/16, --chip-lg, the
        module's chip tone pair, plus the Button's wa tokens (--ok-tonal family).
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The hero is the roster's most-drawn pattern (23 files) because the module screens are the
        app's repeating shape - build the module screen as one scaffold taking hero data, rows and
        the ask, not five screens that each hand-assemble it. That is also what keeps the
        tile-to-hero zoom honest.
      </Trap>
      <Contract label="wg/ModuleHero.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
