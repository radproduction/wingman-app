---
type: Note
---
# Card hairline

A treatment, not a component: the one sanctioned line in a system that separates by tone ([D-031]).
A white card or row sitting on the panel ground gets a 1px `--card-line` stroke so its edge reads
against the low-contrast surface - a soft line in light, a faint lift on charcoal in dark. Live
page: `/components/card-line`.

- Only the stroke is shared. Fill, radius and padding stay on each card, because they vary.
- Receded states (settled, read, past) opt out, so the stroke never doubles an outline they carry.
- Not a divider, not a section rule, not a second border weight. One line, one job.

## The rule that matters most for React Native

The app has a card *treatment* worn by forty-plus blocks, **not a Card component** everything nests
inside. Do not build a `<Card>` wrapper - it invents a boundary the design does not have, and every
screen built through it drifts. Ship a style constant and spread it:

```tsx
const cardLine = { borderWidth: 1, borderColor: palette.cardLine }
```
