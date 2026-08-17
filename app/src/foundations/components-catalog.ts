
export type ComponentStatus = 'documented' | 'pending' | 'blocked' | 'decide' | 'web-only'

export type ComponentEntry = {
  id: string
  name: string
  tier: 'primitive' | 'shell' | 'structure' | 'pattern' | 'web-only'
  family: string
  used: number
  figma?: string
  status: ComponentStatus
  note?: string
}

export const COMPONENTS: readonly ComponentEntry[] = [
  { id: 'button', name: 'Button', tier: 'primitive', family: 'wg-btn', used: 37, figma: 'Button', status: 'blocked' },
  { id: 'chip', name: 'Chip', tier: 'primitive', family: 'wg-chip', used: 32, figma: 'Chip', status: 'blocked' },
  { id: 'option-row', name: 'Option Row', tier: 'primitive', family: 'wg-option', used: 14, figma: 'Option Row', status: 'blocked' },
  { id: 'field', name: 'Field', tier: 'primitive', family: 'wg-field', used: 10, figma: 'Field', status: 'blocked' },
  { id: 'segmented', name: 'Segmented', tier: 'primitive', family: 'wg-seg', used: 9, figma: 'Segmented', status: 'blocked' },
  { id: 'switch', name: 'Switch', tier: 'primitive', family: 'wg-switch', used: 1, figma: 'Switch', status: 'blocked' },
  { id: 'inline-link', name: 'Inline link action', tier: 'primitive', family: 'wg-link', used: 4, status: 'blocked' },
  { id: 'text-button', name: 'Inline text button', tier: 'primitive', family: 'wg-note', used: 2, status: 'blocked' },
  { id: 'code-box', name: 'Code Box', tier: 'primitive', family: 'wg-code', used: 2, figma: 'Code Box', status: 'blocked' },
  { id: 'page-dots', name: 'Page Dots', tier: 'primitive', family: 'wg-dots', used: 1, figma: 'Page Dots', status: 'blocked' },
  { id: 'progress', name: 'Progress', tier: 'primitive', family: 'wg-track', used: 2, figma: 'Progress', status: 'blocked' },
  { id: 'avatar', name: 'Avatar', tier: 'primitive', family: 'wg-avatar', used: 2, status: 'blocked' },
  { id: 'tag', name: 'Tag', tier: 'primitive', family: 'wg-tag', used: 2, status: 'blocked' },
  { id: 'caption', name: 'Caption', tier: 'primitive', family: 'wg-cap', used: 1, status: 'blocked' },
  { id: 'section-head', name: 'Section heading', tier: 'primitive', family: 'wg-sect', used: 1, status: 'blocked' },
  { id: 'slider', name: 'Stepped slider', tier: 'primitive', family: 'wg-slider', used: 1, status: 'blocked' },
  { id: 'skeleton', name: 'Skeleton', tier: 'primitive', family: 'wg-skel', used: 4, status: 'blocked' },
  { id: 'empty-state', name: 'Empty state', tier: 'primitive', family: 'wg-empty', used: 3, status: 'blocked' },
  { id: 'footnote', name: 'Footnote', tier: 'primitive', family: 'wg-footnote', used: 23, status: 'blocked' },
  { id: 'tone-pill', name: 'Tone label pill', tier: 'primitive', family: 'wg-flag', used: 2, status: 'blocked' },
  { id: 'state-pill', name: 'State pill', tier: 'primitive', family: 'wg-state', used: 1, status: 'blocked' },
  { id: 'status-pill', name: 'Status pill', tier: 'primitive', family: 'wg-mstatus', used: 3, status: 'blocked' },
  { id: 'icon', name: 'Icon', tier: 'primitive', family: 'icons.tsx', used: 60, figma: 'icon/* (51)', status: 'blocked' },
  { id: 'chat-bubble', name: 'Chat Bubble', tier: 'primitive', family: '(none)', used: 0, figma: 'Chat Bubble', status: 'decide', note: 'In the Figma library with no code behind it.' },

  { id: 'screen', name: 'Screen scaffold', tier: 'shell', family: 'wg-screen', used: 10, status: 'blocked' },
  { id: 'panel', name: 'Scroll panel', tier: 'shell', family: 'wg-panel', used: 8, status: 'blocked' },
  { id: 'app-header', name: 'App header', tier: 'shell', family: 'wg-appbar', used: 4, figma: 'Top Bar', status: 'blocked' },
  { id: 'back-bar', name: 'Detail back bar', tier: 'shell', family: 'wg-subbar', used: 7, figma: 'Top Bar', status: 'blocked' },
  { id: 'onboarding-bar', name: 'Onboarding top bar', tier: 'shell', family: 'wg-topbar', used: 2, status: 'blocked' },
  { id: 'tab-bar', name: 'Tab bar', tier: 'shell', family: 'wg-nav', used: 1, figma: 'Nav Bar, Nav Item', status: 'blocked' },
  { id: 'sheet', name: 'Bottom sheet', tier: 'shell', family: 'wm-sheet', used: 10, status: 'blocked' },
  { id: 'sheet-actions', name: 'Sheet action list', tier: 'shell', family: 'wm-ap', used: 2, status: 'blocked' },
  { id: 'toast', name: 'Toast', tier: 'shell', family: 'wm-toast', used: 1, figma: 'Toast', status: 'blocked' },
  { id: 'action-bar', name: 'Bottom action bar', tier: 'shell', family: 'wg-actions', used: 4, status: 'blocked' },
  { id: 'screen-transition', name: 'Screen transition', tier: 'shell', family: 'wm-stack', used: 2, status: 'blocked', note: 'Crosses as a motion contract, not as code.' },
  { id: 'not-connected', name: 'Not-connected screen', tier: 'shell', family: 'wg-nc', used: 1, status: 'blocked' },
  { id: 'splash', name: 'Launch splash', tier: 'shell', family: 'wg-splash', used: 2, status: 'blocked', note: 'The lockup drawing itself; the artwork and every beat ship in the kit (assets/brand.ts).' },

  { id: 'card-line', name: 'Card hairline', tier: 'structure', family: 'wg-card-line', used: 40, status: 'blocked', note: 'A treatment worn by many components, not a Card component.' },
  { id: 'setting-row', name: 'Setting row', tier: 'structure', family: 'wg-set', used: 8, status: 'blocked' },
  { id: 'setting-group', name: 'Grouped setting rows', tier: 'structure', family: 'wg-group', used: 2, status: 'blocked' },
  { id: 'list-row', name: 'List row', tier: 'structure', family: 'wg-row', used: 2, status: 'blocked' },
  { id: 'module-row', name: 'Module row', tier: 'structure', family: 'wg-mrow', used: 2, status: 'blocked', note: 'One anatomy across all five module screens.' },
  { id: 'tile-grid', name: 'Tile grid', tier: 'structure', family: 'wg-grid', used: 3, status: 'blocked' },
  { id: 'bento-tile', name: 'Bento tile', tier: 'structure', family: 'wg-tile', used: 1, figma: 'Bento Tile', status: 'blocked' },
  { id: 'gallery', name: 'Gallery', tier: 'structure', family: 'wg-gal', used: 3, status: 'blocked' },
  { id: 'notice', name: 'Notice', tier: 'structure', family: 'wg-notice', used: 1, status: 'blocked' },
  { id: 'filter-rail', name: 'Filter chip rail', tier: 'structure', family: 'wg-mfilter', used: 2, status: 'blocked' },
  { id: 'search-field', name: 'Search field', tier: 'structure', family: 'wg-msearch', used: 2, status: 'blocked' },
  { id: 'assistant-summary', name: 'Assistant summary card', tier: 'structure', family: 'wg-bc', used: 17, status: 'blocked', note: 'The most reused block in the app after the primitives.' },

  { id: 'widget-cell', name: 'Widget cell', tier: 'pattern', family: 'wg-wgt', used: 2, status: 'pending' },
  { id: 'widget-row', name: 'Widget row', tier: 'pattern', family: 'wg-wrow', used: 2, status: 'pending' },
  { id: 'day-card', name: "Today's Snapshot card", tier: 'pattern', family: 'wg-daycard', used: 1, figma: 'Day Card', status: 'pending' },
  { id: 'metric-pill', name: 'Metric pill', tier: 'pattern', family: 'wg-metric', used: 1, status: 'pending' },
  { id: 'insight-card', name: 'Insight card', tier: 'pattern', family: 'wg-insight', used: 1, status: 'pending' },
  { id: 'event-card', name: 'Event card', tier: 'pattern', family: 'wg-ev', used: 1, status: 'pending' },
  { id: 'week-strip', name: 'Week strip and month grid', tier: 'pattern', family: 'wg-week', used: 1, figma: 'Date Bar', status: 'pending' },
  { id: 'task-row', name: 'Task row', tier: 'pattern', family: 'wg-task', used: 1, status: 'pending' },
  { id: 'mail-row', name: 'Mail row', tier: 'pattern', family: 'wg-mail-row', used: 1, status: 'pending' },
  { id: 'approval-card', name: 'Approval card', tier: 'pattern', family: 'wg-act', used: 6, status: 'pending' },
  { id: 'module-hero', name: 'Module hero', tier: 'pattern', family: 'wg-mod', used: 23, status: 'pending' },
  { id: 'connector-row', name: 'Connector row', tier: 'pattern', family: 'wg-conn', used: 3, status: 'pending' },
  { id: 'memory-row', name: 'Memory row', tier: 'pattern', family: 'wg-mem', used: 1, status: 'pending' },
  { id: 'meeting-row', name: 'Meeting row', tier: 'pattern', family: 'wg-meeting', used: 1, status: 'pending' },
  { id: 'trip-card', name: 'Trip card', tier: 'pattern', family: 'wg-trip', used: 1, status: 'pending' },
  { id: 'sparkline', name: 'Sparkline', tier: 'pattern', family: 'wg-spark', used: 1, status: 'pending' },
  { id: 'timeline', name: 'Timeline', tier: 'pattern', family: 'wg-tl', used: 1, status: 'pending' },
  { id: 'story-row', name: 'Story row', tier: 'pattern', family: 'wg-nrow', used: 1, status: 'pending' },
  { id: 'theme-picker', name: 'Theme picker', tier: 'pattern', family: 'wg-themes', used: 1, status: 'pending' },
  { id: 'app-icon-picker', name: 'App icon picker', tier: 'pattern', family: 'wg-icons', used: 1, status: 'pending' },

  { id: 'device-chrome', name: 'Device chrome', tier: 'web-only', family: 'wm-chrome', used: 4, status: 'web-only', note: 'A desktop drawing of a phone. On a phone it is not there at all.' },
  { id: 'install-prompt', name: 'Install prompt', tier: 'web-only', family: 'wm-install', used: 1, status: 'web-only' },
  { id: 'orientation-lock', name: 'Orientation lock', tier: 'web-only', family: 'wg-orient', used: 1, status: 'web-only' },
  { id: 'pull-spacer', name: 'Pull-to-refresh spacer', tier: 'web-only', family: 'wg-pull', used: 1, status: 'web-only', note: 'The mechanism is RefreshControl natively; the branded W+Star indicator and its numbers are documented below and ship in the kit.' },
]

export const findComponent = (id: string): ComponentEntry | undefined =>
  COMPONENTS.find((entry) => entry.id === id)

export const TIER_TITLES: Record<ComponentEntry['tier'], string> = {
  primitive: 'Primitives',
  shell: 'Shell, navigation and overlay',
  structure: 'Structure and layout',
  pattern: 'Screen patterns',
  'web-only': 'Does not cross to React Native',
}

export const TIERS = ['primitive', 'shell', 'structure', 'pattern', 'web-only'] as const
