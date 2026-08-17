---
type: Note
---
# Chip

The circular identity holder that leads a row, a card or a hero: who or what this item is, told by
tone and glyph. Six tones, four sizes, and both lists are closed. Live page: `/components/chip`.
Drawn in 32 app files. Figma: the `Chip` set (7 tones x 4 sizes).

## Anatomy

| Part | Spec |
|---|---|
| Disc | A circle at one of the four rungs: 32 / 40 / 48 / 52 (`--chip-xs..lg`). The radius is diameter / 2 - a ratio, deliberately off the radius scale. |
| Glyph | Centred, sized by the rung (18 / 22 / 24 / 26), duotone, painted in the same hue as the ground at a mid tone - never the deepest shade ([D-005]). |
| Tones | blue, lavender, mint, peach, sand, rose. The sixth exists because a heart is red ([D-019]). |
| Face and brand chips | A chip may hold a portrait or a connector mark instead of a glyph; those paint themselves and the chip stays untinted. |

## Behaviour

- Compact density folds the `sm` rung to `xs`, icon included - in the theme, never at call sites.
- A chip never changes on select; the row around it carries the selected state.
- The recipe (pale ground, mid-tone glyph) holds in both themes.

## React Native contract

```tsx
type ChipTone = 'blue' | 'lavender' | 'mint' | 'peach' | 'sand' | 'rose'
type ChipSize = 'xs' | 'sm' | 'md' | 'lg'   // 32 / 40 / 48 / 52, icon 18 / 22 / 24 / 26

interface ChipProps {
  size?: ChipSize        // default 'sm', the workhorse rung
  tone?: ChipTone        // pale ground + same-hue MID-tone glyph; omit for a
                         // face or brand chip, which paints itself
  children: ReactNode    // the glyph. The chip sizes it: theme.chipIcon[size]
}

// borderRadius = diameter / 2, computed - never a hardcoded number.
// Invariants that must survive the port:
//   - exactly four diameters. Never a fifth, never a raw number.
//   - the glyph on a tinted chip is the same hue at a MID tone
//     (theme.palette.*.tone<Tone>), never the deepest shade. [D-005]
//   - compact density folds sm -> xs IN THE THEME, so a component asks for
//     the rung and never learns which density it is in.
// A native Chip that accepts a numeric size prop has already broken all three.
```

## Tokens

`--chip-xs/sm/md/lg`, `--chip-icon-xs/sm/md/lg`, `--chip-blue..rose`, `--tone-blue..rose`.
