---
type: Note
---
# Gallery

The list you add widgets from: one tonal row per available widget, its size choice made inline
before you commit, and a small add disc on the end. Lives inside the dashboard's Add-a-widget sheet,
so its rows are tonal where a list on the panel would be white. Live page: `/components/gallery`.

## Anatomy

| Part | Spec |
|---|---|
| List | A column at gap `--space-8`, inside the bottom sheet. |
| Row | `--panel-inner` fill (tonal: a white row inside the white sheet would vanish), radius lg, padding `--space-12`, gap `--space-12`, start-aligned. |
| Chip | The sm rung. |
| Text | Name 15/500, description 12.5 / 1.35 muted, gap `--space-4`. |
| Size pills | 11/500 micro pills, padding `--space-4` by `--space-8`: `--card-tonal-cool` off, accent on. One size gets the fixed form - transparent with an inset `--line-strong` ring - a label, never a choice. |
| Add | A 32 disc, `--accent-tonal` ground with `--accent-deep` glyph. Presses to scale 0.9. |

## Behaviour

- Pick then add: the pills set a local choice; nothing happens until the add disc commits it.
- One rung still says which, as a ringed label that never looks pressable.
- When every widget is placed, the sheet says so in a sentence; the gallery renders nothing.

## React Native contract

```tsx
interface GalleryRowProps {
  icon: IconName
  tone: ChipTone
  name: string
  desc: string
  sizes: WidgetSize[]      // >1 a choice; exactly 1 a FIXED label pill
  onAdd: (size: WidgetSize) => void
}

// The size pill is quietly a shared primitive: the capture sheet's owner,
// due and priority rows and the instant meeting's people picker all borrow
// wg-gal__size outside any gallery. Ship SizePill as its own component
// (on / off / fixed) and make the gallery one of its callers.
```

## Tokens

`--panel-inner`, `--card-tonal-cool`, `--accent`, `--on-accent`, `--accent-tonal`, `--accent-deep`,
`--line-strong`, `--muted`, `--radius-lg`, `--radius-pill`, `--space-4/8/12`, `--duration-quick`,
`--ease`, the chip tone pair.
