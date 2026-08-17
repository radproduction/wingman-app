---
type: Note
---
# Foundations

Companion to [readme.md](readme.md). The principles and the rules. **Token values are in
[DESIGN.md](../../DESIGN.md)** and are not repeated here; the conversion of each token family to
React Native is in [tokens.md](tokens.md). The decisions and their history are in
[design-direction.md](../design-direction.md) under the `[D-xxx]` changelog, which this file cites
rather than restates.

This is the document to read first, and the one to re-read when something looks right in isolation
and wrong on the screen.

---

## 1. Principles

Wingman is a proactive assistant that lives on WhatsApp. The app is where you meet it, shape it, and
check on it. The visual language is calm, rounded, tonal, and low density: form follows feeling.

1. **One idea per card, one decision per screen.** Each card carries a single status. Each
   onboarding screen asks a single question. A card that carries two things is two cards.
2. **Tonal, not lined.** Separation comes from surface tone, not from borders and not from shadows.
   Colour arrives in small doses: pastel chips, thin rings, one accent. The one sanctioned hairline
   is the card line, added by [D-031] for white cards sitting on the panel.
3. **Status is the headline.** The prominent slot in a card holds the assistant's status label
   ("2 urgent", "All settled"), with the evidence in the support line beneath. Not a raw list, and
   not a number the reader has to interpret.
4. **Empty is an invitation, never a blank.** An unset module shows "Get started" in the same card
   anatomy as a set one. It is never a greyed placeholder, and a disconnected module vanishes rather
   than sitting there disabled.
5. **The assistant speaks first person; the interface speaks to the user in second person.**
6. **Reviewed with a designer's eye, every time.** Stray greys that should be white, off-brand fills
   that should be accent, tonal mismatches, orphaned spacing, colour that fights content. The bar is
   whether a designer would sign off on the frame.

### Voice and copy

- Buttons say what happens ("Send my code", "Go to Wingman"), never "Submit".
- **No long dashes anywhere.** Copy reads human, not machine-written.
- Auto-detect before asking. Timezone is detected rather than requested.
- Native pickers over custom wheels.

---

## 2. Colour

Values: [DESIGN.md §1](../../DESIGN.md). What matters beyond the values:

- **Naming is by job, not by appearance.** `--surface` is what a card is made of; `--on-accent` is
  what a label on an accent fill is made of. This is what makes one dark block enough to re-theme
  the whole app, and it is the single most important property to preserve in a native theme.
- **Six chip tones** (blue, lavender, mint, peach, sand, rose) are the identity palette. The sixth
  was added by [D-019] because a heart is red.
- **Icon colour on a tinted chip is the same hue at a mid tone**, never the deepest shade of it
  ([D-005]). The chip keeps its colour; only the glyph is tuned. Getting this wrong makes every
  identity chip in the app look muddy at once.
- **Dark is a re-point, not a second design.** Every token keeps its name and changes its value under
  `:root[data-theme='dark']` ([D-015], re-toned by [D-020]).
- **A few colours are deliberately unthemed** and must stay that way. The switch knob and slider
  thumb stay white in both themes, because a knob the colour of its own card vanishes into its track
  on charcoal. The toast is the one inverted surface in the app.

## 3. Typography

Values and the role ramp: [DESIGN.md §3](../../DESIGN.md). The rules:

- **Regular is the default, Medium is the only emphasis weight.** Hierarchy comes from size and
  colour, not from boldness. Headings are Regular. This is the rule most likely to be broken by a
  reimplementation, and breaking it changes the design.
- **The type is rounded** ([D-018]): one variable axis rounds every terminal in the app. See
  [tokens.md §3.1](tokens.md) for why this needs a decision before any native screen is built.
- **Pill metrics are stated, not inherited.** The line box inside a pill and the optical-centre nudge
  are fixed values so a pill's height holds when the language changes the face. Without them every
  pill in the app grows when the user switches to Arabic.

## 4. Spacing, density, and rhythm

Values: [DESIGN.md §4](../../DESIGN.md). The rules:

- **One eight-step scale, no off-scale values** ([D-029]). Snap to the nearest step; ties round up,
  because roomier is the house style.
- **The panel column runs on one 16 rhythm** ([D-030]): side gutter, top inset, row gap, and the gap
  above a section head are the same step. Within a card, spacing steps down one rung.
- **Density is a theme axis, not a screen decision.** Compact takes the air out of a row without
  moving the chip column, so a dense list still scans by glyph. Onboarding option rows are left at
  default on purpose: they are a flow you walk through once, not a list you live in.
- **Two carve-outs from "no exceptions"**, both deliberate: absolute-positioned optical glyph offsets
  (dots, badges, the toggle thumb) stay pixel-precise, and the tab bar's responsive geometry is out
  of scope.

## 5. Shape

Values: [DESIGN.md §5](../../DESIGN.md). The grammar:

| Rung | Used for |
|---|---|
| `pill` | Actions and inputs |
| `xl` | Content containers and sheet tops |
| `lg` | Cards |
| `md`, `sm`, `xs` | Progressively smaller inner shapes |
| `none` | Full-bleed |

Circles and the icon-tile shape are **ratios, not radii**, and sit outside the scale deliberately.
See [tokens.md §5](tokens.md) for why that distinction has to survive the port.

## 6. Elevation

Values: [DESIGN.md §2](../../DESIGN.md). Separation is tonal first. Shadow is reserved for things
that genuinely float above the screen: the tab bar, a bottom sheet, a toast, a dragged thumb, and a
card that has lifted off the panel. A shadow used to separate two things that are both flat on the
same surface is a mistake, and the fix is tone.

Shadows go deeper in dark rather than lighter, because on charcoal a light shadow does not register
and the surfaces do the lifting instead.

## 7. Interaction states

The full contract every interactive component implements. This is the section a native
implementation should be checked against, component by component.

| State | How the app expresses it | Notes |
|---|---|---|
| Default | The base style | |
| Pressed | `:active` deepens the fill, or scales the element | Never applied while disabled. Every tonal button has an explicit pressed fill. |
| Disabled | Muted ground and muted label, whatever the tone | The tone modifiers each restate this, because a tone set after the disabled rule would otherwise win. |
| Selected | An outer accent ring, plus the title in accent-deep and the mark filled | Chosen over a tonal fill, which would blend into the panel behind it. |
| Error | Border plus message, always together | A border without its message is not an error state. |
| Loading | Skeleton in the shape of the content, then a cross-fade | Not a spinner in a blank box. |
| Empty | The same card anatomy with an invitation | Never a greyed placeholder. |

**There is no hover state anywhere in the app**, by design, and there are zero `:hover` rules in
`app.css`. Nothing is lost crossing to a platform that has no pointer.

**Focus** is one visible ring, used sparingly. The web app is phone-first, so keyboard focus is not
a primary path; a native implementation should still expose everything to the accessibility layer.

**Two traps for a native implementation.** The selected ring and the thumb ring are both drawn as
`box-shadow: 0 0 0 Npx`, which is a CSS idiom for a ring that costs no layout. Natively both are
borders, and a border that appears only when selected shifts the layout unless the unselected state
carries a transparent border of the same width. Second, every state above is driven by a class or an
attribute rather than by a second component. `FooCard` plus `FooCardSelected` is wrong here as well.

## 8. Motion

The scale and the named transitions: [DESIGN.md §7](../../DESIGN.md). The decisions:
[design-direction.md §5](../design-direction.md). What a native implementation must carry:

- **Screen transitions say which kind of move you made** ([D-021]). Going a level deeper slides: the
  detail screen arrives from the trailing edge while the screen you left recedes a quarter of the way
  and blurs. Back plays it in reverse. The five tabs are not levels of each other, so they rise and
  fade instead. Sideways travel is spent only on depth.
- **Direction is read off history, never off the two route names.** Both directions between the same
  two screens are the same route change; only the history index says which way you went.
- **Arriving is slower than leaving.** Something you asked for should feel like it settled; something
  you dismissed should already be gone.
- **The sheet leaves on a spring seeded with the gesture's own velocity** ([D-032]), so a flick and a
  tap are the same motion at different speeds. This is why there is no close duration to copy.
- **Reduced motion has two layers and the in-app choice wins** ([D-014]). The phone's setting is
  honoured, but choosing to keep the motion in Settings genuinely keeps it.
- **Three things are deliberately off the scale** and should stay off it: the hero fills animating to
  value once on load, the day card's sun turning once every 24 seconds, and the splash. The first two
  are described in [design-direction.md §5](../design-direction.md); the sun is the one piece of
  motion in the app that exists purely for pleasure, which is why both reduced-motion layers stop it
  outright rather than slowing it.

Any motion work in the web app goes through the `transitions-dev` skill first ([D-016]). A native
implementation picks the token by what the motion does, not by the nearest number.

## 9. Iconography

- **One icon library, one style.** Every glyph is Hugeicons, drawn **duotone**: a soft fill at about
  0.4 opacity under a full-weight 1.5 stroke, both painted from **one colour**, so a single token
  moves both layers. There is no second icon set and no hand-drawn path.
- 51 glyphs are vendored into the app, so building and deploying need no token. They are drawn
  through one `Icon` component, never as inline SVG at a call site.
- **Icon size follows the chip rung it sits in** (18, 22, 24, 26), not a per-call-site choice.
- Reuse before adding. A near-match already in the set beats a new glyph that means the same thing.
- The brand mark is hand-authored and is not part of the icon set.

## 10. Layout systems

Five skeletons carry the whole app. Full anatomies are in
[design-direction.md §3](../design-direction.md).

| Skeleton | Shape |
|---|---|
| Home | A widget canvas the user owns: a grid of widget cells they add, remove and reorder ([D-035]) |
| Tab screen | Header, then a scrollable panel on a cool ground, shared by Calendar, Email, Tasks and More |
| Detail layer | Back bar with title and optional action, on the white top surface, over a tab |
| Module screen | Hero restating the tile you tapped, then the repeated module row, one anatomy across all five |
| Onboarding | Circular back button and continuous progress, a static frame, one question per screen |

**Navigation model, and it matters for the native router.** The five tabs are **siblings**:
`home`, `calendar`, `email`, `tasks`, `more`. Everything else is a **detail layer** that slides in
over a tab, carries its own back bar, and stands the tab bar down while it is open ([D-026]). Those
are two different kinds of move and they animate differently. A native implementation that puts
everything in one stack, or that keeps the tab bar visible over a detail screen, has changed the
product's structure rather than its styling.

## 11. Right to left, and language

Arabic, Urdu and Hindi are supported alongside English. Layout stays direction-safe throughout: no
hardcoded left or right, logical properties only. The full contract is in
[DESIGN.md §8](../../DESIGN.md) and the conversion is in [tokens.md §8](tokens.md).

Three things are deliberately not mirrored, and they are design decisions rather than oversights:
two pieces of fixed chrome keep their side, and one physical edge could not be avoided. A chevron
means "onward" and "back" rather than "right" and "left", so it turns with the direction.

Arabic and Urdu are one script and one face. Positive letter-spacing breaks Arabic-script joining, so
it is removed on those languages rather than reduced.

## 12. Accessibility

The standing rules, in the order they get broken:

- **A hit area of at least 44, even where the glyph is 20.** Several chips are 32.
- **Never state by colour alone.** Every tone in the app carries a label or a glyph beside it.
- **An error border never appears without its message.**
- **Reduced motion is honoured**, in the two-layer form above.
- **Text scales through the app's own three-step control.** Whether it should also follow the
  operating system's font size is an open question for the native build, and is question 25 in
  [rn-handoff-questions.md](rn-handoff-questions.md).
- Contrast is held in **both** themes, not checked in light and assumed in dark.

## 13. Deliberately not part of the system

Do not treat these as tokens to reconcile or components to port:

- The two archived onboarding concept prototypes and their palettes. They are superseded artefacts.
- The standalone development colour picker.
- The mini theme-preview mock in Settings. It is a drawing of the theme, not the theme, and its
  values live only inside that drawing.
- The desktop device frame and its faux phone chrome. It exists so the app can be looked at on a
  laptop, and on a phone it is not there at all.
