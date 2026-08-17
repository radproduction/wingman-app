---
type: Note
---
# Event card

The agenda row: a slim time gutter beside a white event card. Past events go see-through, the next
one up takes an accent wash and grows a prep footer - the agenda tells you where you are in the day
by how the cards are dressed. Live page: `/components/event-card`.

## Anatomy

| Part | Spec |
|---|---|
| Row | A 44 time gutter and the card, gap `--space-12`; the agenda stacks at gap `--space-8`. |
| Gutter | End-aligned: 14/500 time over its 10.5 muted meridiem. |
| Card | Home-surface, radius lg, hairline, padding `--row-pad-y` by `--space-12`; press scales to 0.99. Title `--fs-row`/500, meta 12.5 muted. |
| Attendees | Stacked 24 discs: 10/500 initials on the lavender recipe, ringed 2 in the surface, overlapping by 8; "+n" takes `--card-tonal`/muted. |
| Past | The whole row at 0.5; the card trades its fill for an inset `--card-tonal` outline - done is see-through, not deleted. |
| Next | The card on `--accent-tonal`, gutter time in `--accent-deep`, and the prep footer above an `--accent-line` hairline with a surface-pill action on its end. |

## Behaviour

- The card opens the event; the prep footer's pill is its own target inside it.
- Exactly one event wears the accent wash. The now divider between past and upcoming belongs to the
  screen; "next" is data-driven - the card never reads the clock itself.
- An empty day renders the Empty state card in the agenda's place.

## React Native contract

```tsx
interface EventCardProps {
  time: string
  meridiem?: string
  title: string
  meta?: string
  attendees?: string[]
  flag?: string
  state?: 'past' | 'next'
  prep?: { label: string; action: string; onAct: () => void }
  onPress: () => void
}
// The gutter is part of the row, not an absolute rail - the agenda
// virtualises row by row in a plain list.
```

## Tokens

`--home-surface`, `--card-line`, `--card-tonal`, `--accent-tonal`, `--accent-line`,
`--accent-deep`, `--surface`, `--chip-lavender`, `--tone-lavender-text`, `--chip-sand`, `--warn`,
`--muted`, `--row-pad-y`, `--fs-row`, `--radius-lg`, `--radius-pill`, `--space-4/8/12`,
`--duration-quick`, `--ease`.
