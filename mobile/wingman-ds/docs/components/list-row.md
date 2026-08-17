---
type: Note
---
# List row

The label row inside a grouped card: a 38 toned disc, a title with its support line, and the control
the row exists for on the end. The whole row is the label, so tapping anywhere reaches the control.
Live page: `/components/list-row`. Drawn in 2 app files.

## Anatomy

| Part | Spec |
|---|---|
| Row | Flex, centred, gap `--space-16`, padding `--space-16`. No surface: the group card behind it is the surface. |
| Disc | 38 circle on the chip recipe - the same disc Option Row leads with. |
| Text | Title 15/500; optional support line 12.5 muted, 4 below. |
| Control | The trailing control the row labels. The time input draws as a card-tonal pill: padding `--space-8` by `--space-16`, 15/500, radius pill. |
| Separator | Rows after the first carry a 1 line in the canvas colour, full width - no chip column here to protect with an inset. |

## Behaviour

- The row is a label: tapping anywhere opens or focuses the trailing control.
- Unchanged under compact density - these rows live in onboarding and short groups, not the long lists.

## React Native contract

```tsx
interface ListRowProps {
  icon: ReactNode
  tone?: ChipTone
  title: string
  support?: string
  control: ReactNode
}

// The web's disc borrows the onboarding glyph disc with an inline size
// override - that borrowing does not cross; it is the same 38 disc Option
// Row specifies. The time control is the browser's own picker behind a pill
// face - natively, the platform date-time picker opened from the row.
```

## Tokens

`--surface`, `--canvas`, `--card-tonal`, `--muted`, `--radius-pill`, `--space-4/8/16`, `--pill-line`,
the disc's chip tone pair.
