---
type: Note
---
# Tone label pill

A label carrying an identity in a chip tone: "overdue" in rose, "blocked" in sand. The chip palette
rather than a new one, because these are identities and identity is what chip tones are for; the
alert red stays reserved for the header's unread dot. Live page: `/components/tone-pill`.

- Radius pill, padding `--space-4` block / `--space-8` inline, 11/500, optional leading glyph on a
  `--space-4` gap.
- Ink rule: the `-text` variant of the tone where one exists (lavender, peach, sand) - small text on
  a pale pill runs a step deeper than the glyph beside it.
- The tone accompanies the word; it never replaces it.

```tsx
type ChipTone = 'blue' | 'lavender' | 'mint' | 'peach' | 'sand' | 'rose'
interface TonePillProps { label: string; tone: ChipTone; icon?: ReactNode }
// 11/500, lineHeight 11 * pillLine, radius pill, padding [4, 8], icon gap 4.
// Ground: theme.palette.*.chip<Tone>. Ink: the -text variant where one
// exists, else the tone itself.
```
