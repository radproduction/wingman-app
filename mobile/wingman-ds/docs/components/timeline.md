---
type: Note
---
# Timeline

What Wingman did today, in order: a dot per event on a hairline rail, coloured by kind - decision,
completion, recommendation, approval, insight. The receipt that makes an autonomous assistant
auditable at a glance. Live page: `/components/timeline`.

## Anatomy

| Part | Spec |
|---|---|
| List | Plain, markerless; items at `--space-16` below-padding, none on the last. |
| Rail | A 12-wide column: the 12 dot ringed 3 in the surface (the line never touches it), and a 2-wide `--line` segment running to the next item's dot. |
| Dot kinds | Decision `--accent`, completed `--ok-soft`, recommendation `--tone-lavender`, approval `--warn`, insight `--tone-peach` - the same meanings the State pill speaks in words. |
| Entry | The 12/600 muted time in tabular numerals, the 14 / 1.45 line under it. |

## Behaviour

- Chronological, newest last - the day reads downward like a ledger.
- The colours classify, never alarm: an approval's amber dot is "this involved you".
- The dot kinds and the State pill share one vocabulary.

## React Native contract

```tsx
type TimelineKind = 'decision' | 'completed' | 'recommendation'
  | 'approval' | 'insight'

interface TimelineItemProps {
  kind: TimelineKind
  at: string               // tabular numerals
  text: string
}
// The rail segment belongs to each ITEM (absent on the last), not to the
// list - that is what lets the ledger virtualise in a plain FlatList.
```

## Tokens

`--accent`, `--ok-soft`, `--tone-lavender`, `--warn`, `--tone-peach`, `--line`, `--home-surface`,
`--muted`, `--radius-pill`, `--space-4/16`.
