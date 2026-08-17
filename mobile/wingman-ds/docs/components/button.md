---
type: Note
---
# Button

The app's one button. Seven tones over one shape, two sizes, and nothing else: a new kind of action
is a tone on this pill, never a new button. [D-022] folded every action into this system; [D-028]
folded in the small pill and the text links. Buttons say what happens ("Send my code"), never
"Submit".

The live version of this page, with an interactive specimen rendering the real values, is at
`/components/button` in the running app. Drawn in 37 app files, which makes it the first thing the
native build needs. Figma: the `Button` set (8 tones x 2 sizes).

## Anatomy

| Part | Spec |
|---|---|
| Shape | Pill (`--radius-pill`). One height per size, held by the nudge below. |
| Padding | Default: `(--space-16 + nudge) / --space-24 / (--space-16 - nudge)`. Full-width: sides at `--space-16`. Small: `(--space-8 +/- nudge) / --space-16`. |
| Label | 15/500 (13/500 small), line box `--pill-line` (1.3). The top padding gains `--pill-nudge` and the bottom loses it, sinking the label onto its optical centre without changing the height. |
| Leading icon | Optional, always on the flex-centred layout (an icon in a default-size button implies it), gap `--space-8`, tinted to the label colour. 18 at the default size, 14 on the small pill. Presence shows it. |

## Tones

| Tone | Fill / label | Press |
|---|---|---|
| `primary` | accent / on-accent | fill flips to accent-deep |
| `quiet` | card-tonal / ink | fill flips to track |
| `outline` | transparent / accent-deep, inset 1.5 accent ring | - |
| `soft` | accent-tonal / accent-deep | keeps fill, dips to scale 0.99 |
| `whatsapp` | ok-tonal / ok | keeps fill, dips to scale 0.99 |
| `danger` | chip-rose / alert | keeps fill, dips to scale 0.99 |
| `warn` | chip-sand / warn | fill flips to warn-tonal |

Press never fires while disabled. **Disabled paints card-tonal / muted whatever the tone**, so "you
cannot press this yet" reads the same on every tone.

`danger` and `warn` are deliberately calm ([D-009]): a deletion reads as deliberate, not as an alarm.

## Props

| Prop | Type | Default | React Native | What it does |
|---|---|---|---|---|
| `label` | string | | `label: string` | Says what happens |
| `tone` | ButtonTone | `'primary'` | `tone?: ButtonTone` | One of the seven |
| `small` | boolean | false | `small?: boolean` | The one small size: a 13px in-row pill |
| `full` | boolean | false | `full?: boolean` | Stretch; label + optional icon flex-centred |
| `leadingIcon` | ReactNode | | `leadingIcon?: ReactNode` | Presence shows it - no `showLeadingIcon` flag |
| `disabled` | boolean | false | `disabled?: boolean` | Muted ground and label, whatever the tone |
| `onClick` | () => void | | `onPress?: () => void` | The action |
| `aria-label` | string | | `accessibilityLabel?: string` | Only when the label alone is not enough |

## Behaviour

- **Long label:** the pill grows; the label never wraps. If it would, the copy is too long.
- **RTL:** the leading icon leads in the writing direction; nothing else changes.

## Text variants

Two small siblings share the button's voice but none of its geometry, and natively they are separate
components, not tones:

- **Text button** (`wg-btn-text`): an action styled as text, 15/500 accent-deep, tap padding 12/8
  that collapses to zero inside running text.
- **Inline link** (`wg-link`): a small accent-deep action trailing a row, 13/500, optional trailing
  chevron on a 4px gap. `--end` pushes it to the trailing edge; `--danger` reads in the calm rose.

## React Native contract

Build on `Pressable`, never TouchableOpacity. The press fills are instant style swaps off the
pressed state; the tonal dip is the one animated part, a transform to scale 0.99 over the quick
duration (transform and opacity are the only properties that animate). Android needs
`includeFontPadding: false` or the nudge fights the font's own padding. The small pill is under 44
tall, so it carries `hitSlop` up to the 44 target.

```tsx
// wg/Button.tsx - implement to match. Every colour, size and radius reads
// from the theme object generated out of app.css; nothing is hardcoded here.

type ButtonTone =
  | 'primary'   // accent fill, on-accent label; press flips fill to accent-deep
  | 'quiet'     // card-tonal fill, ink label; press fills with track
  | 'outline'   // transparent, accent-deep label, inset 1.5 accent ring
  | 'soft'      // accent-tonal fill, accent-deep label; press dips scale 0.99
  | 'whatsapp'  // ok-tonal fill, ok label; press dips scale 0.99
  | 'danger'    // chip-rose fill, alert label; press dips scale 0.99
  | 'warn'      // chip-sand fill, warn label; press dips scale 0.99

interface ButtonProps {
  label: string
  tone?: ButtonTone            // default 'primary'
  small?: boolean              // the ONE small size: 13 type, tighter padding
  full?: boolean               // stretch; label + optional icon flex-centred, gap 8
  leadingIcon?: ReactNode      // presence shows it - no showLeadingIcon flag
  disabled?: boolean           // maps the web :disabled
  onPress?: () => void         // maps the web onClick
  accessibilityLabel?: string  // maps the web aria-label
}

// Geometry, from the theme:
//   radius: theme.radius.pill
//   default padding: [16 + nudge, 24, 16 - nudge]; full: sides 16; small: [8 +/- nudge, 16]
//   nudge = fontSize * 0.055 (the optical-centre sink; zero for ar/ur/hi)
//   type: 15/500 (13/500 small), lineHeight = fontSize * 1.3,
//   includeFontPadding: false on Android
//   leadingIcon: 18 (14 when small), on a flex-centred row with the label,
//   gap 8. Native layout is flex, so the web's baseline-misalignment trap
//   (an inline icon in a non-flex button) cannot exist here - centre and go.
//
// Press, on Pressable's pressed state - never while disabled:
//   primary -> fill theme.accentDeep      quiet -> fill theme.track
//   warn    -> fill theme.warnTonal       soft / whatsapp / danger -> scale 0.99
//   (scale is a transform - the one thing here that animates; 150ms, smooth-out)
//
// Disabled paints theme.cardTonal / theme.textMuted WHATEVER the tone, so
// "you cannot press this yet" reads the same on every tone.
```

## Tokens consumed

`--accent`, `--on-accent`, `--accent-deep`, `--accent-tonal`, `--card-tonal`, `--track`, `--ink`,
`--muted`, `--ok-tonal`, `--ok`, `--chip-rose`, `--alert`, `--chip-sand`, `--warn`, `--warn-tonal`,
`--radius-pill`, `--space-8/16/24`, `--pill-line`, `--pill-nudge`, `--duration-quick`, `--ease`.
