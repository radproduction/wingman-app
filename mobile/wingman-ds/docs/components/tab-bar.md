---
type: Note
---
# Tab bar

The five tabs in a frosted capsule floating over the content, with a tonal chip that glides to
whichever tab you pick. The app's only persistent chrome - and it stands down entirely, sliding off
the bottom edge, whenever a detail screen takes over. Live page: `/components/tab-bar`. Figma:
`Nav Bar`, `Nav Item`.

## Anatomy

| Part | Spec |
|---|---|
| Capsule | Floating: absolute over the content at 24 side insets, bottom clamp(14, home-indicator inset, 24). Radius pill. |
| Glass | `--glass` tint, blur(22) saturate(1.7), `--shadow-nav`, inset 1 shine (`--glass-hi`) at the top, inset 1 `--glass-line` ring. No blur available, or reduced transparency: the opaque `--card` ground. |
| Cells | Five equal fifths, no gap. Icon 20 over a 10/500 label at gap 4, line-height pinned to 1 (the RTL fallback faces run taller). |
| Chip | The sliding capsule: `--accent-tonal` with an inset `--accent-line` ring, inset `--nav-pad` (6), one cell plus the 6 overlap wide. |
| Active | Icon swaps stroke to duotone; icon and label take `--accent-deep`. The chip is the state. |

## Behaviour

- Select: the chip glides over `--tabs-dur` (250ms) with `--tabs-ease`; the screens swap with a
  rise-and-fade. Tabs are siblings - nothing slides between them.
- Stand-down: a detail push slides the whole bar off the bottom (height + inset + 12) in lockstep
  with the page slide - same clock, same ease, no fade.
- Labels sit a step under the smallest caption: read once, then recognised by shape.
- RTL: the chip's travel is signed by the writing direction.
- Reduced motion: chip and bar place instead of gliding.

## React Native contract

```tsx
interface TabBarProps {
  route: TabRoute          // 'home' | 'calendar' | 'email' | 'tasks' | 'more'
  onNavigate: (route: TabRoute) => void
}
// Glass: BlurView + tint (the low-end Android budget - open question 21 -
// decides whether the opaque fallback is a capability check or a device
// tier). The chip is ONE continuously-positioned element (Reanimated
// translateX by active index), never per-cell backgrounds - those cannot
// glide and cannot overlap the neighbour the way the chip does. The
// narrow-phone width games (--nav-short) are web adaptation; measure the
// cell natively.
```

## Tokens

`--glass`, `--glass-hi`, `--glass-line`, `--shadow-nav`, `--card`, `--accent-tonal`,
`--accent-line`, `--accent-deep`, `--muted`, `--radius-pill`, `--tabs-dur`, `--tabs-ease`,
`--page-slide-dur`, `--page-slide-ease`, `--nav-bottom`, `--tabbar-clearance`.
