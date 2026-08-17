---
type: Note
---
# Connector row

A service Wingman can read from: the brand's own mark on a neutral disc, what it feeds Wingman, and
one of three honest states - connected, not yet available, or a Connect button. Live page:
`/components/connector-row`. Drawn in 3 app files.

## Anatomy

| Part | Spec |
|---|---|
| Row | Home-surface, radius lg, hairline, padding `--row-pad-y` by `--space-16`, gap `--row-gap`. |
| Brand chip | The sm rung on the neutral `--brand-disc` ground, so official multicolour marks read true - a tone tint would fight the logo. |
| Text | Name `--fs-row`/500; description 12.5 muted, 4 below - what connecting feeds Wingman. |
| Status | Connected: a 13/500 `--ok` line with its check. Not yet: an amber 12 pill (`--warn` on `--warn-tonal`) - a state, not a failure. Off: the small Connect Button, pinned at its own width. |
| Count + chevron | A connected row that opens its own screen trails a count and the chevron, paired at 8 rather than a full row-gap apart. |

## Behaviour

- The grouped variant fuses rows into one card with hairline dividers; the row gives up its ground
  and radius to the card.
- Connect starts the flow in its sheet; disconnect lives on the connector's own screen behind a
  confirm sheet - never on this row.

## React Native contract

```tsx
interface ConnectorRowProps {
  mark: ReactNode
  name: string
  desc: string
  status: 'connected' | 'off' | 'soon'
  count?: number
  onPress?: () => void
  onConnect?: () => void
}
```

## Tokens

`--home-surface`, `--card-line`, `--brand-disc`, `--ok`, `--warn`, `--warn-tonal`, `--muted`,
`--ink`, `--row-pad-y`, `--row-gap`, `--fs-row`, `--radius-lg`, `--radius-pill`, `--space-4/8/16`.
