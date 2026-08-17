---
type: Note
---
# Sparkline

Seven bars, 34 pixels tall, one accented: the smallest chart the app draws. A glance at the week's
shape beside a health reading - no axis, no labels, no tooltip, because the numbers it summarises
are already on the rows around it. Live page: `/components/sparkline`.

## Anatomy

| Part | Spec |
|---|---|
| Row | A 34-high flex row at gap `--space-4`, bottom-aligned, 12 above whatever it annotates. |
| Bars | Equal flex, `--radius-xs`, height proportional to the value. Ground `--line-strong`. |
| The good bar | One bar takes the `--accent` - a pointer, not a series. |

## Behaviour

- Static: no draw-in, no interaction. The day card's meter and the metric fills own the
  animated-figure language.
- Health's week strip (bigger bars, dashed goal line) is the grown-up sibling and stays
  screen-local.

## React Native contract

```tsx
interface SparklineProps {
  values: number[]         // normalised 0..1
  goodIndex?: number
}
```

## Tokens

`--line-strong`, `--accent`, `--radius-xs`, `--space-4/12`.
