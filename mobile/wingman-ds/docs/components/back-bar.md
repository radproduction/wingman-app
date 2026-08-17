---
type: Note
---
# Detail back bar

The detail layer's top bar: a quiet back disc, the screen's name at full size, at most one text
action. On this layer you are somewhere specific - the only navigation that matters is getting back,
and the tab bar has stood down. Live page: `/components/back-bar`. Drawn in 7 app files. Figma:
`Top Bar`.

## Anatomy

| Part | Spec |
|---|---|
| Bar | Flex at gap `--space-12`, padding `--space-4`, on the detail layer's white top surface. |
| Back disc | 38 circle on `--disc` with a 20 chevron - the same disc as the app header's bell. Press scales to 0.94. |
| Title | 22/400, -0.01em, taking the remaining width. The screen is the title; no subtitle, no icon. |
| Action | One at most: 13.5/500 in `--accent-deep`, quiet until needed. Press dims to 0.6. |

## Behaviour

- Back pops the stack; arriving cold on a directly-linked route it replaces to the screen's stated
  fallback tab. Direction comes from history, so the browser's Back animates identically.
- On fixed-panel screens the bar never scrolls; the track dissolves under the lip beneath it.
- RTL: the chevron points out of the screen in the writing direction.

## React Native contract

```tsx
interface BackBarProps {
  title: string
  action?: ReactNode
  onBack: () => void      // pop, or replace to the fallback tab when cold
}
// Resist the platform header: the native stack's default brings its own
// type, back affordance and large-title behaviour, all wrong here.
// headerShown false; this bar is an ordinary component. (Assumed Expo
// Router v6 - open question 15.)
```

## Tokens

`--disc`, `--ink`, `--accent-deep`, `--home-surface`, `--radius-pill`, `--space-4/12`,
`--duration-quick`, `--ease`.
