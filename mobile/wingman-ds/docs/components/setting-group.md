---
type: Note
---
# Setting group

The card that groups label rows into one block: the schedule card on onboarding, quiet hours in
Permissions. It gives its rows one surface and one radius - everything else belongs to the rows.
Live page: `/components/setting-group`. Drawn in 2 app files.

## Anatomy

| Part | Spec |
|---|---|
| Card | Surface fill, radius lg, overflow hidden, hairline (`--card-line`). No padding, no gap: the rows own their spacing. |
| Rows | List rows, stacked flush; each pair separated by the row's own canvas-colour line. |

## Behaviour

- Not the settings screens' `wg-set-list`: same idea, different rows. This card holds label rows
  with in-place controls; that list holds navigation and value rows. Do not merge them.
- `overflow: hidden` is load-bearing: it clips the end rows to the card's radius.

## React Native contract

```tsx
interface SettingGroupProps {
  children: ReactNode     // ListRows
}
// One card, radius lg, overflow hidden. Sets NO padding and NO gap.
```

## Tokens

`--surface`, `--card-line`, `--radius-lg`.
