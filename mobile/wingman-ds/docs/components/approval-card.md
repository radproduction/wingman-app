---
type: Note
---
# Approval card

The one pattern the whole product hangs on: Wingman proposes, you decide. Inline, a decision is a
small accent pill that recedes into a status line once made; in the sheet, the full card states
where the decision is, why it is being asked, and exactly what will happen. Live page:
`/components/approval-card`. Drawn in 6 app files.

## Anatomy

| Part | Spec |
|---|---|
| Inline pending | The small soft accent pill (`wg-btn sm soft`) carrying the CTA, 8 above its row's content. Opens the sheet. |
| Inline settled | No pill: a 12.5 status line with a 14 icon in the state's own colour - in flight `--accent-deep`, done `--ok-soft` (the mint mid-tone, [D-005]), dismissed muted, failed `--warn`. |
| State strip | A 12.5/500 pill naming where the decision is: accent-tonal pending, mint done, card-tonal dismissed, sand failed. In flight it carries the 7 pulse dot on the pulse tokens. |
| Why | 14.5 / 1.5 muted: why Wingman is asking, or what came of it - one slot for both, so the card never rearranges. |
| Facts | A `--panel-inner` card of label/value lines at 13.5, baseline-justified, `--line-soft` hairlines. A line you edited turns its value `--accent-deep`: marked as yours. |
| Actions | The sheet tiers: approve primary, change and dismiss quiet; destructive dismissal takes warn, never an alarm. |

## Behaviour

- Pending is a pill; decided is a line. A list of decisions visibly RESOLVES as you work through it -
  the same law that recedes a read notice.
- The in-flight pulse is the one place the app admits it is doing something in the world; the sheet
  is not dismissable while a decision is in flight.
- The card never times out, never auto-approves, never buries the dismissal. The facts say exactly
  what will happen before you say yes.

## React Native contract

```tsx
interface ApprovalActionProps { id: string }
interface ApprovalCardProps { approval: Approval }
// ONE host renders every approval sheet; rows carry only the id. The
// settled line is a plain pressable line, not a restyled Button.
```

## Tokens

`--accent-tonal`, `--accent-deep`, `--chip-mint`, `--ok-soft`, `--card-tonal`, `--chip-sand`,
`--warn`, `--panel-inner`, `--line-soft`, `--muted`, `--radius-pill`, `--radius-lg`,
`--space-4/8/12/16/24`, `--pulse-dur`, `--pulse-min`, `--ease-in-out`.
