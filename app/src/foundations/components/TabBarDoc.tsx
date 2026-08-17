import { useState, type CSSProperties } from 'react'
import { Icon, type IconName } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const CONTRACT = `// wg/TabBar.tsx - implement to match.

interface TabBarProps {
  route: TabRoute          // 'home' | 'calendar' | 'email' | 'tasks' | 'more'
  onNavigate: (route: TabRoute) => void
}

// Geometry, from the theme:
//   a floating capsule: absolute over the content, 24 side insets,
//   bottom = clamp(14, homeIndicatorInset, 24) - it clears the indicator
//   itself, not the whole reserved inset
//   glass: the glass tint + blur(22) saturate(1.7) + navShadow + an inset
//   1 shine at the top and an inset 1 glassLine ring. Where blur is
//   unavailable (or reduced transparency): the opaque card ground.
//   five equal cells, no gap; cell = icon 20 over a 10/500 label,
//   gap 4, lineHeight 1 (pinned: the RTL fallback faces run taller)
//   indicator: a capsule on accentTonal with an inset accentLine ring,
//   inset navPad(6) top/bottom/start; width = cell + overlap(6); its X
//   steps by one cell width, SIGNED by the writing direction
//
// Motion:
//   chip slide: 250ms, cubic-bezier(0.22, 1, 0.36, 1) (tabs tokens) -
//   the chip glides; the screens themselves rise-and-fade (tabs are
//   siblings, not levels)
//   stand-down: pushing a detail screen slides the whole bar off the
//   bottom edge (its own height + bottom inset + 12), in LOCKSTEP with
//   the page slide - same 250ms, same ease, no fade. Back brings it up
//   the same way.
//   active icon swaps stroke -> duotone; label and icon take accentDeep
//
// Reduced motion: the chip and the bar place instead of gliding.
// The narrow-phone width games (--nav-short) are web adaptation; natively
// measure the cell and derive the chip from it.`

const TABS: { label: string; icon: IconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Calendar', icon: 'calendar' },
  { label: 'Email', icon: 'mail' },
  { label: 'Tasks', icon: 'task' },
  { label: 'More', icon: 'grid' },
]

const TabDemo = () => {
  const [idx, setIdx] = useState(0)
  return (
    <Stage ground="panel">
      <div
        style={{
          position: 'relative',
          isolation: 'isolate',
          width: '100%',
          maxWidth: 380,
          height: 150,
          borderRadius: 20,
          overflow: 'hidden',
          background: 'var(--canvas)',
        }}
      >
        {}
        <div style={{ display: 'flex', gap: 12, padding: 16, opacity: 0.9 }}>
          {(['blue', 'peach', 'mint', 'lavender'] as const).map((tone) => (
            <span key={tone} className={`wg-chip ${tone} md`}>
              <Icon name="spark" size={24} variant="duotone" />
            </span>
          ))}
        </div>
        <nav
          className="wg-nav"
          style={{ '--active-index': idx, '--nav-bottom': '14px' } as CSSProperties}
          aria-label="Demo tabs"
        >
          <span className="wg-nav__ind" aria-hidden="true" />
          {TABS.map((tab, i) => (
            <button key={tab.label} type="button" className={i === idx ? 'on' : ''} onClick={() => setIdx(i)}>
              <span className="pill">
                <Icon name={tab.icon} size={20} variant={i === idx ? 'duotone' : 'stroke'} />
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </Stage>
  )
}

export const TabBarDoc = () => (
  <>
    <p className="wgd-lead">
      The five tabs, in a frosted capsule floating over the content, with a tonal chip that glides to
      whichever tab you pick. It is the app's only persistent chrome - and it stands down entirely,
      sliding off the bottom edge, whenever a detail screen takes over.
    </p>

    <DocSection title="Specimen">
      <TabDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Capsule', spec: 'Floating: absolute over the content at 24 side insets, bottom clamp(14, home-indicator inset, 24). Radius pill.' },
          { part: 'Glass', spec: '--glass tint, blur(22) saturate(1.7), --shadow-nav, an inset 1 shine (--glass-hi) along the top and an inset 1 --glass-line ring. No blur available, or reduced transparency: the opaque --card ground instead.' },
          { part: 'Cells', spec: 'Five equal fifths, no gap. Each: a 20 icon over its 10/500 label at gap 4, line-height pinned to 1 so the RTL fallback faces cannot push the label down.' },
          { part: 'Chip', spec: 'The sliding capsule: --accent-tonal with an inset --accent-line ring, inset --nav-pad (6), one cell plus the 6 overlap wide - it hangs half the overlap past its cell on each side.' },
          { part: 'Active', spec: 'Icon swaps stroke to duotone; icon and label take --accent-deep. The chip is the state; the cell itself never changes ground.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Select', rule: 'The chip glides to the tab over --tabs-dur (250ms) with --tabs-ease; the screens swap with a rise-and-fade. Tabs are siblings - no slide between them.' },
          { state: 'Stand-down', rule: 'A detail push slides the whole bar off the bottom (its height + inset + 12) in lockstep with the page slide - same duration, same ease, no fade. It rides back up on pop.' },
          { state: 'Labels', rule: '10px is a step under the smallest caption, on purpose: five words read once and then recognised by shape.' },
          { state: 'RTL', rule: 'The chip\'s travel is signed by the writing direction; the cells reverse with the script.' },
          { state: 'Reduced motion', rule: 'Chip and bar place instead of gliding; the frost stays.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --glass, --glass-hi, --glass-line, --shadow-nav, --card, --accent-tonal, --accent-line,
        --accent-deep, --muted, --radius-pill, --tabs-dur, --tabs-ease, --page-slide-dur,
        --page-slide-ease, --nav-bottom, --tabbar-clearance.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Two traps. The glass needs <code>BlurView</code> (expo-blur) with the tint layered over it, and
        the low-end Android budget question (open question 21) decides whether the opaque fallback is a
        capability check or a device tier. And the chip is one continuously-positioned element behind
        five cells - not a per-cell background. Build it as a single Reanimated translateX driven by
        the active index; per-cell grounds cannot glide and cannot overlap the neighbour the way the
        chip does.
      </Trap>
      <Contract label="wg/TabBar.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
