---
type: Note
---
# Icon

One library, one style, one closed list. Every glyph is Hugeicons drawn duotone - a soft fill at
~0.4 opacity under a 1.5-weight stroke, both painted from **one colour** - and the 51 vendored names
are the whole vocabulary. Live page: `/components/icon`. Drawn in 60 app files.

## Rules

- Exactly four sizes, paired to the chip rungs: 18 / 22 / 24 / 26. An icon is sized by the rung it
  sits in, never by the call site. (Buttons: 18, or 14 on the small pill - a documented exception.)
- On a tinted chip the glyph is the same hue at a MID tone ([D-005]), never the deepest shade.
- Decorative by default; a meaningful icon is labelled by its containing component.
- A chevron means onward/back, not right/left - it turns with the writing direction.
- Reuse before adding: a near-match in the set beats a new glyph meaning the same thing.

## React Native contract

The kit's `icons/duotone.ts` is the source: dependency-free SVG element data, one export per glyph.

```tsx
type IconName = /* closed union generated from the glyph module's exports */

interface IconProps {
  name: IconName
  size: number             // ALWAYS theme.chipIcon[rung] (18/22/24/26)
  color?: string           // ONE colour; both duotone layers derive from it
}

// - duotone is two layers of the same hue: the fill layer carries its own
//   opacity in the glyph data; paint stroke AND fill from 'color'. Never
//   accept a second colour prop.
// - viewBox is 24x24 for every glyph; scale by 'size'.
// - hidden from assistive tech by default; the containing component labels.
```
