---
type: Note
---
# Segmented

A small set of mutually exclusive options in a tonal trough, the active one filled with accent. Two
to four options; anything more is a list of Option Rows. Live page: `/components/segmented`.
Figma: `Segmented`.

## Anatomy

- **Trough**: `--card-tonal`, radius pill, padding `--space-4`, gap `--space-4`.
- **Option**: equal flex widths whatever the labels, radius pill, padding `--space-12`, 14/500,
  muted; the pill-nudge applies as everywhere text sits in a pill.
- **Active**: `--accent` fill, `--on-accent` label. The fill **swaps** between options - the app
  deliberately does not slide a pill between segments here.
- **Glyph form** (the mode picker): a leading 18 duotone glyph and the label as one flex unit on a
  `--space-8` gap, tinting with the label.

## Behaviour

- Single-select, controlled. One radio group for accessibility; each option carries checked state.
- Equal widths come from flex, not from measuring labels - three languages, one layout.

## React Native contract

```tsx
interface SegmentedProps<V extends string> {
  options: { value: V; label: string; icon?: ReactNode }[]  // 2..4
  value: V
  onChange: (v: V) => void
}
// The active state is a fill swap; adding a sliding pill during the port is a
// design change, not a porting decision.
```
