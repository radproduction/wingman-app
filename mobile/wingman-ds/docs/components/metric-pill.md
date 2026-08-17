---
type: Note
---
# Metric pill

The three count pills: email, tasks, events - each a tinted card whose ground fills to its figure
like a gauge, each a door to its tab. Three tones of their own (teal, amber, violet), separate from
the six chip tones. Live page: `/components/metric-pill`.

## Anatomy

| Part | Spec |
|---|---|
| Pill | The tone's bg/ink pair, radius lg, padding 8 / 12 / 8 / 8; press scales to 0.98. A column of three at the lg widget rung; the md rung folds them to a row of stacked pills. |
| Fill | A full-height band under the content, growing from the start edge to the value in the tone's vibrant fill colour. |
| Disc | 40 circle: the tone's pale disc with its deep duotone glyph. |
| Text | Label 11.5/500 at 0.85; figure 20/500; unit 13/400 at 0.8 beside it. |

## Behaviour

- Fill draw: 0 to value over 900ms, cubic-bezier(0.2, 0.7, 0.2, 1), staggered 90ms per pill. Off the
  motion scale, same reasoning as the day meter.
- The unit CENTRES against the figure instead of sharing its baseline: Arabic and Urdu drop real ink
  below the baseline and read as slipped beside a 20px figure. One rule, every script.
- Not connected: the figure becomes a quiet 16/500 Connect line in the tone's deep colour; the band
  stays empty; the pill leads to More.

## React Native contract

```tsx
type MetricTone = 'teal' | 'amber' | 'violet'

interface MetricPillProps {
  tone: MetricTone
  icon: IconName
  label: string
  value: string
  unit?: string
  fill: number             // 0..1
  connected?: boolean
  onPress: () => void
}
// Center-align the figure and unit Texts in a row - do not baseline them.
```

## Tokens

`--metric-teal/amber/violet` (each with `-fill`, `-disc`, `-ink`, `-icon`), `--metric-veil`,
`--radius-lg`, `--radius-pill`, `--space-4/8/12`, `--duration-quick`, `--ease`.
