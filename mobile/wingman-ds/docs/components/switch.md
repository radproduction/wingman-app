---
type: Note
---
# Switch

The app's one toggle. The row owns the press target and the label; the switch is only the pill.
Live page: `/components/switch`. Figma: the `Switch` set.

- Track 46x28 pill: `--track` off, `--accent` on, recoloured over `--toggle-track`.
- Knob: 22 circle, inset 3 (an optical carve-out, off the spacing grid on purpose), `--knob` -
  **white in both themes**: a knob the colour of its own card vanishes into its track on charcoal.
- Travel: 18 (`--toggle-travel`), **signed** - it reverses under RTL. Double bounce: overshoot
  `--toggle-ov1`, return `--toggle-ov2`, settle, inside `--toggle-dur` with `--toggle-ease`.
- The is-init guard: a keyframe bound to a resting state plays on mount, so the bounce only ever
  describes a change the user made. Reduced motion: place, do not animate.
- **Disabled** (product decision, 2026-08-16): the track drops to `--card-tonal` whichever value it
  holds - the same ground a disabled Button wears - and the knob's **position** still tells on/off,
  so the value survives without a live colour. The knob stays white. The row refuses the tap and
  carries the accessibility state. For "not right now" (saving, a dependency off), never "not for
  you" - a row that can never apply is hidden, not greyed. No app call site ships it yet; the Figma
  Switch set gains the variant on the next gated sync.

```tsx
interface SwitchProps {
  on: boolean
  disabled?: boolean   // quiet track; the ROW refuses the tap
}
// State lives in the row that owns the label and the press.
// Motion values: motion.named.toggle in theme.ts.
```
