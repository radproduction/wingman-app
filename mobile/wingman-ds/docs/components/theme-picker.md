---
type: Note
---
# Theme picker

Three little phones - light, dark, and one split down the middle for system - each a drawing of
Home, not a live render. Selection is the accent ring around the phone, standing off the frame by a
gap of the panel's own colour. Live page: `/components/theme-picker`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Three tiles capped at 96 wide, centred, at the shared `--pick-gap`. |
| Frame | Aspect 100/160, radius md, an OUTER 1 `--frame-line` hairline: inset it vanishes on the dark face; missing, the light face melts into the panel. |
| Face | A drawing of Home on its own mock palette - a drawing of dark, deliberately not the dark theme's tokens. System clips the dark drawing over the light at 50%. |
| Selected ring | Hairline, then 2 of the panel colour, then the accent at 5 - the ring reads as around the phone, never drawn on it. The name turns `--accent-deep`. |
| Mark + name | The option rows' selection mark one size down (20), and the 14/500 name. |

## Behaviour

- Picking re-themes the app immediately; the picker itself is the preview's proof.
- System: one phone, two futures - the split face says "follows the phone" without copy.
- The faces are mocks on their own palette, stable while the real themes evolve.

## React Native contract

```tsx
type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemePickerProps {
  value: ThemeChoice
  onChange: (next: ThemeChoice) => void
}
```

## Tokens

`--frame-line`, `--panel`, `--accent`, `--accent-deep`, `--track`, `--on-accent`, `--pick-gap`,
`--radius-md`, `--radius-pill`, `--space-4/8`, `--duration-quick`, `--ease`.
