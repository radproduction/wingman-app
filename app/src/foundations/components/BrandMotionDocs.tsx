import { useId, useState, type CSSProperties } from 'react'
import { HeaderBrand } from '../../app/HeaderBrand'
import { WING_PATHS } from '../../onboarding/WingGlyph'
import { WORDMARK_PATHS } from '../../splash/wordmark'
import '../../splash/splash.css'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const STAR = WING_PATHS[0]
const W = WING_PATHS[1]

const SPLASH_CONTRACT = `// Splash choreography - reproduce from assets/brand.ts (SPLASH,
// WING_*, WORDMARK_PATHS, BRAND_GRADIENT). Times in ms.

// The lockup (2125 x 526): the wing mark IS the W; the wordmark letters
// spell "INGMAN" after it. Logo width min(64vw, 340). Ground is the
// homeSurface token - the same colour the native splash screen and the
// status bar are tinted from, so first paint and the splash are one
// colour in both themes.

// The beats (every one an animation OFF the finished lockup - the
// resting state is the END of the sequence):
//   0ms     the W traces itself: stroke width 7, round caps, dash over
//           a normalised path length (pathLength 1 -> dashoffset 1 to 0),
//           1050ms ease-in-out
//   330ms   the gradient fill rises under the trace, 750ms
//   1000ms  the trace hands off: fades out over 500ms (the same fade,
//           reversed)
//   1100ms  the star lands: rotate -200deg -> 0, scale 0.18 -> 1,
//           pivoting on itself, 500ms cubic-bezier(0.34, 1.36, 0.64, 1)
//           (a real overshoot), fading in over the first 250ms
//   1500ms  mark and word settle: both travel from +687 user units
//           (trailing side) to rest over 750ms cubic-bezier(0.22,1,0.36,1)
//           while the word fades up over 600ms - the lockup assembles as
//           ONE object, not two things meeting
//   exit    on the word's animation end: the whole splash fades over
//           350ms; a 4000ms backstop fires the exit if the end never
//           arrives
//
// Reduced motion (either layer): NO sequence - show the finished lockup,
// hold 900ms, exit. The finished state needs no re-description because
// it is the resting style; only the trace is hidden (drawn, it doubles
// the fill).
//
// The word's ink is the theme's ink token; the mark's gradient is the
// artwork's own and never re-themes ([D-024]).`

const PULL_CONTRACT = `// Pull-to-refresh - mechanism vs indicator.
//
// THE MECHANISM DOES NOT CROSS. The growing spacer, the resistance
// curve, the touch bookkeeping - natively that is RefreshControl (or a
// Reanimated scroll-driven header if the branded indicator below is
// wanted). Numbers, from assets/brand.ts PULL:
//   resist 0.6      finger px -> gap px (elastic lag)
//   maxPull 170     the gap's ceiling
//   trigger 96      release past this arms a refresh; progress = gap/96
//   held 56         where the gap parks while refreshing
//   settle          350ms smooth-out back home; idle after 450ms
//
// THE INDICATOR CROSSES if you build the branded version: the header's
// W+Star mark, in three paints, scrubbed 1:1 off pull progress p (0..1)
// and gap px d - NO transitions during the drag:
//   W fill:   opacity 1 - p * 5 (gone by 20% of the pull)
//   W trace:  opacity p * 5; dashoffset p over a normalised path
//             (0 drawn -> 1 gone) - the splash's self-drawing W,
//             reversed and finger-driven. Stroke width 24 at mark size.
//   star:     a wrapper walks it to the mark's centre (-320 user units),
//             rides it down by d * 18 user units into the opened gap,
//             turns it 2deg per px of pull, grows it to 1 + p * 3.4;
//             the star itself spins 360deg / 900ms linear while
//             refreshing - so the settle just STOPS the spin, no unwind,
//             while the wrapper eases home over 350ms and the W redraws
//             in place, then re-fills.
//
// Default recommendation: plain RefreshControl tinted to the accent, and
// keep this spec for the day the brand moment is worth the custom
// header. Do not half-build it - a mark that fades without the star
// choreography reads as broken, not branded.`


const SplashDemo = () => {
  const [run, setRun] = useState(0)
  const gradW = useId()
  const gradStar = useId()
  return (
    <>
      <div className="wgd-playbar">
        <button type="button" className="wgd-play" onClick={() => setRun((n) => n + 1)}>
          replay
        </button>
      </div>
      <Stage ground="panel">
        <div
          style={{
            position: 'relative',
            isolation: 'isolate',
            width: '100%',
            maxWidth: 380,
            height: 180,
            borderRadius: 16,
            overflow: 'hidden',
          }}
        >
          <div className="splash" key={run}>
            <svg className="splash-logo" viewBox="0 0 2125 526" style={{ width: 'min(64%, 300px)' }}>
              <defs>
                <linearGradient id={gradW} x1="94.6659" y1="-87.9091" x2="702.186" y2="521.28" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D2A7C1" />
                  <stop offset="1" stopColor="#5384E5" />
                </linearGradient>
                <linearGradient id={gradStar} x1="176.974" y1="-260.166" x2="869.579" y2="434.342" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#D2A7C1" />
                  <stop offset="1" stopColor="#5384E5" />
                </linearGradient>
              </defs>
              <g className="wg-splash__mark">
                <path className="wg-splash__wfill" d={W} fill={`url(#${gradW})`} />
                <path
                  className="wg-splash__wtrace"
                  d={W}
                  fill="none"
                  stroke={`url(#${gradW})`}
                  strokeWidth={7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  pathLength={1}
                />
                <path className="wg-splash__star" d={STAR} fill={`url(#${gradStar})`} />
              </g>
              <g className="wg-splash__wordmark">
                {WORDMARK_PATHS.map((d, i) => (
                  <path key={i} d={d} />
                ))}
              </g>
            </svg>
          </div>
        </div>
      </Stage>
    </>
  )
}


const PullCell = ({ label, state, pull, dist }: { label: string; state?: string; pull?: number; dist?: number }) => (
  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 'var(--space-8)' }}>
    <div
      data-pull-state={state}
      style={
        {
          height: 130,
          borderRadius: 14,
          background: 'var(--canvas)',
          padding: 'var(--space-12) var(--space-16)',
          overflow: 'hidden',
          '--wg-pull': pull ?? 0,
          '--wg-pull-dist': `${dist ?? 0}px`,
        } as CSSProperties
      }
    >
      <HeaderBrand />
    </div>
    <span style={{ fontSize: 12.5, color: 'var(--muted)', textAlign: 'center' }}>{label}</span>
  </div>
)

const PullDemo = () => (
  <Stage ground="home">
    <div style={{ display: 'flex', gap: 'var(--space-12)', width: '100%', maxWidth: 460 }}>
      <PullCell label="At rest" />
      <PullCell label="Mid-pull" state="pulling" pull={0.55} dist={53} />
      <PullCell label="Refreshing" state="refreshing" pull={1} dist={56} />
    </div>
  </Stage>
)

export const SplashDoc = () => (
  <>
    <p className="wgd-lead">
      The launch splash: the Wingman lockup drawing itself. The W traces in, its gradient rises under
      the trace, the star swings home with a real overshoot, then mark and word travel together into
      the finished lockup - and every beat is an animation off that finished state, which is what
      makes reduced motion free.
    </p>

    <DocSection title="Specimen">
      <SplashDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Ground', spec: 'The home-surface token - the same colour the pre-paint script (natively: the splash screen and status bar) already put on screen, so first paint and the splash are one colour in both themes.' },
          { part: 'Lockup', spec: 'The 2125 x 526 box at min(64vw, 340) wide: the wing mark, then the "INGMAN" wordmark - the glyph is the W.' },
          { part: 'The mark, in three paints', spec: 'The W\'s gradient fill (the rest look), the trace stroke that draws it in over the top (width 7, round caps, normalised path length), and the star above both.' },
          { part: 'Paint', spec: 'The mark\'s gradient is the artwork\'s own (#D2A7C1 to #5384E5, userSpaceOnUse) and never re-themes; the wordmark\'s ink is the theme token, reached by cascade ([D-024]).' },
          { part: 'Assets', spec: 'Everything here ships in the kit: assets/brand.ts carries the paths, boxes, gradient vectors and every beat\'s numbers as data.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'The beats', rule: 'Trace 1050ms from t0; fill rises 750ms at 330ms; trace hands off over 500ms at 1000ms; star lands at 1100ms (rotate -200deg, scale 0.18 to 1, 500ms with overshoot); mark and word settle together from +687 user units at 1500ms over 750ms.' },
          { state: 'Exit', rule: 'On the word\'s arrival the whole splash fades over 350ms. A 4000ms backstop leaves anyway if that end never fires - the splash may never strand the app.' },
          { state: 'Reduced motion', rule: 'No sequence: the finished lockup shows at once, holds 900ms, exits. Nothing needs re-describing because the finished state IS the resting style; only the trace is hidden.' },
          { state: 'One geometry', rule: 'The splash draws the same WING_PATHS as the header mark, the app icons and the pull indicator - it is the one brand mark, never a copy.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --ink, --duration-medium, --ease-smooth-out, and the --splash-* set (draw,
        fill, trace-out, star, settle, word timings with their delays, shift, the three eases) - all
        shipped as data in the kit's assets/brand.ts.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Split the native splash in two, like the web: the OS splash screen (expo-splash-screen) shows
        the STATIC finished lockup on the home-surface colour, and this choreography runs as the
        app's first screen only when motion is allowed - launching straight into a 2.3s animation the
        user cannot skip is the failure mode. The trace needs react-native-svg's dash props over a
        normalised path length, exactly like the task check.
      </Trap>
      <Contract label="splash choreography" code={SPLASH_CONTRACT} />
    </DocSection>
  </>
)

export const PullToRefreshDoc = () => (
  <>
    <p className="wgd-lead">
      Pull-to-refresh, split honestly in two: the gesture mechanism (a growing spacer on the web -
      natively RefreshControl territory), and the branded indicator that can cross - the header's
      W+Star mark un-drawing itself while its star rides down into the gap, grows, and spins while
      the refresh runs.
    </p>

    <DocSection title="Specimen">
      <Note>The indicator frozen at three points of the gesture; the real thing scrubs 1:1 with the finger.</Note>
      <PullDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'The gap', spec: 'A flex spacer between header and panel whose height is the pull distance; Home slides its track and surface instead. Resistance 0.6, capped at 170; release past 96 arms the refresh; the gap parks at 56 while it runs.' },
          { part: 'The indicator', spec: 'The header mark in three paints: the W\'s solid fill, the W as a trace stroke (width 24, normalised path length), and the star in its own wrapper so travel and spin never fight.' },
          { part: 'W', spec: 'The fill fades at 5x pull progress (gone by 20% of the pull); the trace fades in at the same rate and un-draws as its dash offset runs 0 to 1 - the splash\'s self-drawing W, reversed and finger-driven.' },
          { part: 'Star', spec: 'The wrapper walks it to the mark\'s centre (-320 user units), rides it down by 18 user units per gap px, turns it 2deg per px, and grows it to 1 + progress x 3.4. Refreshing, the star itself spins 360deg every 900ms, linear.' },
          { part: 'Settle', spec: 'The wrapper eases home over 350ms smooth-out while the spin simply stops (no unwind); the W redraws in place, then re-fills. Idle at 450ms clears the state-scoped transitions.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'During the drag', rule: 'Everything scrubs the finger 1:1 - no transitions run, deliberately, and on the web the reduced-motion clamp is explicitly out-argued for the drag\'s length.' },
          { state: 'Armed vs not', rule: 'Release past the 96 trigger parks the gap and spins the star; short of it, everything springs home and nothing fires.' },
          { state: 'Reduced motion', rule: 'The scrub is a finger and stays; the spin is replaced by the star simply holding, and the settle places.' },
          { state: 'Web only', rule: 'The spacer mechanism, the resistance bookkeeping and the state machine are browser workarounds - the roster files this entry under does-not-cross for exactly that reason. The indicator spec above is the part worth carrying.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --wg-pull, --wg-pull-dist and data-pull-state (written by the gesture), --star-centre-x,
        --star-grow, --star-drop, --star-turn, --brand-spin-dur, --duration-medium, --ease-smooth-out,
        --ease-linear - the numbers ship as data in the kit's assets/brand.ts (PULL).
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Default to RefreshControl tinted to the accent - the mechanism is the platform's. Build the
        branded indicator only as a whole: a custom scroll-driven header (Reanimated scroll offset
        standing in for --wg-pull) drawing the kit's WING_STAR and WING_W. A mark that fades without
        the star's travel-grow-spin reads as broken, not branded - do not half-build it.
      </Trap>
      <Contract label="pull-to-refresh spec" code={PULL_CONTRACT} />
    </DocSection>
  </>
)
