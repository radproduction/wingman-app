---
type: Note
---
# Status pill

Where a meeting stands: go, wait, live, done, off. The live state carries the app's one "happening
right now" indicator - a breathing dot on the shared pulse beat. Live page: `/components/status-pill`.

- Radius pill, padding `--space-4`/`--space-8`, 11.5 at weight 600, leading dot on a `--space-4` gap.
- Pairs: go `--ok`/`--ok-tonal`; wait `--warn`/`--warn-tonal`; live `--tone-rose`/`--chip-rose`;
  done `--muted`/`--card-tonal`; off `--muted` on transparent with a 1px `--line-strong` ring.
- The live dot breathes on `:root`'s own pulse tokens - the same beat as the in-flight approval dot.
  Both reduced-motion layers stop it. Nothing else in the app is allowed to breathe.

```tsx
type MeetingStatus = 'go' | 'wait' | 'live' | 'done' | 'off'
interface StatusPillProps { status: MeetingStatus; label: string }
// 11.5/600, radius pill, padding [4, 8], dot gap 4.
// off's ring is a border natively; give the filled states a transparent twin
// of the same width or the pill grows when it switches.
// live's dot: withRepeat(withTiming(...)) on opacity only; killed under
// reduced motion.
```
