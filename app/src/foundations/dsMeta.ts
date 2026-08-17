
export const DS_VERSION = '0.1.6'

export type ChangelogEntry = {
  version: string
  date: string
  items: readonly string[]
}

export const DS_CHANGELOG: readonly ChangelogEntry[] = [
  {
    version: '0.1.6',
    date: '16 August 2026',
    items: [
      'Brand motion assets, on developer request: the kit now ships assets/brand.ts - the W+Star mark, the wordmark and the gradient as path data, plus every splash beat and pull-to-refresh number as data. Generated from the app\'s own sources, so it cannot drift.',
      'Launch splash documented as a component page with the live choreography: the self-tracing W, the gradient handoff, the star\'s overshoot landing, the settle - and the rule that reduced motion shows the finished lockup because every beat is an animation off the resting state.',
      'Pull-to-refresh documented honestly in two halves: the spacer mechanism stays web-only (RefreshControl natively), while the branded indicator - the W un-drawing as its star rides into the gap, grows and spins - crosses as a complete spec with a do-not-half-build warning.',
      'The Splash joins the roster\'s shell tier; the pull entry keeps its does-not-cross tier with the indicator contract layered on top.',
    ],
  },
  {
    version: '0.1.5',
    date: '16 August 2026',
    items: [
      'Wave 5: the screen patterns - the roster\'s last tier. Twenty pages; every roster entry except Chat Bubble (still a decision) is now documented.',
      'The dashboard pair: Widget cell (the three rungs, the dense backfill a flex port silently loses) and Widget row (the two-line clamp, the slack-sharing rule, the in-place tick).',
      'Home\'s three cards: Today\'s Snapshot (the sixteen-tick meter and the 24s ambient sun, both deliberately off the motion scale), the Metric pills (the two-tone fill, the mixed-script unit rule), and the Insight card.',
      'Calendar: the Week strip and month grid documented as ONE cell in two layouts, and the Event card with its time gutter, past/next dressing and prep footer.',
      'The feed rows: Task row (the measured-path check draw, reversible mid-draw) and Mail row (the alert-red unread dot, the ready and did tags).',
      'Approval card - the whole authority model on one page: the inline pill that recedes into a status line, the state strip with the one in-flight pulse, the facts that make approving never a leap of faith.',
      'Module hero - and the audit\'s wg-mod question resolved: one component; the extra rules in the area sheets are context styles, not second definitions.',
      'Connector, Memory and Meeting rows - the brand disc rule, the provenance line, the shared status vocabulary.',
      'Trip card, Sparkline, Timeline (the per-item rail that virtualises), Story row.',
      'The appearance pickers: Theme (three drawn phones, the ring that stands off the frame) and App icon (the tile IS the icon; native alternate-icon ceremony flagged).',
      'With this wave the component documentation phase is complete: 67 pages, five tiers, one open decision (Chat Bubble).',
    ],
  },
  {
    version: '0.1.4',
    date: '16 August 2026',
    items: [
      'Wave 4: shell, navigation and overlay - the frame the components live in. Twelve pages, completing the tier.',
      'Screen scaffold and Scroll panel - the two-surface anatomy, the two scroll modes, and the panel\'s lip and dissolve mask with its deliberately asymmetric 16-in / 36-out lengths.',
      'The three top bars on one file each way: App header (the two identity discs and the one hot accent), Detail back bar (with the resist-the-platform-header trap), Onboarding top bar (the 44 disc that dims instead of leaving).',
      'Tab bar - the frosted capsule, the glass recipe, the sliding chip\'s signed travel, the stand-down in lockstep with the page slide, and the no-blur fallbacks.',
      'Bottom sheet - the enter transition and the velocity-seeded spring exit ([D-032]) stated as the contract: no close duration exists, and a port must not invent one.',
      'Sheet action list - the three tiers (primary, quiet, warn) and order-is-meaning.',
      'Toast - the module-function shape, the one inverted surface, and the 350-in / 250-out asymmetry.',
      'Bottom action bar - row, stack and intro arrangements, and the lift-the-bar-not-the-screen keyboard rule.',
      'Screen transition - documented as a motion contract with a live push/pop demo: the numbers cross (250ms, the ease, 25% parallax, 3px blur, signed RTL distances), the slot-layer machinery does not.',
      'Not-connected screen - the truthful line, the height-sized artwork, and the fill-in idle loop that must never read as loading.',
      'The docs surface now loads the shell stylesheet too, so the shell specimens - including the live slide demo - run on the real keyframes and shell tokens.',
    ],
  },
  {
    version: '0.1.3',
    date: '16 August 2026',
    items: [
      'Wave 3: the composites between the atoms and the screens - the last two undecided-free primitives, then the whole structure tier. Thirteen pages.',
      'Option Row, registered at last (drafted alongside the Button pilot) and extended with what landed since: the switch variant that stands the ring down, and the Language rows\' flag and own-script title.',
      'Empty state - the calm card a list shows in its own place, with the voice rule spelled out.',
      'Setting row and list - the 32-chip field anatomy, the label-inset separator arithmetic, and the shrink-then-wrap rule for translated labels.',
      'Setting group and List row - the schedule card and its label rows, with the platform-picker note for the time pill.',
      'Module row - one anatomy across all five module screens, and the settled-keeps-its-elevation rule stated against Notice\'s recede.',
      'Tile grid and Bento tile - two columns at gap 8, the tile anatomy, and the instruction that Business\'s status card is the SAME native component, never a fork.',
      'Gallery - the add-a-widget rows, and its size pill promoted to a real primitive (SizePill) because three other screens already borrow it.',
      'Notice - the unread dot geometry, and read as the one settled state that recedes.',
      'Filter rail and Search field - the list furniture pair, each contrasted against its formal sibling (Segmented, Field) so nobody merges them.',
      'Assistant summary - the most reused block in the app after the primitives, documented voice-first: one paragraph, first person, no props to grow into another card.',
      'The primitives tier is now fully documented except Chat Bubble, which stays a decision, not a page.',
    ],
  },
  {
    version: '0.1.2',
    date: '16 August 2026',
    items: [
      'Wave 2: the atoms that contain Icon, plus the Code Box that Wave 1 owed.',
      'Chip - the four-rung, six-tone identity holder and its closed-list invariants.',
      'Avatar - photos and seeded drawn portraits filling a Chip; the FNV-1a seed rule ports so the same person wears the same face on native.',
      'Field - the pill input, the phone field with its leading country-code select, the focus ring on the pill, and the gate-on-empty rule.',
      'Segmented - the tonal trough with equal-width options, plain and glyph-led forms.',
      'Inline link action and Inline text button - the two text-only actions, each with its own page and contract.',
      'Code Box - per-digit entry with the walk-forward/walk-back focus contract and the native hidden-input recommendation.',
      "Button's leading icon corrected again on feedback: flex-centred at natural width, both sizes - no stretch, exact 8 gap.",
      'Docs surface fixes from review: skeleton demo content now mirrors its placeholder pixel-exactly; boxed callouts span the full column; the pill specimens draw styled (the per-area stylesheets now load on the docs surface).',
      'Switch gains a disabled state, by product decision: the track drops to the card-tonal ground a disabled Button wears, the knob position keeps telling the value, and the row refuses the tap. Added to the app first, then here; no call site ships it yet.',
    ],
  },
  {
    version: '0.1.1',
    date: '16 August 2026',
    items: [
      'Wave 1 of the component documentation: the fourteen pieces that compose nothing, so every later page builds on documented ground.',
      'Icon documented first - the closed 51-glyph vocabulary, the four rung sizes, the one-colour duotone rule, and the react-native-svg contract over the kit glyph data.',
      'The text atoms: Footnote, Caption, Section heading.',
      'The four pills, each carrying a different kind of meaning: Tag (feature), Tone label pill (identity), State pill (intelligence vocabulary), Status pill (meeting vocabulary, with the one breathing dot).',
      'The controls with their motion contracts: Switch (the double bounce and the mount guard), Progress, Page Dots, Stepped slider (the fill-to-thumb-centre formula).',
      'Skeleton (the pulse and the cross-blur reveal) and the Card hairline treatment - explicitly a treatment, not a Card component.',
      'Button correction: a leading icon always rides the flex-centred layout at 18 (14 on the small pill); the misaligned specimen combination the app never draws is gone.',
      'The kit now ships every documented component mirror automatically.',
    ],
  },
  {
    version: '0.1.0',
    date: '15 August 2026',
    items: [
      'First release of the documentation and the starter kit.',
      'Foundations live at their real values: colour, typography, spacing and shape, elevation, motion, iconography, and the runtime axes, every value read off the running stylesheet.',
      'The component roster: 161 class families audited out of the app and folded into roughly 85 components, tiered, with honest per-entry status.',
      'Button documented as the pilot component, with its full React Native contract (Expo SDK 54+, RN 0.81+, New Architecture).',
      'The token conversion guide: what every token family becomes in React Native, including the boxShadow path, the static-font-instance requirement, and the blur fallback.',
      'The downloadable kit: generated theme.ts, the duotone icon glyph data, and the spec documents.',
      'The docs shell: global search, the expanded on-this-page rail, and the pull-cord theme toggle.',
    ],
  },
]
