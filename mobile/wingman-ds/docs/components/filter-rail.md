---
type: Note
---
# Filter rail

The row of filter pills above a long list. One rail, one selected pill, and the list below re-cuts
as you tap - it reads as a single control, so it sits flush and scrolls its own overflow past the
screen edge. Live page: `/components/filter-rail`. Drawn in 2 app files (Meetings, Daily
Intelligence).

## Anatomy

| Part | Spec |
|---|---|
| Rail | A flex row at gap `--space-8`, scrolling horizontally, scrollbar hidden; bled 4 outward (negative margin, matching padding) so pills never clip at the edge. |
| Pill | 13/500 on `--card-tonal`, muted text, padding `--space-8` by `--space-16`, radius pill. |
| Selected | Accent ground, on-accent text. Colour is the entire state - no border, no scale. |

## Behaviour

- Exactly one selected, always: it filters a list, it is not a toggle set.
- The rail scrolls; pills never wrap or shrink. No fade or arrow furniture - the cut-off pill is
  the affordance.
- vs Segmented: Segmented is a closed set of equal-width options in a trough; the rail is an open
  list that can outgrow the screen.

## React Native contract

```tsx
interface FilterRailProps {
  filters: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
}

// A horizontal ScrollView with showsHorizontalScrollIndicator={false} and
// contentContainer padding standing in for the web's 4 bleed.
// accessibilityRole tablist / tab + selected.
```

## Tokens

`--card-tonal`, `--accent`, `--on-accent`, `--muted`, `--radius-pill`, `--space-4/8/16`,
`--duration-quick`, `--ease`.
