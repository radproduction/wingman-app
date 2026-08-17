---
type: Note
---
# Module row

The one row anatomy shared by all five module screens: who or what, the figure that matters, the
facts under it, and Wingman's own read a step quieter. Only the content varies per module. Live
page: `/components/module-row`. Drawn via `ModRow` in `ModuleScreen.tsx`.

## Anatomy

| Part | Spec |
|---|---|
| Card | Home-surface fill, radius lg, hairline. Padding `--row-pad-y` by `--space-16`, gap `--row-gap`. |
| Chip | The sm rung: toned glyph, letter (`--letter`, 15/500), or a drawn/photographed face. Top-aligned on rows that grow; single-statement lists centre it (`wg-row-list--center`). |
| Top line | Name `--fs-row`/500 and the figure (14) pushed apart, baseline-aligned. |
| Meta | `--fs-sub` / 1.4, muted, 4 above-gap. |
| Note | 12.5 / 1.45, muted. Wingman's read - one step quieter than the facts. |
| Approval | When the row holds a decision, the inline approval action renders under the text - the row's only pressable part. |

## Behaviour

- Not pressable. No press transform, ever; the state lives on the screen, the action in WhatsApp.
- `done` keeps its elevation: same surface, dimmed name (400, muted), muted value, chip at 0.72.
  A paid bill is still part of the list. (Read notices are the one settled state that recedes.)
- Compact density drops `--row-pad-y`/`--row-gap` to 8 and `--fs-row` to 13.5.

## React Native contract

```tsx
interface ModuleRowProps {
  tone: ChipTone
  icon?: IconName
  initial?: string         // letter chip, Email's sender language
  face?: boolean           // drawn portrait instead of the letter
  name: string
  value?: string
  meta?: string
  note?: string
  approval?: string
  done?: boolean
}

// Name and value are baseline-aligned on one line: keep both as direct Text
// children of the top line, or RN's baseline alignment quietly breaks.
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--row-pad-y`, `--row-gap`, `--fs-row`, `--fs-sub`,
`--radius-lg`, `--space-4/16`, `--chip-sm`, the chip tone pair.
