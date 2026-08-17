import type { CSSProperties } from 'react'
import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const SCREEN_CONTRACT = `// wg/Screen.tsx - implement to match.

interface ScreenProps {
  children: ReactNode      // the top surface content, then a Panel
}

// Geometry, from the theme:
//   a column filling the frame; padding safeTop + 12 / 16 /
//   safeBottom + 16 (react-native-safe-area-context insets, per the
//   platform answers)
//   the ground is the warm canvas; the white top area and the cool panel
//   below it are the two-surface anatomy every screen shares
//
// Enter motion (motion.named.enter): a TAB arrives with a rise-and-fade -
// opacity 0 -> 1, translateY distanceMedium -> 0, over durationFast with
// easeSmoothOut. Tabs are siblings, not levels; a screen arriving by PUSH
// suppresses this entirely - the slide is the arrival, it does not also
// rise. (See Screen transition.)
//
// The onboarding flow variant: no enter animation (the step content
// animates, the frame holds still) and a wider 24 side gutter.
//
// Reduced motion (either layer): no rise, just appear.`

const PANEL_CONTRACT = `// wg/Panel.tsx - implement to match.

interface PanelProps {
  children: ReactNode      // rows, in a 16-gap column
  footer?: ReactNode       // pinned outside the scroll, above the home
                           // indicator (a form's Save)
}

// Geometry, from the theme:
//   surface: panel fill, radius xl on the TOP corners only, full-bleed to
//   the screen edges (the scaffold's 16 gutter belongs to the track inside)
//   track: the scrolling child; padding fadeTop(16) / 16 / trackFoot,
//   rows at gap 16
//   trackFoot: whatever clears the floating tab bar (tab screens), or the
//   home indicator (detail screens - no tab bar there)
//
// The dissolves are the panel's signature and they MUST cross:
//   top: rows fade out into the panel tint over fadeTop (16), weighted
//   early (18% opaque at 0.4h, 72% at 0.75h) so dark text loses
//   legibility before the edge; plus an opaque-to-transparent lip drawn
//   over the track's top padding
//   foot: a longer 36 fade so a row clears the floating tab bar as it
//   leaves. Longer than the top ON PURPOSE - do not symmetrise.
// Natively: MaskedView (react-native-masked-view) with a LinearGradient
// mask over the ScrollView, or a pair of gradient overlays in the panel
// colour. The web deliberately uses a masked gradient, NOT backdrop blur
// (a blur clips against the rounded corners); do not "upgrade" it to
// BlurView.
//
// On the cool panel the tonal fills re-point: cardTonal -> cardTonalCool,
// track -> trackCool. Natively that is a themed subtree, not a per-
// component override.
//
// Two scroll modes, decided per screen: Home and Calendar scroll as whole
// pages; Email, Tasks, More and the entire detail layer fix the panel and
// scroll the track inside it, so the top bar is furniture and content
// dissolves under the lip.`

const DemoRow = ({ icon, tone, name, meta }: { icon: string; tone: string; name: string; meta: string }) => (
  <div className="wg-mrow wg-card-line">
    <span className={`wg-chip ${tone} sm`}>
      <Icon name={icon as 'bell'} size={19} variant="duotone" />
    </span>
    <span className="wg-mrow__tx">
      <span className="wg-mrow__top">
        <span className="wg-mrow__name">{name}</span>
      </span>
      <span className="wg-mrow__meta">{meta}</span>
    </span>
  </div>
)

const shellVars = {
  '--wm-safe-top': '12px',
  '--wm-safe-bottom': '0px',
  '--tabbar-clearance': '16px',
} as CSSProperties

export const ScreenScaffoldDoc = () => (
  <>
    <p className="wgd-lead">
      The frame every screen fills: a column on the warm canvas, safe areas absorbed at both ends, the
      white top surface above and the cool panel below. Tabs arrive with a rise-and-fade; a pushed
      screen arrives by sliding, and never does both.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div
          className="wg-screen"
          style={{ ...shellVars, minHeight: 0, height: 380, width: '100%', maxWidth: 340, background: 'var(--canvas)', borderRadius: 24, overflow: 'hidden' }}
        >
          <div style={{ padding: 'var(--space-8) var(--space-4) var(--space-12)', fontSize: 22, letterSpacing: '-0.01em' }}>Tasks</div>
          <section className="wg-panel" style={{ marginInline: 0, marginBottom: 0 }}>
            <DemoRow icon="check" tone="mint" name="The white surface above" meta="Title, header, the screen's own furniture" />
            <DemoRow icon="task" tone="blue" name="The cool panel below" meta="Where the content lives" />
          </section>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Frame', spec: 'A flex column filling the viewport. Padding: safe-top + --space-12 above, --space-16 at the sides, safe-bottom + --space-16 below.' },
          { part: 'Top surface', spec: 'The canvas (or home-surface on the detail layer): the app header or back bar, and any furniture that stays put.' },
          { part: 'Panel', spec: 'The cool grey surface (the next page), full-bleed, taking the rest of the height.' },
          { part: 'Flow variant', spec: 'Onboarding steps: no enter animation (the step content animates instead) and a roomier --space-24 side gutter.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Tab enter', rule: 'Rise-and-fade: opacity 0 to 1 and --distance-medium of travel over --duration-fast with --ease-smooth-out. Tabs are siblings, not levels.' },
          { state: 'Pushed enter', rule: 'Suppressed entirely while the stack is sliding - the push is the arrival, the screen does not also rise. The suppression lasts until the next navigation, so a settled screen never replays it.' },
          { state: 'Keyboard', rule: 'The frame never collapses for the soft keyboard; action bars lift by exactly what it covers (--wm-kb).' },
          { state: 'Reduced motion', rule: 'Either layer (OS setting or the in-app toggle): the rise is dropped, the screen just appears.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --canvas, --home-surface, --wm-safe-top/bottom, --space-12/16/24, --duration-fast,
        --ease-smooth-out, --distance-medium.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The web's <code>min-height: 100dvh</code> and the height-authority overrides inside the desktop
        frame are browser plumbing and do not cross - natively the screen is simply a flex-1 View under
        the navigator, with insets from <code>react-native-safe-area-context</code>. What DOES cross is
        the rule pair: tabs rise, pushes slide, never both.
      </Trap>
      <Contract label="wg/Screen.tsx" code={SCREEN_CONTRACT} />
    </DocSection>
  </>
)

export const PanelDoc = () => (
  <>
    <p className="wgd-lead">
      The cool grey surface the content lives on, full-bleed with rounded top shoulders. On most
      screens the panel is fixed furniture and a track scrolls inside it, so rows dissolve under the
      panel's own lip at the top and fade out again before the floating tab bar - scroll the specimen.
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        <div className="wg-sub" style={{ ...shellVars, display: 'flex', flexDirection: 'column', height: 400, width: '100%', maxWidth: 340, borderRadius: 20, overflow: 'hidden' }}>
          <header className="wg-subbar">
            <span className="wg-subbar__back" aria-hidden="true">
              <Icon name="chevronLeft" size={20} />
            </span>
            <h1>Bills</h1>
          </header>
          <section className="wg-panel" style={{ marginInline: 0, marginBottom: 0 }}>
            <div className="wg-panel__scroll">
              <DemoRow icon="receipt" tone="sand" name="Electricity" meta="Due Friday" />
              <DemoRow icon="receipt" tone="blue" name="Internet" meta="Paid Monday" />
              <DemoRow icon="receipt" tone="peach" name="Water" meta="Due next week" />
              <DemoRow icon="receipt" tone="mint" name="Car insurance" meta="Renews in March" />
              <DemoRow icon="receipt" tone="lavender" name="Phone" meta="Autopay is on" />
              <DemoRow icon="receipt" tone="rose" name="Gym" meta="Cancelled last month" />
              <DemoRow icon="receipt" tone="sand" name="Streaming" meta="Shared with family" />
            </div>
          </section>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Surface', spec: '--panel fill, --radius-xl on the top corners only, bled to the screen edges (the scaffold\'s side gutter belongs to the track inside).' },
          { part: 'Track', spec: 'The scrolling child: padding --fade-top (16) above, --space-16 at the sides, --track-foot below; rows in a --space-16 gap column.' },
          { part: 'Lip', spec: 'A gradient of the panel\'s own colour over the track\'s top padding: opaque at the edge, gone by the first row. A masked gradient, deliberately not a backdrop blur - a blur clips on the rounded corners.' },
          { part: 'Dissolves', spec: 'The track\'s mask: rows fade over --fade-top (16) at the top, weighted early so text loses legibility before the edge, and over --fade-foot (36) at the bottom - longer on purpose, so a row clears the floating tab bar as it leaves.' },
          { part: 'Footer', spec: 'A detail screen\'s pinned actions (wg-sub__foot) render outside the track, above the home indicator, so Save never scrolls away and never sits in the foot dissolve.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Two scroll modes', rule: 'Home and Calendar scroll as whole pages. Email, Tasks, More and the entire detail layer fix the panel and scroll the track inside, so the top bar is fixed furniture.' },
          { state: 'Cool re-pointing', rule: 'On the panel and the detail layer the tonal fills follow the cool surface: --card-tonal becomes --card-tonal-cool, --track becomes --track-cool. Components never know; the surface decides.' },
          { state: 'Clearance', rule: 'Tab screens reserve --tabbar-clearance at the track\'s foot; the detail layer has no tab bar and reserves only the home indicator plus the dissolve.' },
          { state: 'Scroll containment', rule: 'Overscroll never chains out of the track to the shell.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --panel, --panel-inner, --radius-xl, --space-16, --fade-top (16), --fade-foot (36),
        --track-side, --track-foot, --tabbar-clearance, --card-tonal-cool, --track-cool.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The dissolve mask is the part a port loses first: it needs <code>MaskedView</code> with a
        gradient mask over the ScrollView (or gradient overlays in the panel colour), and the top and
        foot lengths are different on purpose - 16 in, 36 out. Symmetrising them, or swapping the
        masked gradient for a blur, changes the app's whole scrolling feel.
      </Trap>
      <Contract label="wg/Panel.tsx" code={PANEL_CONTRACT} />
    </DocSection>
  </>
)
