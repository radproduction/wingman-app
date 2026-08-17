---
type: Note
---
# Onboarding top bar

The onboarding flow's top bar: a 44 back disc and the segmented progress track beside it. It holds
still while the steps animate past, and the disc never disappears - on the first step it dims, so
the bar's shape is constant through the whole flow. Live page: `/components/onboarding-bar`.

## Anatomy

| Part | Spec |
|---|---|
| Bar | Flex at gap `--space-16`; margin `--space-4` above and `--space-24` below, inside the flow's wider 24 gutter. |
| Back disc | 44 circle on `--surface` with a 22 chevron - one size up from the app's 38 discs. Press: ground drops to `--track`, scale 0.96. Disabled: 0.4 opacity, in place. |
| Progress | The segmented step track (see Progress), flex-1: one bar per step, filled steps in the accent. |

## Behaviour

- First step: the disc stays and dims instead of leaving - the bar never rearranges.
- The bar and the bottom actions hold still; only the step content animates.
- Accessibility: a progressbar, value = current step, max = step count.

## React Native contract

```tsx
interface OnboardingBarProps {
  step: number
  steps: number
  onBack?: () => void     // absent on step one: disc dims, never leaves
}
```

## Tokens

`--surface`, `--track`, `--ink`, `--accent`, `--radius-pill`, `--space-4/16/24`,
`--duration-quick`, `--ease`.
