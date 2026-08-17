---
type: Note
---
# Bottom action bar

The bar at a flow's foot that carries the commitment: Continue, Save, the skip beside it. Three
arrangements - text-and-pill, stacked, and the intro's dots-over-button - and one physical rule: it
always rides above the soft keyboard. Live page: `/components/action-bar`. Drawn in 4 app files.

## Anatomy

| Part | Spec |
|---|---|
| Row | Flex, space-between at gap `--space-12`: the quiet text action starts, the pill Button ends. `--space-16` padding above. |
| Stack | A column at gap `--space-8`: the full-width primary with a ghost or text action under it (onboarding). |
| Intro | A centred column at gap `--space-16`: page dots above a full-width Button (the welcome panes). |
| Keyboard lift | Padding-bottom equals exactly what the keyboard covers (`--wm-kb`), transitioned over the quick duration. |

## Behaviour

- One primary at most; a second choice is text or ghost, never a second pill.
- The frame never collapses for the keyboard; the bar rides up by the covered height.
- Detail screens pin the bar outside the scroll track (the panel's footer slot).
- In onboarding the bar holds still between steps; only the step content animates.

## React Native contract

```tsx
interface ActionBarProps {
  variant?: 'row' | 'stack' | 'intro'
  children: ReactNode
}
// Lift the BAR for the keyboard, not the screen: only the bar's bottom
// padding animates; the content stands still behind it.
```

## Tokens

`--space-8/12/16`, `--wm-kb`, `--duration-quick`, `--ease`, plus the Button and text-button tokens.
