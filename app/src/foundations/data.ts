
export type TokenGroup = {
  id: string
  title: string
  note?: string
  tokens: readonly string[]
}


export const COLOR_GROUPS: readonly TokenGroup[] = [
  {
    id: 'grounds',
    title: 'Grounds and surfaces',
    note: 'Lightest surface last. Separation in this app comes from tone, not from lines.',
    tokens: [
      '--canvas',
      '--panel',
      '--panel-inner',
      '--settled',
      '--home-surface',
      '--surface',
      '--surface-alt',
      '--card',
      '--card-tonal',
      '--card-tonal-cool',
      '--disc',
    ],
  },
  {
    id: 'text',
    title: 'Text',
    tokens: ['--ink', '--muted', '--on-accent', '--on-ink'],
  },
  {
    id: 'accent',
    title: 'Accent',
    tokens: ['--accent', '--accent-deep', '--accent-tonal', '--accent-line', '--focus-ring'],
  },
  {
    id: 'signals',
    title: 'Signals',
    note: 'Never the only carrier of a state. Every tone here rides beside a label or a glyph.',
    tokens: ['--warn', '--warn-tonal', '--alert', '--ok', '--ok-soft', '--ok-tonal', '--online'],
  },
  {
    id: 'chips',
    title: 'Identity chip tones',
    note: 'Six tones. The glyph on a tinted chip is the same hue at a mid tone, never the deepest shade of it.',
    tokens: [
      '--chip-blue',
      '--chip-lavender',
      '--chip-mint',
      '--chip-peach',
      '--chip-sand',
      '--chip-rose',
      '--tone-blue',
      '--tone-lavender',
      '--tone-mint',
      '--tone-peach',
      '--tone-sand',
      '--tone-rose',
      '--tone-lavender-text',
      '--tone-peach-text',
      '--tone-sand-text',
    ],
  },
  {
    id: 'lines',
    title: 'Lines and scrims',
    tokens: [
      '--track',
      '--track-cool',
      '--line',
      '--line-soft',
      '--line-strong',
      '--frame-line',
      '--card-line',
      '--scrim',
    ],
  },
  {
    id: 'glass',
    title: 'Glass',
    note: 'The frosted tab bar and headers. These are the tint over a blur, not a solid fill.',
    tokens: ['--glass', '--glass-hi', '--glass-line'],
  },
  {
    id: 'fixed',
    title: 'Deliberately unthemed',
    note: 'These hold one value in both themes on purpose. A knob the colour of its own card would vanish into its track on charcoal.',
    tokens: ['--knob', '--brand-disc', '--art-paper', '--art-ink', '--toast-bg', '--metric-veil'],
  },
  {
    id: 'metrics',
    title: 'Metric pills',
    note: 'Three fixed hues, each a ground, a paler disc, a dark ink and a deep glyph.',
    tokens: [
      '--metric-teal',
      '--metric-teal-fill',
      '--metric-teal-disc',
      '--metric-teal-ink',
      '--metric-teal-icon',
      '--metric-amber',
      '--metric-amber-fill',
      '--metric-amber-disc',
      '--metric-amber-ink',
      '--metric-amber-icon',
      '--metric-violet',
      '--metric-violet-fill',
      '--metric-violet-disc',
      '--metric-violet-ink',
      '--metric-violet-icon',
    ],
  },
  {
    id: 'day',
    title: "Today's Snapshot card",
    note: 'Built to the metric recipe so the card carries the same weight as the three pills beside it.',
    tokens: ['--day-bg', '--day-foot', '--day-track', '--day-disc', '--day-ink', '--day-strong'],
  },
  {
    id: 'traffic',
    title: 'Traffic ramp',
    note: 'A scale rather than a signal family: the load painted along a route line, flowing to worst.',
    tokens: [
      '--tf-flow',
      '--tf-slow',
      '--tf-heavy',
      '--tf-severe',
      '--tf-jam',
      '--tf-fetch',
      '--route-alt',
    ],
  },
  {
    id: 'fact',
    title: 'Fact well',
    note: 'The recessed well behind a fact icon. A dent rather than a lift, so it goes darker than its card in dark mode.',
    tokens: ['--fact-disc', '--fact-icon'],
  },
]


export const SHADOW_TOKENS = [
  '--shadow-card',
  '--shadow-nav',
  '--shadow-sheet',
  '--shadow-thumb',
  '--shadow-toast',
] as const


export const SPACING_TOKENS = [
  '--space-4',
  '--space-8',
  '--space-12',
  '--space-16',
  '--space-24',
  '--space-32',
  '--space-48',
  '--space-64',
] as const

export const RADIUS_TOKENS = [
  '--radius-none',
  '--radius-xs',
  '--radius-sm',
  '--radius-md',
  '--radius-lg',
  '--radius-xl',
  '--radius-pill',
] as const

export const CHIP_TOKENS = ['--chip-xs', '--chip-sm', '--chip-md', '--chip-lg'] as const
export const CHIP_ICON_TOKENS = [
  '--chip-icon-xs',
  '--chip-icon-sm',
  '--chip-icon-md',
  '--chip-icon-lg',
] as const

export const ROW_TOKENS = [
  '--row-pad-y',
  '--row-gap',
  '--row-chip',
  '--list-gap',
  '--set-pad-y',
  '--fs-row',
  '--fs-sub',
] as const


export const TYPE_TOKENS = ['--font-ui', '--pill-line', '--pill-nudge', '--font-round'] as const

export type TextRole = {
  role: string
  size: number
  weight: number
  lineHeight?: number
  tracking?: string
  use: string
}

export const TEXT_ROLES: readonly TextRole[] = [
  { role: 'display/lg', size: 30, weight: 400, lineHeight: 1.15, tracking: '-1%', use: 'onboarding heading' },
  { role: 'display/md', size: 26, weight: 400, lineHeight: 1.1, use: 'day-card key value' },
  { role: 'display/sm', size: 19, weight: 400, lineHeight: 1.15, use: 'tile value, wordmark' },
  { role: 'title/lg', size: 17, weight: 500, use: 'hero greeting, field text' },
  { role: 'title/md', size: 16, weight: 500, use: 'section headings' },
  { role: 'title/sm', size: 15, weight: 500, use: 'row titles, button labels' },
  { role: 'body/md', size: 15, weight: 400, lineHeight: 1.45, use: 'screen body copy' },
  { role: 'body/sm', size: 13.5, weight: 400, lineHeight: 1.4, use: 'hero summary, toast' },
  { role: 'label/md', size: 13, weight: 500, use: 'card and tile titles' },
  { role: 'label/sm', size: 12, weight: 500, use: 'channel chip' },
  { role: 'label/xs', size: 11, weight: 500, use: 'tab bar labels' },
  { role: 'caption', size: 12.5, weight: 400, lineHeight: 1.45, use: 'notes, hints, subtext' },
  { role: 'overline', size: 11, weight: 500, tracking: '+8%', use: 'all-caps kickers' },
]


export const DURATION_TOKENS = [
  '--duration-stagger',
  '--duration-micro',
  '--duration-quick',
  '--duration-fast',
  '--duration-medium',
  '--duration-slow',
  '--duration-very-slow',
] as const

export const EASING_TOKENS = [
  '--ease-smooth-out',
  '--ease-in-out',
  '--ease-out',
  '--ease-linear',
  '--ease-bounce',
  '--ease-bounce-strong',
] as const

export const DISTANCE_TOKENS = [
  '--distance-micro',
  '--distance-small',
  '--distance-base',
  '--distance-medium',
  '--distance-large',
] as const

export const SCALE_TOKENS = ['--scale-large', '--scale-medium', '--scale-small', '--scale-tiny'] as const

export const BLUR_TOKENS = ['--blur-small', '--blur-medium', '--blur-large'] as const

export const NAMED_MOTION: readonly TokenGroup[] = [
  {
    id: 'modal',
    title: 'Bottom sheet',
    note: "There is no close duration on purpose: the sheet leaves on a spring seeded with the gesture's own velocity.",
    tokens: ['--modal-open-dur', '--modal-ease'],
  },
  {
    id: 'toast',
    title: 'Toast',
    note: 'Arriving is slower than leaving.',
    tokens: ['--toast-open', '--toast-close', '--toast-distance', '--toast-blur', '--toast-scale', '--toast-ease'],
  },
  { id: 'tabs', title: 'Tab bar pill', tokens: ['--tabs-dur', '--tabs-ease'] },
  {
    id: 'page',
    title: 'Detail layer push and pop',
    note: 'The push travels the full frame and the screen it covers recedes a quarter of the way and blurs.',
    tokens: ['--page-slide-dur', '--page-slide-distance', '--page-parallax', '--page-blur', '--page-slide-ease'],
  },
  {
    id: 'check',
    title: 'Task check',
    note: 'The draw length is measured off the path itself, never hardcoded, so swapping the glyph keeps it exact.',
    tokens: ['--check-box', '--check-draw', '--check-delay', '--check-uncheck', '--check-ease'],
  },
  {
    id: 'toggle',
    title: 'Switch',
    note: 'Signed: the knob travels toward the trailing edge, so it reverses under right-to-left.',
    tokens: ['--toggle-dur', '--toggle-travel', '--toggle-ov1', '--toggle-ov2', '--toggle-track', '--toggle-ease'],
  },
  {
    id: 'stagger',
    title: 'Agenda stagger',
    tokens: ['--stagger-dur', '--stagger-distance', '--stagger-stagger', '--stagger-blur', '--stagger-ease'],
  },
  { id: 'acc', title: 'Folding bar', tokens: ['--acc-expand', '--acc-collapse', '--acc-chevron', '--acc-ease'] },
  {
    id: 'pulse',
    title: 'In-flight pulse and skeleton',
    tokens: ['--pulse-dur', '--pulse-min', '--skel-hold', '--reveal-dur', '--reveal-blur', '--reveal-ease'],
  },
]

export const ALL_TOKENS: readonly string[] = [
  ...COLOR_GROUPS.flatMap((g) => g.tokens),
  ...SHADOW_TOKENS,
  ...SPACING_TOKENS,
  ...RADIUS_TOKENS,
  ...CHIP_TOKENS,
  ...CHIP_ICON_TOKENS,
  ...ROW_TOKENS,
  ...TYPE_TOKENS,
  ...DURATION_TOKENS,
  ...EASING_TOKENS,
  ...DISTANCE_TOKENS,
  ...SCALE_TOKENS,
  ...BLUR_TOKENS,
  ...NAMED_MOTION.flatMap((g) => g.tokens),
  '--dir',
  '--sun-turn',
]
