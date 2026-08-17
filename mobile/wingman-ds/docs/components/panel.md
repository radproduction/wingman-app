---
type: Note
---
# Scroll panel

The cool grey surface the content lives on, full-bleed with rounded top shoulders. On most screens
the panel is fixed furniture and a track scrolls inside it, so rows dissolve under the panel's own
lip at the top and fade out again before the floating tab bar. Live page: `/components/panel`.
Drawn in 8 app files.

## Anatomy

| Part | Spec |
|---|---|
| Surface | `--panel` fill, `--radius-xl` top corners only, bled to the screen edges. |
| Track | The scrolling child: padding `--fade-top` (16) / `--space-16` / `--track-foot`; rows in a 16-gap column. |
| Lip | A gradient of the panel's own colour over the track's top padding - opaque at the edge, gone by the first row. A masked gradient, deliberately NOT a backdrop blur (a blur clips on the rounded corners). |
| Dissolves | The track's mask: 16 at the top, weighted early so text loses legibility before the edge; 36 at the foot - longer on purpose, so a row clears the floating tab bar as it leaves. |
| Footer | A detail screen's pinned actions render outside the track, above the home indicator. |

## Behaviour

- Two scroll modes: Home and Calendar scroll as whole pages; Email, Tasks, More and the entire
  detail layer fix the panel and scroll the track inside it.
- On the cool surface the tonal fills re-point: `--card-tonal` to `--card-tonal-cool`, `--track` to
  `--track-cool`. Components never know; the surface decides.
- Tab screens reserve `--tabbar-clearance` at the track's foot; the detail layer reserves only the
  home indicator plus the dissolve.
- Overscroll never chains out of the track.

## React Native contract

```tsx
interface PanelProps {
  children: ReactNode
  footer?: ReactNode      // pinned outside the scroll
}
// The dissolve mask: MaskedView + LinearGradient over the ScrollView (or
// gradient overlays in the panel colour). 16 in, 36 out - DIFFERENT on
// purpose; do not symmetrise, and do not swap the gradient for a blur.
// The cool tonal re-pointing is a themed subtree, not per-component overrides.
```

## Tokens

`--panel`, `--panel-inner`, `--radius-xl`, `--space-16`, `--fade-top`, `--fade-foot`,
`--track-side`, `--track-foot`, `--tabbar-clearance`, `--card-tonal-cool`, `--track-cool`.
