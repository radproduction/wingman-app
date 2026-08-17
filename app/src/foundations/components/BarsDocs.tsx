import { Icon, IconWhatsapp } from '../../app/icons'
import { Avatar } from '../../app/Avatar'
import { WingGlyph } from '../../onboarding/WingGlyph'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'


const APPBAR_CONTRACT = `// wg/AppHeader.tsx - implement to match.

interface AppHeaderProps {
  unread: number           // > 0 lights the bell's alert dot
}

// Geometry, from the theme:
//   grid 1fr auto 1fr, gap 12; padding 4 / 4 / 8 - the wing mark is
//   optically centred whatever the two sides weigh
//   WhatsApp disc: 38 circle, okTonal ground, brand glyph 24; presence
//   dot 9 in online-green at the top-end corner (1 optical inset),
//   ringed 2 in homeSurface
//   wing mark: 24 tall, the one brand mark (never redrawn)
//   end slot: bell then avatar, gap 12
//   bell: 38 circle on the disc ground, ink glyph 20 - the same quiet
//   disc the back bar uses. Its dot mirrors the presence dot's geometry
//   in the ALERT red: the one hot accent in the bar
//   avatar: 38 circle, the user's photo or drawn portrait
//   press: any disc scales to 0.94 over durationQuick
//
// The dots carry the meaning: green says the channel is live, red says
// something wants you. Nothing else in the bar is allowed a colour that
// competes with them.`

export const AppHeaderDoc = () => (
  <>
    <p className="wgd-lead">
      The tab screens' top bar: the WhatsApp channel on one end, the wing mark in the centre, the bell
      and your own face on the other. Two identity discs carry colour; the bell stays quiet until its
      badge fires - the one hot accent in the bar.
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        <header className="wg-appbar" style={{ width: '100%', maxWidth: 360 }}>
          <button type="button" className="wg-wa" aria-label="Wingman on WhatsApp">
            <IconWhatsapp size={24} />
            <i className="wg-wa__dot" aria-hidden="true" />
          </button>
          <WingGlyph className="wg-brand" />
          <div className="wg-appbar__end">
            <button type="button" className="wg-bell" aria-label="Notifications">
              <Icon name="bell" size={20} />
              <i className="wg-bell__dot" aria-hidden="true" />
            </button>
            <button type="button" className="wg-avatar" aria-label="Your account">
              <Avatar id="you" />
            </button>
          </div>
        </header>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Bar', spec: 'Grid 1fr auto 1fr at gap --space-12, padding 4 / 4 / 8 - the centre mark stays optically centred whatever the sides weigh.' },
          { part: 'WhatsApp disc', spec: '38 circle on --ok-tonal with the brand glyph at 24. The presence dot: 9, --online, top-end corner at a 1 optical inset, ringed 2 in --home-surface.' },
          { part: 'Wing mark', spec: 'The one brand mark, 24 tall - the same WingGlyph the splash and app icons draw, never a redrawing.' },
          { part: 'Bell', spec: '38 circle on the --disc ground with an ink glyph - the same quiet disc the back bar uses, so the app\'s two neutral round buttons are one thing in two places. The unread dot mirrors the presence dot\'s geometry in --alert red.' },
          { part: 'Avatar', spec: '38 circle holding the user\'s photo or drawn portrait. Opens the profile.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Press', rule: 'Each disc scales to 0.94 over the quick duration. No ground change.' },
          { state: 'Unread', rule: 'The bell\'s dot appears only while something is unread; marking the feed read puts it out live.' },
          { state: 'Colour discipline', rule: 'Green means the channel is live, red means something wants you. Nothing else in the bar may compete with the two dots.' },
          { state: 'RTL', rule: 'The channel disc leads and the account trails in the writing direction; both dots ride inset-inline-end.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --ok-tonal, --online, --alert, --disc, --home-surface, --ink, --radius-pill, --space-4/8/12,
        --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/AppHeader.tsx" code={APPBAR_CONTRACT} />
    </DocSection>
  </>
)


const SUBBAR_CONTRACT = `// wg/BackBar.tsx - implement to match.

interface BackBarProps {
  title: string
  action?: ReactNode       // one quiet text action ("Mark all read")
  onBack: () => void       // pops, with a stated fallback route when the
                           // stack has nothing to pop to
}

// Geometry, from the theme:
//   bar: flex, gap 12, padding 4, on the detail layer's white top surface
//   back disc: 38 circle on the disc ground, chevron 20; press scales
//   to 0.94. The chevron flips under RTL.
//   title: 22/400, -0.01em - the screen IS the title; there is no
//   subtitle and no icon slot
//   action: 13.5/500 accentDeep text, quiet until needed; press dims to
//   0.6 opacity
//
// Router note (ASSUMED Expo Router v6, open question 15): render this as
// the stack screen's custom header, headerShown false + own component,
// so the bar is identical on every detail screen and the slide carries
// it with the page. Every route is directly linkable, so onBack must
// handle arriving cold: pop if there is history, replace to the stated
// fallback tab when there is none.`

export const BackBarDoc = () => (
  <>
    <p className="wgd-lead">
      The detail layer's top bar: a quiet back disc, the screen's name at full size, and at most one
      text action. On this layer you are somewhere specific - the only navigation that matters is
      getting back, and the tab bar has stood down.
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        <header className="wg-subbar" style={{ width: '100%', maxWidth: 360 }}>
          <button type="button" className="wg-subbar__back" aria-label="Back">
            <Icon name="chevronLeft" size={20} />
          </button>
          <h1>Notifications</h1>
          <button type="button" className="wg-subbar__act">Mark all read</button>
        </header>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Bar', spec: 'Flex at gap --space-12, padding --space-4, on the detail layer\'s white top surface.' },
          { part: 'Back disc', spec: '38 circle on the --disc ground with a 20 chevron - the same disc as the app header\'s bell. Press scales to 0.94.' },
          { part: 'Title', spec: '22/400, -0.01em tracking, taking the remaining width. The screen is the title; no subtitle, no icon.' },
          { part: 'Action', spec: 'One text action at most: 13.5/500 in --accent-deep, quiet until you need it. Press dims to 0.6.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Back', rule: 'Pops the stack; arriving cold on a directly-linked route, it replaces to the screen\'s stated fallback tab instead. The slide direction comes from history, so the browser\'s own Back animates identically.' },
          { state: 'Fixed furniture', rule: 'On fixed-panel screens the bar never scrolls; the track dissolves under the panel lip beneath it.' },
          { state: 'RTL', rule: 'The chevron points out of the screen in the writing direction; the action trails.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--disc, --ink, --accent-deep, --home-surface, --radius-pill, --space-4/12, --duration-quick, --ease.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Resist the platform header. The native stack's default header brings its own type, its own
        back affordance and its own large-title behaviour, and every one of them is wrong here. This
        bar is an ordinary component at the top of the screen; the navigator's header is disabled.
      </Trap>
      <Contract label="wg/BackBar.tsx" code={SUBBAR_CONTRACT} />
    </DocSection>
  </>
)


const TOPBAR_CONTRACT = `// wg/OnboardingBar.tsx - implement to match.

interface OnboardingBarProps {
  step: number             // 1-based
  steps: number
  onBack?: () => void      // absent on the first step: the disc stays,
                           // disabled at 0.4, so the bar never rearranges
}

// Geometry, from the theme:
//   bar: flex, gap 16; margin 4 above, 24 below
//   back disc: 44 circle (a size up from the app's 38: this flow is
//   walked with less certainty) on the surface ground; press drops the
//   ground to track and scales to 0.96; disabled sits at 0.4 opacity
//   progress: the step-progress track (see Progress), flex-1 beside the
//   disc - one bar per step, filled steps in the accent
//
// The bar is static across steps: only the step content animates. It is
// a progressbar for accessibility (valuenow = step, valuemax = steps).`

export const OnboardingBarDoc = () => (
  <>
    <p className="wgd-lead">
      The onboarding flow's top bar: a 44 back disc and the segmented progress track beside it. It
      holds still while the steps animate past, and the disc never disappears - on the first step it
      just dims, so the bar's shape is constant through the whole flow.
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        <div className="wg-topbar" style={{ width: '100%', maxWidth: 360, margin: 0 }}>
          <button type="button" className="wg-back" aria-label="Back">
            <Icon name="chevronLeft" size={22} />
          </button>
          <div className="wg-track" role="progressbar" aria-valuenow={3} aria-valuemax={7}>
            {Array.from({ length: 7 }, (_, i) => (
              <i key={i} className={i < 3 ? 'on' : ''} />
            ))}
          </div>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Bar', spec: 'Flex at gap --space-16; margin --space-4 above and --space-24 below, inside the flow\'s wider 24 gutter.' },
          { part: 'Back disc', spec: '44 circle on the --surface ground with a 22 chevron - one size up from the app\'s 38 discs. Press: ground drops to --track, scale 0.96. Disabled: 0.4 opacity, in place.' },
          { part: 'Progress', spec: 'The segmented step track (documented under Progress), flex-1: one bar per step, filled steps in the accent.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'First step', rule: 'The disc stays and dims to 0.4 instead of leaving - the bar never rearranges between steps.' },
          { state: 'Static frame', rule: 'The bar and the bottom actions hold still; only the step content between them animates.' },
          { state: 'Accessibility', rule: 'The track is a progressbar: value = current step, max = step count.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--surface, --track, --ink, --accent, --radius-pill, --space-4/16/24, --duration-quick, --ease.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/OnboardingBar.tsx" code={TOPBAR_CONTRACT} />
    </DocSection>
  </>
)
