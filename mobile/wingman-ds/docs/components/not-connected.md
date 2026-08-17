---
type: Note
---
# Not-connected screen

What a tab shows before its service is connected: the tab's own drawing, one truthful line about
what connecting gets you, and the single button that starts it. Centred in the space the content
would fill - honest about being empty without ever looking broken. Live page:
`/components/not-connected`.

## Anatomy

| Part | Spec |
|---|---|
| Block | A centred column in the leftover space, padding 0 by `--space-24`, gap `--space-8`. The screen already clears the tab bar; the block does not clear it twice. |
| Art | Sized by HEIGHT - min(15vh, 112) - so tabs with different drawings take the same vertical presence. `--space-24` below. Ink is the cool tonal twin (`--art-ink`). |
| Title | 19/500, -0.01em. States the fact: "isn't connected", never "empty". |
| Body | 14 / 1.5, muted, `--space-24` below. What connecting gets you, in one truthful sentence. |
| Action | One Button. There is nothing else to do here. |

## Behaviour

- The artwork animates gently on a 3.6s loop (the calendar's days fill in and hold) - the tab
  waiting to be filled, never a spinner or a bar.
- After connecting, the tab simply renders its content; this screen has no exit of its own.
- Reduced motion stills the artwork.
- Voice: what is missing and what fixing it buys, in Wingman's first person. No blame.

## React Native contract

```tsx
interface NotConnectedProps {
  art: ReactNode
  title: string
  body: string
  action: ReactNode
}
// The artwork is inline SVG shipped with the app (react-native-svg); its
// idle loop is a fill-colour cycle, not a transform. Keep the height-based
// sizing - matching widths across differently-shaped drawings is what
// looks inconsistent.
```

## Tokens

`--art-ink`, `--accent-tonal`, `--muted`, `--space-8/24`, `--ease`, plus the Button tokens.
