---
type: Note
---
# Widget cell

The unit the dashboard is laid out in: a white card the grid places at one of three rungs -
half-width, full-width, or full-width-and-two-rows for the one that holds a list. A small widget is
a single glance and a single target. Live page: `/components/widget-cell`.

## Anatomy

| Part | Spec |
|---|---|
| Grid | Two columns at gap `--space-8`, rows at least one `--wgt-unit` and growing to content, packed DENSE - a lone small widget's hole is backfilled by the next small one. |
| Cell | Home-surface, radius lg, hairline, padding `--space-16`. sm spans one column; md spans both; lg spans both and two row units. |
| Bare cell | Widgets that paint their own card (insight, snapshot, commute) get no second card; the edit ring still shows. |
| Head | xs chip (17 glyph), 13/500 ellipsised title, optional trailing end slot (a count, "View all") at 12 muted. |
| Value + sub | One 26/400 number, a 12.5 muted support line 4 below. |

## Behaviour

- A small widget is one button filling the card; press scales to 0.985.
- Dense packing can only ever move a small widget up beside another - the behaviour the canvas wants.
- An empty widget is an invitation in a sentence, never a blank box.

## React Native contract

```tsx
interface WidgetCellProps {
  size: 'sm' | 'md' | 'lg'
  bare?: boolean
  children: ReactNode
}
// The dense backfill is CSS-grid behaviour a naive flex port silently
// loses: re-order small widgets into holes yourself, or blank cells
// appear that the web never shows.
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--wgt-unit`, `--radius-lg`, `--space-4/8/12/16`,
`--chip-xs`, `--duration-quick`, `--ease`.
