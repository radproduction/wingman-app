---
type: Note
---
# Pull-to-refresh

Split honestly in two: the gesture mechanism (a growing spacer on the web - natively RefreshControl
territory, which is why the roster files this under does-not-cross), and the branded indicator that
CAN cross - the header's W+Star mark un-drawing itself while its star rides down into the gap,
grows, and spins while the refresh runs. Live page: `/components/pull-spacer`. Assets and numbers:
the kit's `assets/brand.ts` (`PULL`, `WING_STAR`, `WING_W`).

## The mechanism (web only)

| Number | Meaning |
|---|---|
| resist 0.6 | Finger px to gap px - the pull lags the finger so the gap feels elastic. |
| maxPull 170 | The gap's ceiling. |
| trigger 96 | Release past this arms a refresh; progress = gap / 96, capped at 1. |
| held 56 | Where the gap parks while the refresh runs. |
| settle | 350ms smooth-out home; idle clears state transitions at 450ms. |

## The indicator (the part worth carrying)

Three paints of the header mark, scrubbed 1:1 off progress p and gap px d - no transitions during
the drag:

| Part | Rule |
|---|---|
| W fill | Opacity 1 - p x 5: gone by 20% of the pull. |
| W trace | Opacity p x 5; dashoffset p over a normalised path (0 drawn, 1 gone) - the splash's self-drawing W, reversed and finger-driven. Stroke width 24 at mark size. |
| Star | Its wrapper walks it to the mark's centre (-320 user units), rides it down d x 18 user units, turns it 2deg per px, grows it to 1 + p x 3.4. |
| Refreshing | The star itself spins 360deg every 900ms, linear - so the settle just stops the spin, no unwind, while the wrapper eases home and the W redraws, then re-fills. |

## Behaviour

- During the drag everything scrubs the finger; the web explicitly out-argues the reduced-motion
  clamp for the gesture's length - a finger is a finger.
- Short of the trigger, everything springs home and nothing fires.
- Reduced motion: the scrub stays, the spin becomes a hold, the settle places.

## React Native

Default to RefreshControl tinted to the accent - the mechanism is the platform's. Build the branded
indicator only as a whole: a custom scroll-driven header (Reanimated scroll offset standing in for
the pull progress) drawing the kit's WING_STAR and WING_W. A mark that fades without the star's
travel-grow-spin reads as broken, not branded - do not half-build it.
