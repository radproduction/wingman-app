# Wingman Design System - starter kit

Version 0.1.6 (16 August 2026). Downloaded from the Wingman design system
documentation site - the site you got this from is the living version of everything in here.

## What this is

The design system as a React Native starter kit, for the Expo app (SDK 54+, RN 0.81+, New
Architecture). There is no component library in here yet, deliberately: components are built in the
app from the contracts in docs/, against the tokens in theme/.

| Path | What it is |
|---|---|
| theme/theme.ts | Every token, generated from the web app's stylesheet. The one file you import. |
| icons/duotone.ts | The 51 duotone icon glyphs as SVG element data, for react-native-svg. |
| assets/brand.ts | The W+Star mark, wordmark and gradient as path data, plus the splash and pull-to-refresh choreography numbers. |
| docs/foundations.md | The rules: principles, states, motion, iconography, RTL, accessibility. |
| docs/tokens.md | What each token family is, and the conversions that are not one-for-one. |
| docs/component-inventory.md | The full component roster, audited from the app. |
| docs/components/ | One file per documented component, each with its React Native contract. |
| CHANGELOG.md | What changed per kit version. |

## Quick start

```tsx
import { theme } from './wingman-ds/theme/theme'

const palette = theme.palette.light // or .dark; resolve once, from your theme context

<View
  style={{
    backgroundColor: palette.surface,
    borderRadius: theme.radius.lg,
    padding: theme.space['16'],
  }}
/>
```

## Three things theme.ts cannot do for you

Decisions, not transforms - all three are covered in docs/tokens.md:

1. **Fonts**: the face needs static instances with the rounded axis baked in (there is no
   fontVariationSettings in core RN). See tokens.md section 3.1 before building any screen.
2. **Blur**: the frosted bars need a blur view on iOS and a sanctioned flat fallback on Android.
3. **Android 7-8 shadows**: boxShadow needs Android 9; use .android78Elevation below that.

## Rules that survive the port

- Never hand-edit theme.ts; get a fresh copy when tokens change.
- The chip has exactly four sizes and the glyph is sized by the rung, never the call site.
- Regular is the default weight and Medium is the only emphasis.
- A wrong contract is fixed in the contract first, then implemented.
