---
type: Note
---
# Meeting row

A meeting in the Business list: who it is with, when, the one-line facts, and the shared status
vocabulary in its foot - prepared, waiting, live, done. A cancelled meeting stays visible, struck
and dimmed. Live page: `/components/meeting-row`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Home-surface, radius lg, hairline, padding `--row-pad-y` by `--space-16`, gap `--row-gap`, top-aligned; press scales to 0.99. |
| Chip | The sm rung: the counterpart's letter or face, toned. |
| Top line | Name 15/500 (-0.01em) and the 12.5 muted time, baseline-justified apart. |
| Meta | 12.5 muted: duration, medium, attendance - one line. |
| Foot | The Status pill (its own primitive: go / wait / live / done / off), 4 above. |

## Behaviour

- Cancelled: the row dims to 0.6 and the name strikes through; it stays as visible history.
- Live: the status pill's rose form carries the breathing dot on the pulse tokens.
- Press opens the meeting detail.

## React Native contract

```tsx
interface MeetingRowProps {
  tone: ChipTone
  initial?: string
  face?: boolean
  name: string
  time: string
  meta?: string
  status?: MeetingStatus
  cancelled?: boolean
  onPress: () => void
}
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--row-pad-y`, `--row-gap`, `--radius-lg`,
`--space-4/12/16`, `--chip-sm`, the chip tone pair, the Status pill tokens.
