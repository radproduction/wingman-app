---
type: Note
---
# Task row

A task, where it came from, and when it is due - with the app's signature completion: tap anywhere
on the row and the disc fills first, then the tick draws itself along its own path. Live page:
`/components/task-row`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Home-surface, radius lg, hairline, padding `--row-pad-y` by `--space-16`, gap `--row-gap`; the list stacks at `--list-gap`. Press scales to 0.99. |
| Check | A 24 circle: open, an inset 2 `--track` ring; done, `--accent` fill with the on-accent tick. |
| Title | `--fs-row`/500 / 1.25. Done: muted, line-through in the track colour. |
| Source | An 11.5/500 tone pill naming where Wingman pulled it from ("From WhatsApp"), 8 above. |
| Due | 12.5/500 muted on the end; done turns it `--ok` green. |

## Behaviour

- The draw: disc fills over `--check-box` (150ms), then the tick draws along its MEASURED path over
  `--check-draw` (350ms) - hidden only ever by dash offset, never by colour, so a half-drawn tick
  reverses cleanly. Un-check runs backwards over `--check-uncheck` (150ms).
- The whole row toggles; the check is never the only target.
- Reduced motion: fill and tick appear in place.

## React Native contract

```tsx
interface TaskRowProps {
  title: string
  source?: { label: string; tone: ChipTone; icon?: ReactNode }
  due?: string
  done: boolean
  onToggle: () => void
}
// Measure the tick's path at runtime (react-native-svg exposes it) and
// drive only strokeDashoffset. A hardcoded length breaks silently the
// day the glyph changes.
```

## Tokens

`--home-surface`, `--card-line`, `--track`, `--accent`, `--on-accent`, `--ok`, `--muted`,
`--row-pad-y`, `--row-gap`, `--list-gap`, `--fs-row`, `--radius-lg`, `--radius-pill`,
`--space-8/16`, `--check-box`, `--check-draw`, `--check-uncheck`, `--check-ease`, the chip tone
pairs.
