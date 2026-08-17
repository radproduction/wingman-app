---
type: Note
---
# State pill

Where a Daily Intelligence item stands. One closed vocabulary of six, so the same state always wears
the same colour everywhere it appears. Live page: `/components/state-pill`.

- Radius pill, padding `--space-4`/`--space-8`, 11 at weight 600, nowrap.
- Pairs (ink on ground): auto `--ok`/`--ok-tonal`; approved `--accent-deep`/`--accent-tonal`;
  recommended `--tone-lavender`/`--chip-lavender`; waiting `--warn`/`--warn-tonal`; insight
  `--tone-peach`/`--chip-peach`; not-done `--muted`/`--card-tonal`.
- A new state is a design decision, not a new colour pair at a call site.
- Not interchangeable with the Status pill (the meeting vocabulary).

```tsx
type IntelState = 'auto' | 'approved' | 'recommended' | 'waiting' | 'insight' | 'notDone'
interface StatePillProps { state: IntelState; label: string }
// 11/600, radius pill, padding [4, 8], nowrap, flex: none.
```
