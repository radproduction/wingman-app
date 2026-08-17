---
type: Note
---
# App icon picker

Four faces of the same wing: the icon the app wears on the home screen. The tile is the icon itself
at its own 22% corner, with the shared ring recipe and mark - the theme picker's anatomy one row
down, so the two read as one centred column. Live page: `/components/app-icon-picker`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Four faces capped at 66, centred on the theme row's `--pick-gap`: four faces plus three gaps equal three theme tiles plus two, so the pickers align as one column. |
| Art | The icon at radius 22% - its own corner, so the tile IS the icon - with the outer `--frame-line` hairline that holds on pale and near-black faces alike. |
| Selected ring | The theme frames' recipe exactly: hairline, 2 of panel, accent at 5. |
| Mark + name | The shared mark at 18, the 12.5/500 name. |

## Behaviour

- Press scales the art to 0.94; the ring answers over the quick duration.
- On the web the tab favicon rewrites at runtime; natively it is the actual home-screen icon.
- Every face draws the same W+Star mark; the faces differ only in ground and wing treatment.

## React Native contract

```tsx
interface AppIconPickerProps {
  value: AppIconKey        // 'midnight' | 'paper' | 'blue' | 'aurora'
  onChange: (next: AppIconKey) => void
}
// Alternate app icons come with platform ceremony: iOS shows a system
// alert on first change; Android needs activity aliases. Use the Expo
// module, warn in the support copy, and never fake it in-app - the
// promise of this picker is the home screen.
```

## Tokens

`--frame-line`, `--panel`, `--accent`, `--track`, `--on-accent`, `--pick-gap`, `--radius-pill`,
`--space-4/8`, `--duration-quick`, `--ease`.
