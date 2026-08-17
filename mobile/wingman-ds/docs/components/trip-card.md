---
type: Note
---
# Trip card

The one expressive element on the Travel screen: two airport codes with a dotted flight line
between them, the plane riding its middle. Everything else is quiet facts - and "nothing booked
yet" is a state, never a warning. Live page: `/components/trip-card`.

## Anatomy

| Part | Spec |
|---|---|
| Card | Home-surface, radius lg, hairline, padding `--space-16`. |
| Route | The two codes at 26/400 with +0.01em tracking, the flight line flexing between at gap 16. |
| Flight line | A 2 dotted `--track` run each side of the plane glyph, riding the middle in `--accent`, rotated 45 degrees to level out (the glyph is drawn climbing). |
| Meta | 13.5 muted, 12 above: dates, airline, one line. |
| Foot | Above an inset `--line` hairline: the 13.5/500 countdown, and a quiet `--card-tonal` state pill when something is unbooked. |

## Behaviour

- "Hotel not booked yet" is a muted pill; the ask button below the card is where fixing it starts.
- The card renders only when there is a route to draw.
- RTL: the dotted run is symmetric, so only the plane mirrors.

## React Native contract

```tsx
interface TripCardProps {
  from: string
  to: string
  meta: string
  away: string
  state?: string
  onPress?: () => void
}
```

## Tokens

`--home-surface`, `--card-line`, `--track`, `--accent`, `--card-tonal`, `--line`, `--muted`,
`--radius-lg`, `--radius-pill`, `--space-4/8/12/16`.
