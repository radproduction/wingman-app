---
type: Note
---
# Footnote

The small print under a group: a data promise, a version line, a member-since. Muted, centred, and
reused on 23 screens precisely because it is this boring. Live page: `/components/footnote`.

- 12, Regular, line-height 1.5, `--muted`, centred. Margin `--space-4` block / `--space-8` inline.
- No icon slot, no tone, no emphasis. A footnote that needs more is a Notice.
- Wraps freely; it is a paragraph, not a label.

```tsx
interface FootnoteProps { children: ReactNode }
// Text: 12/400, lineHeight 18, color theme.palette.*.muted, textAlign center,
// margin [4, 8]. That is the whole component.
```
