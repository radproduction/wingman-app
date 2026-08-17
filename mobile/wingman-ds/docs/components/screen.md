---
type: Note
---
# Screen scaffold

The frame every screen fills: a column on the warm canvas, safe areas absorbed at both ends, the
white top surface above and the cool panel below. Tabs arrive with a rise-and-fade; a pushed screen
arrives by sliding, and never does both. Live page: `/components/screen`. Drawn in 10 app files.

## Anatomy

| Part | Spec |
|---|---|
| Frame | A flex column filling the viewport. Padding: safe-top + `--space-12` above, `--space-16` sides, safe-bottom + `--space-16` below. |
| Top surface | The canvas (home-surface on the detail layer): header or back bar, fixed furniture. |
| Panel | The cool grey surface, full-bleed, taking the rest of the height. |
| Flow variant | Onboarding: no enter animation (the step content animates instead), `--space-24` side gutter. |

## Behaviour

- Tab enter: rise-and-fade - opacity 0 to 1, `--distance-medium` of travel, `--duration-fast`,
  `--ease-smooth-out`. Tabs are siblings, not levels.
- Pushed enter: suppressed entirely - the slide is the arrival. The suppression holds until the next
  navigation, so a settled screen never replays it.
- The frame never collapses for the soft keyboard; action bars lift by `--wm-kb`.
- Reduced motion (either layer): the rise is dropped.

## React Native contract

```tsx
interface ScreenProps {
  children: ReactNode
}
// flex-1 View under the navigator; insets from react-native-safe-area-context.
// The web's 100dvh and desktop-frame height plumbing do not cross. What does:
// tabs rise, pushes slide, never both.
```

## Tokens

`--canvas`, `--home-surface`, `--wm-safe-top/bottom`, `--space-12/16/24`, `--duration-fast`,
`--ease-smooth-out`, `--distance-medium`.
