# Wingman — Mobile app (React Native + Expo)

The native iOS + Android app. It is a **new frontend on the existing Wingman
backend** — the API, WhatsApp, schedulers and every feature already live at
`https://imyourwingman.ai` do not change. This app just talks to that same API,
dressed in the Wingman design system.

```
Backend (imyourwingman.ai/api/*)      ← unchanged
   ├── Web client (client/)           ← the existing PWA / desktop
   └── mobile/  ← THIS                 ← the native app
```

## Stack

Expo SDK 54+, React Native 0.81+, New Architecture + Hermes, portrait, phones
only for v1 (per the design system's handoff answers). Navigation is React
Navigation; the design system assumes it.

## Run it

```bash
cd mobile
npm install
npx expo install --fix     # aligns native module versions to the installed SDK
npx expo start             # press i / a, or scan the QR with Expo Go
```

The foundation runs in **Expo Go** today (SecureStore + svg are supported). A
**dev build** (`npx expo run:ios` / `run:android`) is only needed later, when
push notifications and background location land.

> First login sends a code to your WhatsApp (the backend does this) — use a phone
> number already registered with Wingman.

## What's in the foundation

| Path | What |
|---|---|
| `wingman-ds/` | The design system kit (tokens, 51 icons, brand, component contracts). **Never hand-edit `theme.ts`**; drop in a fresh copy when tokens change. |
| `src/theme/ThemeProvider.tsx` | Colour context. `useTheme()` → `{ theme, palette, mode, setPreference }`. Every screen reads colour from here — never a hardcoded hex. |
| `src/theme/Icon.tsx` | The one `<Icon>` — renders a duotone glyph via react-native-svg, one colour moves both layers. |
| `src/api/client.ts` | The single door to the backend (`/api/*`), Bearer token from SecureStore. |
| `src/lib/auth.ts` | Token in the OS keychain (expo-secure-store). |
| `src/navigation/` | Auth gate + the 5 sibling tabs. |
| `src/components/` | `Button` (built to button.md) and `Screen` scaffold — the pattern to copy. |
| `src/screens/` | `LoginScreen` (OTP) and `HomeScreen` (**wired live to `/api/dashboard`**), plus tab placeholders. |

## How to add a screen (the loop)

1. Open the component's contract in `wingman-ds/docs/components/<name>.md`.
2. Build it in `src/components/` reading **only** from `theme`/`palette` — no
   hardcoded colours, sizes or radii. `Button.tsx` is the reference.
3. Compose the screen in `src/screens/`, fetch its data through `src/api/client.ts`
   (add the endpoint there; the backend already returns it).
4. Check it against the running web prototype: <https://wingman-rouge.vercel.app>.

Follow the **build order** in `wingman-ds/docs/component-inventory.md`: the
high-use primitives (Button, Chip, Option Row, Field, Segmented) first, then the
shell, then screens area by area.

## Navigation model (do not flatten it)

The five tabs — Home, Calendar, Email, Tasks, More — are **siblings** (they
rise-and-fade). Everything opened from a tab is a **detail layer**: a
native-stack push **within that tab** that slides in, carries its own back bar,
and **hides the tab bar**. To add one, wrap the tab's component in a
`createNativeStackNavigator` and push the detail screen (with
`tabBarStyle: { display: 'none' }` on it). Putting detail screens in one global
stack, or leaving the tab bar over them, changes the product's structure.

## Three decisions the design system flags (before the first polished screen)

From `wingman-ds/docs/tokens.md`:

1. **Fonts** — the rounded face needs static instances with the rounded axis
   baked in (no `fontVariationSettings` in core RN). Load them with `expo-font`.
2. **Blur** — frosted bars need a blur view on iOS + a flat fallback on Android.
3. **Android 7–8 shadows** — `boxShadow` needs Android 9; use the
   `android78Elevation` fallback below that.

## Native powers to add later (Phase 3)

- `expo-notifications` — push (proactive alerts)
- `expo-location` + `expo-task-manager` — **background location** (fixes the PWA
  limitation; makes the "traffic before you leave" feature work properly)
- `expo-auth-session` / `expo-web-browser` — Google connect
- Motion: `react-native-reanimated` (add its babel plugin) for the screen
  transitions and sheet springs in `foundations.md §8`.

## Ship (Phase 5)

EAS Build → App Store (Apple Developer, $99/yr) + Play Store ($25 one-time).
Bundle id / package: `ai.imyourwingman.app` (see `app.json`).
