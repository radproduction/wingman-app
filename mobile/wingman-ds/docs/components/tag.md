---
type: Note
---
# Tag

The badge on a card's head naming the feature that produced it - "Focus", "Wingman's Day". Never
pressable, never a filter, never a state. Live page: `/components/tag`.

- Radius pill, padding `--space-4` block / `--space-12` inline, 12/500, line box `--pill-line`.
- Lavender (`--chip-lavender` / `--tone-lavender`) by default; the sand pair exists only so two tags
  stacked in one feed do not echo each other.
- Not the six-tone palette: a tag names a feature, not an identity. Identities are the Tone pill.

```tsx
interface TagProps { label: string; tone?: 'lavender' | 'sand' }
// 12/500, lineHeight 12 * pillLine, radius pill, padding [4, 12].
```
