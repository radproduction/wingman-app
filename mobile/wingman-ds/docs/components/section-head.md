---
type: Note
---
# Section heading

The heading that opens a group of cards or rows on a panel ("Your day so far"). Larger and darker
than everything under it, and that is its entire job. Live page: `/components/section-head`.

- 21, Medium, -1% tracking, `--ink`. Margin `--space-16` above, `--space-8` sides and below.
- Medium (500) is the system's only emphasis weight. Never bold.
- The gap above a section head is the panel column rhythm ([D-030]): one `--space-16` step.
- When a head would be too loud, use a Caption instead.

```tsx
interface SectionHeadingProps { children: string }
// 21/500, letterSpacing 21 * -0.01, theme.palette.*.ink, margin [16, 8, 8].
```
