---
type: Note
---
# Field

The text input: a pill-shaped surface hosting the platform's own input, with an optional leading
select (the phone field's country code). Live page: `/components/field`. Figma: `Field`.

## Anatomy

- **Pill**: surface fill, radius pill, padding `--space-8`/`--space-16`, min-height 58, inner gap
  `--space-12`. Sides match the 16 inner padding of option and setting rows, so field content lines
  up with every other step.
- **Input**: the platform input, bare - no border, no background, text 17 (title/lg: a field is
  something you read back).
- **Leading select**: optional (the country code): card-tonal ground, radius pill, padding
  `--space-12`, 15/500.
- **Focus**: a 3px `--focus-ring` halo around the whole field, driven by focus-within. The pill
  carries the ring, never the bare input.

## Behaviour

- A screen that exists to be typed into focuses its first field; one field per screen in a flow.
- The primary action gates on **empty**, never on valid, so an error state stays reachable.
- Native pickers over custom wheels; the keyboard type is set per field (`inputmode` on web,
  `keyboardType` natively) - the right keyboard is part of the design.

## React Native contract

```tsx
interface FieldProps {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: KeyboardTypeOptions
  leading?: ReactNode
  autoFocus?: boolean
}
// The native Field tracks focus itself (onFocus/onBlur) and paints the ring
// on the container - a TextInput's own focus styling cannot reach its parent.
```
