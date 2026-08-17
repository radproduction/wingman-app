---
type: Note
---
# App header

The tab screens' top bar: the WhatsApp channel on one end, the wing mark in the centre, the bell and
the user's own face on the other. Two identity discs carry colour; the bell stays quiet until its
badge fires - the one hot accent in the bar. Live page: `/components/app-header`. Figma: `Top Bar`.

## Anatomy

| Part | Spec |
|---|---|
| Bar | Grid 1fr auto 1fr at gap `--space-12`, padding 4 / 4 / 8 - the centre mark stays optically centred. |
| WhatsApp disc | 38 circle on `--ok-tonal`, brand glyph 24. Presence dot: 9, `--online`, top-end corner at a 1 optical inset, ringed 2 in `--home-surface`. |
| Wing mark | The one brand mark, 24 tall - the same WingGlyph everywhere, never redrawn. |
| Bell | 38 circle on `--disc` with an ink glyph - the same quiet disc the back bar uses. Its dot mirrors the presence dot's geometry in `--alert` red. |
| Avatar | 38 circle, the user's photo or drawn portrait. Opens the profile. |

## Behaviour

- Press scales any disc to 0.94 over the quick duration.
- The bell's dot exists only while something is unread.
- Colour discipline: green = the channel is live, red = something wants you. Nothing else competes.
- RTL: channel leads, account trails; both dots ride `inset-inline-end`.

## React Native contract

```tsx
interface AppHeaderProps {
  unread: number
}
// The dots carry the meaning; nothing else in the bar is allowed a colour
// that competes with them.
```

## Tokens

`--ok-tonal`, `--online`, `--alert`, `--disc`, `--home-surface`, `--ink`, `--radius-pill`,
`--space-4/8/12`, `--duration-quick`, `--ease`.
