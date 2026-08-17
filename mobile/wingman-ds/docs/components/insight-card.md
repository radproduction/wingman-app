---
type: Note
---
# Insight card

Wingman's one recommendation for the day: a badge, a headline, why it matters, and at most a short
list of the steps - the roomiest card on Home, the only one at radius XL. Business restates it for
the business day with its own copy of the anatomy. Live page: `/components/insight-card`.

## Anatomy

| Part | Spec |
|---|---|
| Card | Home-surface, `--radius-xl`, hairline, padding `--space-16`. |
| Top row | The Tag pill (lavender "Focus") and a muted "..." pushed apart, 12 below. Wingman's Day re-tones its Tag to sand so the two badges never echo in the feed. |
| Title | 23/400 / 1.15, -0.01em - a headline, not a label. |
| Body | 14 muted / 1.45, 16 below. Why this, why today. |
| Items | Optional step rows on `--panel-inner` at radius lg, padding 12: 15/500 title over a 12.5 muted meta, led by a chip. |
| CTA | The WhatsApp handoff Button (`wg-btn full wa`), 12 above. |

## Behaviour

- One recommendation per day; the steps list stays short - a push, not a plan.
- The card itself is not a target; the CTA and the "..." are.
- As a dashboard widget it rides a bare cell: this card is its own surface.

## React Native contract

```tsx
interface InsightCardProps {
  tag: string
  title: string
  body: string
  items?: { icon: ReactNode; title: string; meta: string }[]
  cta?: ReactNode
  onMore?: () => void
}
```

## Tokens

`--home-surface`, `--card-line`, `--panel-inner`, `--chip-lavender`, `--tone-lavender`, `--muted`,
`--radius-xl`, `--radius-lg`, `--radius-pill`, `--space-4/8/12/16`.
