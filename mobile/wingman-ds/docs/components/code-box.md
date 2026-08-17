---
type: Note
---
# Code Box

The verification-code entry: one box per digit, focus walking forward as you type, backspace
walking back, paste filling the row. Six digits in the app. Live page: `/components/code-box`.
Figma: `Code Box`.

## Anatomy

- Row: flex, gap `--space-8`; each box flex 1 at aspect ratio 0.86 (taller than wide).
- Box: surface fill, radius lg, centred 24/500 digit, `--accent` caret, its own 3px `--focus-ring`
  when focused.

## Behaviour

- A digit advances focus; backspace on an empty box moves back and clears the previous.
- Pasting anywhere fills the row from its first box.
- Numeric keyboard; each box labelled "Digit n".
- The primary action gates on the row being **complete** - the one place the empty-gates rule
  yields to completeness.

## React Native contract

```tsx
interface CodeBoxProps {
  length: number                 // 6 in the app
  value: string
  onChange: (code: string) => void
}
// Take the hidden-input option: one TextInput holding the whole code with the
// boxes as a visual layer makes paste and OS autofill (textContentType
// 'oneTimeCode' / autofill 'sms-otp') work for free. The contract is the look
// and the interaction, not the DOM shape.
```
