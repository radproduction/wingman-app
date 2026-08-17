---
type: Note
---
# Mail row

An email as Wingman presents it: who, what, when - and what Wingman already did about it. The
unread dot rides the sender chip in the alert red, a drafted reply announces itself as a quiet tag,
and handled rows step back without leaving the list. Live page: `/components/mail-row`.

## Anatomy

| Part | Spec |
|---|---|
| Row | Home-surface, radius lg, hairline, padding `--row-pad-y` by `--space-16`, gap `--row-gap`; press scales to 0.99. |
| Chip | The sm rung: the sender's letter at `--fs-row`/500, or the drawn portrait. Unread wears the 10 dot in `--alert` red ringed 2.5 in the surface - unread shares the bell badge's red, never the accent. |
| Top line | Sender `--fs-row`/500 and the time (12 muted), baseline-justified apart. |
| Subject | `--fs-sub` muted, one line, ellipsised. |
| Ready tag | 11.5/500 in `--accent-deep` on `--accent-tonal`, 8 above: "Reply drafted". The draft stays behind the tap. |
| Did tag | The same tag cooled to muted-on-panel: what Wingman already did - the handled list reads as a receipt. |

## Behaviour

- Handled: chip at 0.62, sender relaxed to 400 muted - a step back without receding below the panel.
- A row holding a decision opens its approval sheet on tap instead of the thread.
- The dot is the only unread signal; the row never bolds its whole line.

## React Native contract

```tsx
interface MailRowProps {
  from: string
  subject: string
  time: string
  tone: ChipTone
  initial: string
  person?: boolean
  unread?: boolean
  ready?: string
  did?: string
  handled?: boolean
  onPress?: () => void
}
```

## Tokens

`--home-surface`, `--card-line`, `--alert`, `--surface`, `--accent-deep`, `--accent-tonal`,
`--panel`, `--muted`, `--row-pad-y`, `--row-gap`, `--fs-row`, `--fs-sub`, `--radius-lg`,
`--radius-pill`, `--space-4/8/12/16`, `--duration-quick`, `--ease`, the chip tone pair.
