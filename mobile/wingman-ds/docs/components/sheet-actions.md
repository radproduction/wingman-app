---
type: Note
---
# Sheet action list

The stacked actions at the foot of every sheet: full-width buttons in one column, the recommendation
first, the way out last. Three tiers - primary, quiet, warn - and never two primaries in one sheet.
Live page: `/components/sheet-actions`.

## Anatomy

| Part | Spec |
|---|---|
| Stack | A column at gap `--space-12`, set off from the content by a `--space-24` top margin. No button carries its own margin. |
| Primary | The default filled Button, full width. The recommendation - at most one per sheet. |
| Quiet | `--card-tonal` ground, ink text; presses to `--track`. A real option that is not the answer. |
| Warn | The sand surface (`--chip-sand`) with the `--warn` tone; presses to `--warn-tonal`. Destructive reads as routine and deliberate, never as an alarm ([D-009]). |

## Behaviour

- Order is meaning: recommendation first, alternatives under it, the way out last.
- Closing without choosing is the grabber's job, not a button's - "Cancel" appears only when
  cancelling is itself a decision.
- A sheet asks one thing. A second primary means it is two sheets.

## React Native contract

```tsx
interface SheetActionsProps {
  children: ReactNode      // full-width Buttons, recommendation first
}
```

## Tokens

`--card-tonal`, `--track`, `--chip-sand`, `--warn`, `--warn-tonal`, `--space-12/24`, plus the
Button's own tokens.
