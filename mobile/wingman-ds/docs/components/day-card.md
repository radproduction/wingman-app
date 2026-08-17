---
type: Note
---
# Today's Snapshot card

Home's read of the whole day in one card: what today is, how many things need you, and a
sixteen-tick meter of the day being closed out. Its sun turns once every 24 seconds - the one
ambient motion in the app. Live page: `/components/day-card`. Figma: `Day Card`.

## Anatomy

| Part | Spec |
|---|---|
| Card | The day tint (`--day-bg` / `--day-ink`) - its own hue, not one of the six chip tones. Radius lg, padding 16, overflow hidden; press scales to 0.98. |
| Top row | The sun chip (`--day-disc` ground, `--day-strong` glyph) and a chevron at 0.45 in the card's own colour - never grey. |
| Readout | 13/500 label at 0.8, then the 19/500 figure - "{n} need you" stays one translatable string, never a split numeral ([D-003]). |
| Foot band | Full-bleed (`--day-foot`), lifting rather than darkening in both themes - the split between "what today is" and "how it is going" is structural. |
| Meter | Sixteen discrete ticks, fixed `--space-4` gaps, ticks flex - a narrower card thins them, never drops one. Two identical rows; the lit row clipped over the unlit. |

## Behaviour

- Meter draw: the clip opens across the row over 900ms with cubic-bezier(0.2, 0.7, 0.2, 1); each
  tick comes up whole as it passes. Deliberately off the motion scale: a figure drawing itself is
  not interface motion.
- The sun: one turn per `--sun-turn` (24s), linear (eased rotation stutters where a loop closes),
  forever - ambient, noticed only if you look.
- Reduced motion: the sun stills; the meter places.

## React Native contract

```tsx
interface DayCardProps {
  needYou: number
  handled: number
  total: number
  onPress: () => void
}
// The tick draw is ONE animated clip over a pre-laid lit row, not sixteen
// delayed animations - port it that way and the stagger costs nothing.
```

## Tokens

`--day-bg`, `--day-ink`, `--day-disc`, `--day-strong`, `--day-foot`, `--day-track`, `--sun-turn`,
`--ease-linear`, `--radius-lg`, `--radius-pill`, `--space-4/8/12/16`, `--duration-quick`, `--ease`.
