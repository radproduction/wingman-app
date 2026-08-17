---
type: Note
---
# Page Dots

The pager under the intro carousel. The active dot stretches into a short bar and takes the accent,
so position reads by shape as well as colour. Live page: `/components/page-dots`. Figma: `Page Dots`.

- Dot: 6x6, radius pill, `--track`, on a `--space-8` gap.
- Active: stretches to 18 wide, `--accent`. Width over `--duration-fast`, colour over
  `--duration-quick`, both `--ease`.
- The stretch is the point: the active page reads by shape, which survives every kind of colour
  vision.

```tsx
interface PageDotsProps { count: number; index: number; onPick?: (i: number) => void }
// The stretch is a real width change the row reflows around (scaleX would
// distort the pill's caps) - animate width itself; three dots is well inside
// the layout-animation budget.
```
