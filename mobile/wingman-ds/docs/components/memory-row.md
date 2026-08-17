---
type: Note
---
# Memory row

One fact Wingman holds, and - always - where it came from. The provenance line is the row's reason
to exist: memory you cannot trace is memory you cannot argue with, and every fact can be corrected
or forgotten from the row itself. Live page: `/components/memory-row`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Home-surface, radius lg, hairline, padding `--space-12` by `--space-16`, gap `--space-12`, top-aligned; press scales to 0.99. |
| Chip | The xs rung, nudged 4 down onto the first text line. |
| Fact | 14.5 / 1.4 in plain words, with an optional 14/500 value baseline-justified on the end. |
| Source | 12.5 muted, 4 below: "You told me, during onboarding". Never empty. |
| Action | A trailing 17 glyph - the row opens editing or forgetting. |

## Behaviour

- Every fact names its source; an inferred fact says so, and from what.
- Forgetting is immediate and confirmed by the list visibly shrinking.
- A cleared memory shows the Empty state.

## React Native contract

```tsx
interface MemoryRowProps {
  icon?: IconName
  tone?: ChipTone
  text: string
  value?: string
  source: string           // never omitted
  action: IconName
  onPress: () => void
}
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--radius-lg`, `--space-4/12/16`, `--chip-xs`,
`--duration-quick`, `--ease`, the chip tone pair.
