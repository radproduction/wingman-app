---
type: Note
---
# Tokens, and how each kind converts to React Native

Companion to [readme.md](readme.md). **The token values themselves live in
[DESIGN.md](../../DESIGN.md)**, which is the mirror of the `:root` block in `app/src/app/app.css`.
This file does not restate them. It covers the part DESIGN.md does not: what each family of token
*is*, and what happens to it when it crosses to React Native, including the handful of places where
the conversion is not one for one and copying the number produces something visibly different.

Read [DESIGN.md](../../DESIGN.md) for values. Read this for the translation.

## The target

Everything below is written for the stack the mobile developer confirmed on 2026-08-15, and the
conversions change with it, so it is stated once here rather than hedged per section.

| | |
|---|---|
| Framework | Expo managed, SDK 54 or later, with Continuous Native Generation (`expo prebuild`) |
| React Native | 0.81 or later |
| Architecture | **New Architecture** (Fabric and TurboModules), Hermes |
| iOS | 15.1 and up |
| Android | minSdk 24 (Android 7.0), targetSdk 35+ |
| Orientation | Portrait only for v1. No tablet, no landscape. |

The New Architecture matters more than it looks: it is what makes shadows and filters real style
props rather than platform workarounds (§2). The Android floor of 7.0 matters for the same reason,
because two of the style props it unlocks need Android 9.

## The shape of the system

| Family | Count | Where | Themed |
|---|---|---|---|
| Colour, semantic | ~92 | DESIGN.md §1 | light and dark, re-pointed under `:root[data-theme='dark']` |
| Colour, primitive | ~163 | Figma Primitives collection | no |
| Elevation and shadow | 5 | DESIGN.md §2 | yes, deeper in dark |
| Typography | see §3 | DESIGN.md §3 | no |
| Spacing | 8 steps | DESIGN.md §4 | no |
| Radius | 7 rungs | DESIGN.md §5 | no |
| Size and layout | chip 4, icon 4, plus layout | DESIGN.md §6 | no |
| Motion | durations 7, easings 7, distances 5, scales 4, blurs 3, plus named transitions | DESIGN.md §7 | no |
| RTL and i18n | `--dir`, per-language faces | DESIGN.md §8 | no |

Naming is **by job, not by appearance**: `--surface` is what a card is made of, `--on-accent` is what
a label on an accent fill is made of. That is what lets a single dark block re-point the whole app.
Keep that property in React Native. A theme that names colours `blue500` throws away the one thing
that makes this system themeable.

Three axes re-point tokens at runtime, all written onto the root element by `app/src/shell/prefs.ts`:

| Axis | Values | Re-points |
|---|---|---|
| `data-theme` | light, dark, system | the whole colour block |
| `data-density` | default, compact | `--row-pad-y`, `--row-gap`, `--list-gap`, `--set-pad-y`, and the `sm` chip rung down to `xs` |
| `data-text` | small, default, large | `--fs-row`, `--fs-sub` |

**These are three theme axes, not three sets of conditionals.** In React Native they belong in the
theme object, resolved once, so a component reads `theme.rowPadY` and never asks which density it is
in. Density in particular is not a font-size change: it takes the air out of a row without moving the
chip column, so a dense list still scans by glyph.

---

## 1. Colour

**Converts cleanly.** Every value is a hex or an `rgba()`. React Native accepts both strings as-is.

Two notes:

- `color-scheme: light` on `:root` is a browser hint for form controls and scrollbars. It has no
  React Native equivalent and needs none.
- A handful of colours are deliberately **unthemed** and must stay that way: `--knob` and the slider
  thumb stay white in both themes, because a knob the colour of its own card disappears into its
  track on charcoal. `--toast-bg` is the one inverted surface in the app. Do not "fix" these by
  giving them dark values.

## 2. Elevation and shadow

**On the New Architecture this converts almost directly, which was not true a couple of years ago.**
React Native 0.76 added `boxShadow` as a real style prop, New Architecture only: CSS-like syntax,
the same on both platforms, and **multiple shadows are supported**. Since this project is on the New
Architecture, the five tokens transfer as their own CSS strings and the old workarounds (one shadow
per view, `elevation` as the only Android lever, a nested wrapper per layer, `react-native-shadow-2`)
are not needed.

| Token | Value | `boxShadow` |
|---|---|---|
| `--shadow-card` | `0 4px 16px rgba(28,27,26,.12)` | `'0 4px 16px rgba(28,27,26,0.12)'` |
| `--shadow-nav` | two layers | `'0 10px 30px rgba(28,27,26,0.18), 0 2px 8px rgba(28,27,26,0.08)'` |
| `--shadow-sheet` | `0 -18px 44px rgba(28,27,26,.16)` | `'0 -18px 44px rgba(28,27,26,0.16)'` |
| `--shadow-thumb` | `0 2px 6px /.2` plus a `0 0 0 1px` ring | `'0 2px 6px rgba(28,27,26,0.2)'` plus a real border, see below |
| `--shadow-toast` | `0 10px 30px rgba(28,27,26,.28)` | `'0 10px 30px rgba(28,27,26,0.28)'` |

Take the dark values from DESIGN.md §2 rather than reusing the light ones at a different opacity: on
charcoal a light shadow does not register, which is why the surfaces do some of the lifting instead.

### Three things still to handle

1. **`boxShadow` on Android needs Android 9 (API 28), and this project's floor is minSdk 24.** On
   Android 7 and 8 the prop does nothing, so those two versions need an `elevation` fallback. It is a
   thin slice of devices and a flatter shadow is an acceptable degradation there, but it has to be a
   decision rather than a surprise:

   | Token | Android 7-8 fallback |
   |---|---|
   | `--shadow-card` | `elevation: 3` |
   | `--shadow-nav` | `elevation: 12` |
   | `--shadow-sheet` | `elevation: 16`, and note Android cannot throw a shadow **upward**, so the sheet reads flat here |
   | `--shadow-thumb` | `elevation: 2` |
   | `--shadow-toast` | `elevation: 12` |

2. **The thumb's ring is not a shadow.** Its `0 0 0 1px` layer is a hairline drawn as a shadow, a CSS
   idiom for a ring that costs no layout. Natively it is a `borderWidth` of 1, and the unringed state
   needs a transparent border of the same width or the layout shifts when the ring appears.

3. **If anything ever drops to the legacy `shadowOffset` / `shadowRadius` path**, the blur number
   does not carry: CSS blur-radius is two sigma and iOS `shadowRadius` is sigma, so convert with
   `sigma = r * 0.57735 + 0.5`. This is the one number that used to be the main trap here, and on the
   New Architecture it should never come up.

## 3. Typography

**Three real problems, one of which needs a decision before any screen is built.**

### 3.1 The variable font axis (needs a decision)

The app's face is **Google Sans Flex** with `font-variation-settings: 'ROND' 100` applied on the root
element. That single axis rounds every terminal in the app's type and is a large part of how Wingman
looks.

**React Native still has no way to set an arbitrary variation axis.** `fontVariationSettings` exists
as a community proposal with proof-of-concept implementations for both platforms, but it is not in
core React Native and is not in the style API as of 2026. Font selection happens by family name, and
both platforms support variable fonts underneath without exposing the axes.

So the answer is to **export static instances** of Google Sans Flex with `ROND` baked at 100, one
file per weight actually used (400 and 500, plus 600 for the handful of places that use it), register
them as named families, and load them with `expo-font`. Confirm the licence allows it before
building on it. If it does not, the fallback is a different rounded face, which is a visible design
change that needs a decision rather than a quiet substitution.

The optical size axis (`opsz`, 6 to 144) is currently left to the browser's automatic behaviour, so
static instances should be cut at the sizes the app actually uses rather than at one size.

This is the one item on the whole list that could change how the app looks rather than how it is
built, which is why it is first.

### 3.2 Line height

`--pill-line: 1.3` is unitless, so it scales with whatever font size it lands on. React Native
`lineHeight` is an absolute number. Every use becomes `fontSize * 1.3`, computed per component, never
a copied constant.

The value is stated rather than left to `normal` for a reason worth preserving: `normal` is derived
from the font's own metrics, and Noto Sans Arabic's are taller than Google Sans Flex's, so every pill
in the app grew 9 to 12 pixels the moment the language changed. Stating it holds the rhythm across
faces. The same problem exists natively and the same fix works.

### 3.3 Optical centering

`--pill-nudge: 0.055em` sinks a pill's label onto its optical centre, spent as asymmetric padding
(the top gains it, the bottom loses it) rather than as a transform, so the pill's height is unchanged
and the text is not blurred. It exists because Google Sans Flex draws its baseline low in the em box.

In React Native: `em` does not exist, so it becomes `fontSize * 0.055`. And Android adds its own font
padding, so `includeFontPadding: false` is needed on the `Text` or the nudge fights it. The nudge is
**zeroed** for Arabic, Urdu and Hindi, because those are set in Noto faces with their own metrics.

### 3.4 The rest

`--fs-row` and `--fs-sub` are the only two font-size tokens; every other size is applied per
component (the role ramp is in DESIGN.md §3). Regular (400) is the default and **Medium (500) is the
only emphasis weight**. Hierarchy comes from size and colour, not from boldness, and headings are
Regular. A native implementation that reaches for bold headings has changed the design.

## 4. Spacing

**Converts one for one.** Eight steps (4, 8, 12, 16, 24, 32, 48, 64), no off-scale values anywhere in
the app, ties round up.

`gap` in flex layouts has been supported since React Native 0.71, so on 0.81 the row rhythm carries
across as written rather than being rebuilt out of margins.

## 5. Radius

Seven semantic rungs (0, 6, 8, 12, 16, 24, 999). `--radius-pill: 999px` works natively as-is.

**The exception that does not convert:** two shapes in the app are *ratios*, not fixed radii, and are
deliberately outside the scale. Circles are `border-radius: 50%` and the icon tiles are `22%`. React
Native does not accept a percentage `borderRadius`. Both become a value computed from the rendered
size: `size / 2` for a circle, `size * 0.22` for an icon tile. A hardcoded number here breaks the
moment the chip rung changes.

## 6. Size

Chips are exactly four rungs (32, 40, 48, 52), each paired with an inner icon size (18, 22, 24, 26).
There is no fifth diameter and no raw-px chip anywhere in the app, and that invariant should survive
the port. Compact density folds the `sm` rung down to `xs`, which is why the rung, not the pixel
value, is what a component asks for.

## 7. Motion

**Durations convert one for one** (milliseconds to milliseconds).

**Easings convert cleanly to `Easing.bezier`** in Reanimated, including
`--ease-bounce-strong: cubic-bezier(0.34, 3.85, 0.64, 1)`, whose y value above 1 is a deliberate
overshoot and is handled correctly by the bezier easing. Do not substitute a spring for it casually:
the app already uses real springs in two places and the distinction is intentional.

**Distances are signed** in several tokens, because "deeper" means off the trailing edge, which flips
under RTL. See §8.

**One thing genuinely does not convert.** Since D-032 both bottom sheets leave on a **spring seeded
with the gesture's own velocity**, which is why there is no close duration token to copy. Natively
that is a Reanimated `withSpring` fed from the pan gesture's velocity, and it has to be built as a
gesture-driven animation rather than a timed one.

**Two layers of reduced motion, and both are real product behaviour:**

1. The phone's own setting, honoured through `@media (prefers-reduced-motion: reduce)` blocks. Natively
   this is `AccessibilityInfo.isReduceMotionEnabled` plus its change subscription.
2. An **in-app toggle in Settings**, which overrides the phone. Choosing to keep the motion in
   Settings genuinely keeps it, which is why every media block is guarded. Natively this is app state
   layered over the OS value, and it needs to be built deliberately or the Settings toggle will do
   nothing.

The web implementation clamps `animation-duration` and `transition-duration` to `1ms !important` on
every element. That is a CSS mechanism, not a design decision. The design decision is: motion stops
except where it carries meaning.

## 8. RTL and direction

`--dir` is `1`, re-pointed to `-1` under `[dir='rtl']`, and anything that slides sideways in a
transform multiplies by it. **This one transfers almost exactly**, because React Native transforms
also know nothing about writing direction: `I18nManager` flips layout, but a `translateX` in an
animation still needs the sign flipped by hand.

Everything else RTL is layout, and React Native's `start`/`end` props are the direct equivalent of
the logical properties the app uses. Keep the same rule: never a hardcoded left or right.

Two pieces of fixed chrome deliberately **do not** mirror, and one physical edge could not be
avoided. Those are design decisions, documented in DESIGN.md §8, and they must be carried across
rather than "corrected".

Note for planning: `I18nManager.forceRTL` requires an app restart to take effect. The web app switches
language live. That is a real difference in the product experience and needs a product decision, not
an engineering workaround.

## 9. Effects

| CSS | Native |
|---|---|
| `backdrop-filter: blur()` on the tab bar, headers and sheets | A blur view under the bar, with the `--glass*` colours as the tint over it. See the caveat below. The radius transfers 1:1, because CSS `blur(Npx)` in a filter is the standard deviation. |
| `filter: blur()` on an element itself (the receding screen behind a push) | The `filter` style prop, New Architecture only, same as `boxShadow` |
| `@supports not (backdrop-filter)` fallbacks | Nothing. A capability query for a browser feature. |
| `position: sticky` headers | A pinned header outside the scroll view, or a Reanimated scroll-driven header |
| CSS custom properties as a live theming mechanism | A theme object plus context. The values are the same; the mechanism is not. |

### The blur caveat, and the sanctioned fallback

**Backdrop blur is the one effect with no reliable cross-platform answer**, and it is not decoration
here: the tab bar, several headers and both sheets are frosted, which is how they sit over content
without a border. There is no `backdropFilter` in React Native. `expo-blur` is solid on iOS and has
been the weak spot on Android for years, with each release moving the line on what actually blurs.

Rather than leave this to be discovered on a device, it is a decision now:

- **iOS:** a real blur view, tinted with `--glass` / `--glass-hi` and the `--glass-line` hairline.
- **Android, where blur is available and cheap:** the same.
- **Android otherwise:** a **flat `--glass-hi` fill** with the `--glass-line` hairline, and no blur.
  This is a sanctioned degradation, not a bug. The bar stays legible over content because the tint
  already carries most of the separation; what is lost is the depth cue.

Whichever blur library is chosen, it needs to be one that supports the New Architecture. Check that
before adopting it, because several of the older ones do not.

---

## What ships to the developer

A generated, do-not-edit token file produced from `app.css`, regenerated whenever a token changes so
the two cannot drift, and never hand-edited. The exact form follows the styling layer, which is the
one remaining open question (question 5 in
[rn-handoff-questions.md](rn-handoff-questions.md)); the assumption in the meantime is a TypeScript
theme object consumed through context, which is what these docs are written against.

The conversions in this document are applied by the generator rather than left to the reader. Three
things it cannot do for you, and they are all decisions rather than transforms: the static font
instances (§3.1), the Android blur fallback (§9), and the Android 7-8 shadow fallback (§2).
