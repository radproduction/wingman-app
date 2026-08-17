---
type: Note
---
# Empty state

What a list shows when it has nothing to show: a calm card in the list's place - a toned chip, a
short statement, a line about what happens next. Never a blank panel, never an apology. Live page:
`/components/empty-state`. Drawn in 3 app files (Calendar, Approvals, Memory).

## Anatomy

| Part | Spec |
|---|---|
| Card | Home-surface fill, radius lg, hairline (`--card-line`). Centred column at gap `--space-4`, padding `--space-24` with `--space-32` at the foot. |
| Chip | The md rung, `--space-8` below-margin. The screen picks tone and glyph. |
| Title | 15/500. A statement of the state. |
| Body | 13 / 1.45, muted, measure capped at 30ch. |

## Behaviour

- Renders in place of the list it stands for, on the same panel ground. Never an overlay.
- Voice: first person, forward-looking - what Wingman does next, not what the user lacks.
- Not pressable. An action belongs to a Button below it, never to the card.

## React Native contract

```tsx
interface EmptyStateProps {
  icon: ReactNode         // inside a md chip
  tone: ChipTone
  title: string
  body: string
}

// The 30ch measure is a text-width cap, not a container width: derive a
// maxWidth from the body size (or fix ~240) and check it against the longest
// translation - Arabic and Hindi run wider than the English they translate.
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--radius-lg`, `--space-4/8/24/32`, the chip tone pair.
