---
type: Note
---
# Search field

The flat field that sits above a list: glyph-led search on Meetings, and - same anatomy, no glyph -
the live meeting's note composer, with an inline Add action on the end. List furniture, deliberately
quieter than the form Field. Live page: `/components/search-field`. Drawn in 2 app files.

## Anatomy

| Part | Spec |
|---|---|
| Field | Home-surface fill, radius md - not the Field pill: this is list furniture, not a form step. Padding `--space-12` by `--space-16`, gap `--space-12`. |
| Glyph | The 18 search glyph, muted. Omitted when the field composes rather than searches. |
| Input | 14.5 ink on a transparent ground, placeholder muted, app font inherited. |
| Action | Optionally a trailing inline link ("Add"), disabled while the field is empty. |

## Behaviour

- No focus ring - it lives in a list, not a form. The caret and the keyboard are the state.
- Search filters the list live on every keystroke; there is no submit.
- The composer's action is gated on content; Enter commits the same way.

## React Native contract

```tsx
interface SearchFieldProps {
  value: string
  onChange: (next: string) => void
  placeholder: string
  leadingIcon?: ReactNode
  action?: ReactNode       // trailing inline text action, gated on content
}

// Radius md, not the pill, and no focus ring - both deliberate, both easy
// to "correct" into Field's anatomy by accident. A form input is Field;
// this exists so a list's search does not dress like a form step.
```

## Tokens

`--home-surface`, `--ink`, `--muted`, `--radius-md`, `--space-12/16`.
