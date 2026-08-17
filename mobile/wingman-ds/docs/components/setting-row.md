---
type: Note
---
# Setting row

The field row of every settings screen: rows share one white card with hairline separators, so
settings read as a set of fields rather than free-standing cards. Each row leads with its own 32
tinted chip - what makes a long column scannable by glyph. Live page: `/components/setting-row`.
Drawn in 8 app files (`SetRow` in `SubScreen.tsx`).

## Anatomy

| Part | Spec |
|---|---|
| List | One home-surface card (`wg-set-list`), radius lg, overflow hidden, hairline. Rows carry no surface of their own. |
| Row | Padding `--set-pad-y` (12; 8 compact) by `--space-16`, gap `--space-12`. Active ground `--panel-inner`, no transform. |
| Chip | The xs rung (32) with a 17 duotone glyph - one step under a free-standing row's 40. |
| Name | `--fs-row`, allowed to shrink and wrap: translated labels cannot be measured in advance, and two lines beat a truncated question. |
| Value | 13.5 muted, end-aligned, single line, ellipsised. |
| Chevron | 18, ink. Dropped on in-place rows - a chevron promises a screen. |
| Separator | 1 hairline (`--line`) between rows, starting at the label: inset-inline-start = 16 + 32 + 12. |

## Behaviour

- Press flashes `--panel-inner` over the quick duration. No scale, no lift.
- Warn rows take the rose family quietly: tinted chip, mid-tone name. Confirmation belongs to the
  sheet the row opens.
- Compact density drops `--set-pad-y` to 8 and `--fs-row` to 13.5; the chip rung is unchanged.

## React Native contract

```tsx
interface SettingRowProps {
  icon: IconName
  tone: ChipTone
  name: string
  value?: string
  onPress?: () => void
  inPlace?: boolean       // drops the chevron
  warn?: boolean          // rose name + chip, stated calmly
}

// The separator inset is the row's own arithmetic (padding + chip + gap =
// 60): derive it, never restate it. The list card needs overflow: 'hidden'
// or the end rows' press flash paints square corners.
```

## Tokens

`--home-surface`, `--card-line`, `--panel-inner`, `--line`, `--muted`, `--ink`, `--tone-rose`,
`--chip-xs`, `--set-pad-y`, `--fs-row`, `--radius-lg`, `--space-12/16`, `--duration-quick`, `--ease`.
