---
type: Note
---
# Widget row

The row a list widget draws: a two-line-max name, a one-line meta, and one trailing thing - a flag
pill, a completion tick, a time. Rows share the large widget's slack height so the card always ends
where its last row does. Live page: `/components/widget-row`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Flex at gap `--space-12`, block-padding `--space-8` (12 in a large widget); a `--line-soft` hairline between rows. |
| Name | `--fs-row`/500 / 1.25, clamped at two lines then ellipsis. Done: muted with a line-through. |
| Meta | `--fs-sub` muted, one line, ellipsised. |
| End slot | One trailing thing: a tone flag pill, a tick, or a time. |
| Tick | The 24 completion ring: inset 1.5 `--line-strong`; on, `--ok` fill with the on-accent check. |

## Behaviour

- In a large widget the list takes the cell's leftover height and rows share it - separators land on
  an even rhythm instead of slack pooling at the foot.
- Completing happens in the widget; the full draw ceremony belongs to the Tasks list.
- Flags use the chip palette (overdue and blocked are identities); the alert red stays reserved for
  the header's unread dot.

## React Native contract

```tsx
interface WidgetRowProps {
  name: string
  nameDone?: boolean
  meta?: string
  end?: ReactNode
  onPress?: () => void
}
```

## Tokens

`--line-soft`, `--line-strong`, `--ok`, `--on-accent`, `--muted`, `--fs-row`, `--fs-sub`,
`--radius-pill`, `--space-4/8/12`, `--duration-quick`, `--ease`, the chip tone pairs.
