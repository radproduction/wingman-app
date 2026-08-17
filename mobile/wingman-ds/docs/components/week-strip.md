---
type: Note
---
# Week strip and month grid

Seven day columns: a weekday initial, the number in its 36 disc, up to three event dots under it.
The expanded month grid is the same cell in more rows - one anatomy, two layouts, and selection
always beats today's ring. Live page: `/components/week-strip`. Figma: `Date Bar`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Seven equal columns at gap `--space-4`, padding 4 above and 12 below. The month grid reuses the columns with a separate weekday header row. |
| Cell | A centred column at gap `--space-8`: the 11/500 muted initial (strip only), the 36 number disc at 15/500, the 4-high dots row. |
| Today | An inset 1.5 accent ring on the disc, number in `--accent-deep`. |
| Selected | Accent fill, on-accent number, dots turned accent. Selection beats today: the ring drops when the fill arrives. |
| Dim | Month-grid days bleeding in from neighbours: number at 0.45, dots at 0.4. |

## Behaviour

- Pick: the disc's ground transitions over the quick duration; the agenda re-cuts to the day.
- Grid enter: a small drop-in (opacity plus 6 of travel) over `--duration-fast` with
  `--ease-smooth-out`. The strip-to-grid fold belongs to the Calendar screen.
- Semantics: strip cells are tabs; grid cells are plain toggles - a tablist with weekday header
  cells would lie.

## React Native contract

```tsx
interface DayCellProps {
  date: string
  selected: boolean
  today: boolean
  dim?: boolean
  dots: number
  inStrip?: boolean
  onPick: (date: string) => void
}
// ONE cell, two layouts. Do not build two components.
```

## Tokens

`--accent`, `--accent-deep`, `--on-accent`, `--track`, `--muted`, `--ink`, `--radius-pill`,
`--space-4/8`, `--duration-quick`, `--duration-fast`, `--ease`, `--ease-smooth-out`.
