---
type: Note
---
# Inline text button

An action styled as text at Button size: the back-bar's "Edit", the "Resend code" inside a
verification note. Folded into the one-button system by [D-028] - same voice, no chrome. Live page:
`/components/text-button`.

- 15/500, `--accent-deep` - the Button label without the pill.
- Tap padding `--space-12`/`--space-8` standing alone; zero inside a note, where the sentence owns
  the line.
- Not interchangeable with the Inline link action (the smaller 13px trail on a row).
- Hit area 44 via hitSlop, especially in the inline form.

```tsx
interface TextButtonProps {
  label: string
  onPress: () => void
  inline?: boolean   // inside a running sentence: padding collapses to zero
}
// The inline form is a Text onPress span INSIDE the sentence's Text, not a
// View - a View would break the line-wrapping.
```
