---
type: Note
---
# Option Row

The choice card. One anatomy for single and multi select, for onboarding questions and settings
alike; the list around it decides the semantics. Selection is an outer accent ring, never a fill -
and the switch variant drops the ring entirely, because its Switch already tells the state. Live
page: `/components/option-row`. Drawn in 14 app files. Figma: `Option Row`.

## Anatomy

| Part | Spec |
|---|---|
| Card | Surface fill, radius lg, padding `--space-16`, hairline (`--card-line`). Rows stack in a column at gap `--space-8`. |
| Disc | 38 circle, card-tonal ground with an ink glyph; a per-item tone (the skills list) tints it to the chip recipe, unchanged on select. A switch row may omit it. |
| Flag | The Language rows lead with a 30 circular country flag instead, ringed inset 1 in `--line-strong`. |
| Text | Title 15/500; optional support line 13 muted, 4 below. The language rows step the title to 17 in their own script, line height 1.45. |
| Mark | 22 circle. Unselected: inset 2 track ring. Selected: accent fill, on-accent check. The switch variant replaces it with the Switch. |
| Selected ring | An outer 2 accent ring around the whole card, plus the title in accent-deep. Select rows only. |

## Behaviour

- Ring, deep title and filled mark arrive together over the quick duration. The disc never changes.
- Switch variant (`--switch`): the Switch carries the state, so the ring and deep title stand down -
  a settings list with everything on must not read as a wall of selection. The whole row is still
  the press target.
- Single and multi select are the same row; the list owns the semantics and the accessibility state.
- Onboarding option rows deliberately ignore compact density: a flow you walk once, not a list you live in.

## React Native contract

```tsx
interface OptionRowProps {
  title: string
  support?: string
  icon?: ReactNode             // leading 38 disc; card-tonal unless toned
  iconTone?: ChipTone
  flag?: ImageSource           // 30 circular flag instead of the disc
  selected: boolean
  onPress: () => void
  variant?: 'select' | 'switch'
}

// Selected is an OUTER 2 accent ring; natively a border with a transparent
// twin on the unselected card, or the layout shifts on select. The mark's
// inset track ring is also a border with the same trick. The whole row is
// one Pressable; neither the mark nor the Switch is ever its own target.
```

## Tokens

`--surface`, `--card-tonal`, `--card-line`, `--ink`, `--muted`, `--accent`, `--accent-deep`,
`--on-accent`, `--track`, `--line-strong`, `--radius-lg`, `--radius-pill`, `--space-4/8/16`,
`--duration-quick`, `--ease`, the chip tone pairs.
