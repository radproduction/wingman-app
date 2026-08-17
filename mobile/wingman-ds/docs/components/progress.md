---
type: Note
---
# Progress

Segmented progress: one bar per step, filled steps in accent. Lives in the onboarding top bar, where
the frame stays still and only this fills. Live page: `/components/progress`. Figma: `Progress`.

- Equal flex children on a `--space-4` gap, height 4, radius pill.
- `--card-tonal` unfilled, `--accent` filled, transitioning over `--duration-medium` with `--ease`.
- No numbers, no percentage text - the bar is the statement.
- On onboarding step navigation only the centre column animates; this bar stays static.

```tsx
interface ProgressProps { steps: number; done: number }
```
