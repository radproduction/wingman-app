---
type: Note
---
# Bento tile

One module, one glance: chip and label on the top row, then what Wingman knows right now as the
tile's headline, the evidence muted underneath. Tapping it opens the module - a tile is a door, and
the module screen restates it as the hero. Live page: `/components/bento-tile`. Figma: `Bento Tile`.

## Anatomy

| Part | Spec |
|---|---|
| Tile | Home-surface fill, radius lg, hairline, padding `--space-16`. Start-aligned column at gap `--space-4`. |
| Head | sm chip and the 13/500 label, gap `--space-12`, then `--space-12` below. |
| Value | 18/400 / 1.15 - the headline. Regular weight on purpose: a reading, not a shout. |
| Sub | 12 / 1.35, muted. The evidence. |

## Behaviour

- The whole tile is the target; it navigates, never toggles. No transform on press.
- The module screen restates the tile as its hero - same chip, same words - so the push reads as a zoom.

## React Native contract

```tsx
interface BentoTileProps {
  icon: IconName
  tone: ChipTone
  title: string
  value: string            // what Wingman knows right now
  sub: string              // the evidence
  onPress: () => void
}

// Business's status cards (wg-card) are THIS SAME ANATOMY under another
// class, split in CSS only so Business does not drag Home's layout. Build
// ONE native component and use it in both grids - the tap into Business
// must read as a zoom into the same object. Never fork it.
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--radius-lg`, `--space-4/12/16`, `--chip-sm`, the chip
tone pair.
