---
type: Note
---
# Stepped slider

The text-size control: a wide lozenge you slide between discrete stops, the scale stated by a small
and a large letter A. Live page: `/components/slider`.

- Thumb: a 34x26 lozenge, not a knob - it reads as a grip and is big enough to press without
  covering the bar. `--knob` fill, the thumb shadow, focus ring on top.
- Bar: 9 high, radius pill. **Accent fill runs to the thumb's centre, not a raw percentage**:
  `at = pos * (railWidth - thumbW) + thumbW / 2`. Fill to a percentage and the join drifts by half a
  thumb at either end - the port's first mistake.
- Stops: one 5x5 `--track` dot under each, hanging 3 below the rail, first and last under the
  travel limits. Release snaps to the nearest stop.
- Ends: a (14) and A (22), muted - the scale stated without a word of copy.

```tsx
interface SteppedSliderProps {
  stops: number
  value: number            // 0..stops-1
  onChange: (v: number) => void
}
// Accessibility: adjustable role, increment/decrement actions.
```
