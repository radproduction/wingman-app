---
type: Note
---
# Story row

A news story as Wingman curates it: the topic's chip, the headline, source and age, and - when it
matters - the accent pill saying why this reached you. A read story recedes behind a hairline,
settled but still legible. Live page: `/components/story-row`.

## Anatomy

| Part | Spec |
|---|---|
| Row | `--panel-inner` ground (the news list is tonal-on-white), radius lg, padding `--space-16`, gap `--space-12`, top-aligned; the list stacks at gap 8. |
| Chip | The sm rung, the topic's identity, nudged 4 onto the first line. |
| Headline | 15/500 / 1.34, -0.01em - allowed its two lines. |
| Meta | 12.5 muted: source and age, one line. |
| Why-you tag | An 11.5/500 `--accent-deep` on `--accent-tonal` pill, self-start, 4 above: "Following: AI". Only when the reason is real. |
| Chevron | Muted, centred - the one feed row that shows one, because a story always opens. |

## Behaviour

- Read: the ground goes transparent behind an inset `--line-soft` ring - settled, still legible.
- The why-you tag appears only when Wingman has an actual reason; a feed of tags is a feed of noise.
- The whole row opens the story.

## React Native contract

```tsx
interface StoryRowProps {
  tone: ChipTone
  icon: IconName
  headline: string
  meta: string
  tag?: string
  read?: boolean
  onPress: () => void
}
```

## Tokens

`--panel-inner`, `--line-soft`, `--accent-tonal`, `--accent-deep`, `--muted`, `--radius-lg`,
`--radius-pill`, `--space-4/8/12/16`, the chip tone pair.
