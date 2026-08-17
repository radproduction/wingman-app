---
type: Note
---
# Caption

A small all-caps label above a control, for the times a section head would be too loud: one head can
own several controls and this names each one quietly. Live page: `/components/caption`.

- 11, Medium, +8% letter-spacing, uppercase, `--muted`, padding `--space-4` inline.
- The web pulls its control up under it with a negative `--space-8` margin; natively use a tight
  fixed gap on the caption+control column instead.
- One caption names exactly one control.
- Letter-spacing is removed on Arabic-script languages (it breaks joining).

```tsx
interface CaptionProps { children: string }
// 11/500, letterSpacing 11 * 0.08, uppercase, theme.palette.*.muted,
// paddingHorizontal 4.
```
