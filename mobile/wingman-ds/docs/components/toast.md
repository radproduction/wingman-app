---
type: Note
---
# Toast

The app's way of saying "done" without stopping you: one dark slab floating above the tab bar, one
message at a time, gone in under three seconds. It arrives slower than it leaves, so landing reads
as deliberate and leaving never outstays the thing it announced. Live page: `/components/toast`.
Figma: `Toast`.

## Anatomy

| Part | Spec |
|---|---|
| Layer | Centred above the tab bar (`--tabbar-clearance` + 6); on tabless screens it drops to the home indicator + 16. The layer is inert to taps. |
| Slab | `--toast-bg` - the one inverted surface in the app - with `--on-ink` text at 13.5 / 1.4. Radius lg, padding 12 / 16, `--shadow-toast`. |
| Icon | Leads, nudged 4 down onto the first line. Caller picks it; check is the default. |
| Action | At most one word (Undo): 13.5/600 in a pale canvas tone (the accent does not read on the dark slab). Never a second CTA. |

## Behaviour

- In: rises `--toast-distance` (16), scales from 0.97, un-blurs from 2, over `--toast-open` (350ms).
- Out: the same road backwards over `--toast-close` (250ms) - faster on purpose.
- One at a time: a new toast replaces the current one; nothing queues. Default life 2600ms.
- When not to: a state change the screen already shows needs no toast.
- Reduced motion: place and remove; the life span is unchanged.

## React Native contract

```tsx
toast(text: string, icon?: IconName, ms?: number, action?: {
  label: string
  onAct: () => void
})
// A module function with a single host, not a context - port that shape.
// Announce politely for accessibility. Dropping the blur on cheap devices
// is acceptable; reordering the asymmetric timings is not.
```

## Tokens

`--toast-bg`, `--on-ink`, `--shadow-toast`, `--radius-lg`, `--space-4/8/12/16`, `--toast-open`,
`--toast-close`, `--toast-distance`, `--toast-scale`, `--toast-blur`, `--toast-ease`,
`--tabbar-clearance`, `--nav-bottom`.
