---
type: Note
---
# Launch splash

The Wingman lockup drawing itself: the W traces in, its gradient rises under the trace, the star
swings home with a real overshoot, then mark and word travel together into the finished lockup.
Every beat is an animation off the finished state, which is what makes reduced motion free. Live
page: `/components/splash`. Assets: the kit's `assets/brand.ts` (paths, boxes, gradient vectors,
and every beat's numbers as data).

## Anatomy

| Part | Spec |
|---|---|
| Ground | The home-surface token - the same colour the pre-paint (natively: the splash screen and status bar) already put on screen, so first paint and the splash are one colour in both themes. |
| Lockup | The 2125 x 526 box at min(64vw, 340) wide: the wing mark, then the "INGMAN" wordmark - the glyph is the W. |
| The mark | Three paints: the W's gradient fill (the rest look), the trace stroke drawing it in (width 7, round caps, normalised path length), the star above both. |
| Paint | The mark's gradient is the artwork's own (#D2A7C1 to #5384E5, userSpaceOnUse) and never re-themes; the wordmark's ink is the theme token ([D-024]). |

## The beats

| At | Beat |
|---|---|
| 0ms | The W traces itself: dashoffset 1 to 0 over 1050ms, ease-in-out. |
| 330ms | The gradient fill rises under the trace, 750ms. |
| 1000ms | The trace hands off: fades out over 500ms. |
| 1100ms | The star lands: rotate -200deg to 0, scale 0.18 to 1, pivoting on itself, 500ms with cubic-bezier(0.34, 1.36, 0.64, 1); fades in over the first 250ms. |
| 1500ms | Mark and word settle from +687 user units over 750ms, cubic-bezier(0.22, 1, 0.36, 1), the word fading up over 600ms - the lockup assembles as one object. |
| exit | On the word's arrival the splash fades over 350ms; a 4000ms backstop leaves anyway. |

## Behaviour

- Reduced motion (either layer): no sequence - the finished lockup shows at once, holds 900ms,
  exits. Only the trace needs hiding; the finished state is the resting style.
- The splash draws the same WING_PATHS as the header, the app icons and the pull indicator.

## React Native

Split it in two: the OS splash screen (expo-splash-screen) shows the static finished lockup on the
home-surface colour, and the choreography runs as the app's first screen only when motion is
allowed. The trace uses react-native-svg's dash props over a normalised path length, like the task
check.
