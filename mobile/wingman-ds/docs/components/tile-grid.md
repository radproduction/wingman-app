---
type: Note
---
# Tile grid

Two equal columns at gap 8, and nothing else. Holds Home's Watching-for-you tiles and Business's
status cards; it owns the rhythm and stays out of the ink. Live page: `/components/tile-grid`.
Drawn in 3 app files.

## Anatomy

| Part | Spec |
|---|---|
| Grid | `grid-template-columns: 1fr 1fr`, gap `--space-8`. No surface, no padding. |
| Cells | Bento tiles, or Business's status cards - the same anatomy under another class. |

## Behaviour

- Wraps to new rows; never a horizontal scroll.
- The dashboard sizes it (four tiles on md, six on lg); the grid itself does not care.

## React Native contract

```tsx
interface TileGridProps {
  children: ReactNode
}
// flexDirection row + flexWrap, each tile at (100% - 8) / 2, or a
// two-column list. Never a horizontal pan.
```

## Tokens

`--space-8`.
