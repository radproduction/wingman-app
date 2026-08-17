---
type: Note
---
# Inline link action

The small accent action that trails a row: "Manage connection", "Undo", "Details ›". One identity
that used to be three drifting lookalikes, consolidated by [D-028]. Live page:
`/components/inline-link`.

- 13/500, `--accent-deep`. An inline-flex row on a `--space-4` gap.
- Optional trailing chevron, 14 - it means onward, so it turns with the writing direction.
- `danger`: the calm `--tone-rose`, never the bright alert red - a deletion reads as deliberate,
  not an alarm ([D-009]).
- `end`: rides the trailing edge of the flex row it lives in.
- Never a screen's primary action - that is a Button. Hit area 44 via hitSlop.

```tsx
interface InlineLinkProps {
  label: string
  onPress: () => void
  chevron?: boolean
  danger?: boolean
  end?: boolean
}
```
