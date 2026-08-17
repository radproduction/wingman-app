---
type: Note
---
# Bottom sheet

The app's one overlay surface: a card that rises from the bottom edge over a scrim, carries one
subject and its actions, and leaves the way it was thrown - every exit is a spring seeded with the
gesture's own velocity, and no close duration exists anywhere ([D-032]). Live page:
`/components/sheet`. Drawn in 10 app files.

## Anatomy

| Part | Spec |
|---|---|
| Layer | Fills the frame above the tab bar; `--scrim` covers everything behind. Tonal fills on the sheet re-point to their cool twins. |
| Sheet | `--surface` fill, `--radius-xl` top corners, `--shadow-sheet`, max-height 90%. Padding 8 / 24 / 24 + max(16, home indicator). |
| Grabber | A 40 by 4 `--track` pill on a full-width handle (12 above, 16 below). Closes twice over: tap it, or drag it. |
| Content | Optional 56 mark (the connector row's disc a size up), 21/400 title, 14 / 1.5 muted body. |
| Actions | The sheet action list: full-width buttons, 12-gap column, 24 clear of the content. |

## Behaviour

- Enter: a transition, not keyframes - translateY(14%) at 0.6 opacity to rest over
  `--modal-open-dur` (250ms) with `--modal-ease`; the scrim fades on the same clock. Interrupted
  mid-enter, the exit leaves from where the sheet actually is.
- Exit: always the spring, seeded with the gesture's velocity - scrim, Escape, grabber tap, drag,
  the sheet's own buttons. No close duration exists.
- Drag: 1:1 with the finger, every transition killed for the gesture's length; the scrim thins with
  progress. Past 25% of the sheet's height, or a fling over 500 px/s, dismisses; otherwise it
  springs home. Lifted above rest, the sheet stretches rather than showing the room behind.
- Keyboard: the sheet lifts by exactly what the keyboard covers.
- Reduced motion: the enter places; the drag still tracks and the spring exit stays - they describe
  the finger, not decoration.

## React Native contract

```tsx
interface SheetProps {
  open: boolean
  onClose: () => void      // the caller owns closing
  dismissable?: boolean    // default true; a decision in flight opts out
  children: ReactNode
}
// Do not adopt a sheet library that closes on a duration - the
// velocity-seeded spring exit IS the component. Gesture Handler + a
// Reanimated spring; keep the sheet mounted until the spring lands.
```

## Tokens

`--surface`, `--scrim`, `--track`, `--shadow-sheet`, `--radius-xl`, `--space-8/12/16/24`,
`--modal-open-dur`, `--modal-ease`, `--card-tonal-cool`, `--track-cool`.
