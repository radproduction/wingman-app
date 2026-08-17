---
type: Note
---
# Screen transition

Going a level deeper slides the new screen in from the trailing edge while the one you left recedes
behind it; back plays it in reverse. A MOTION CONTRACT, not a component: the numbers cross to the
native navigator, the browser machinery underneath them does not. Live page:
`/components/screen-transition`.

## The contract

| Part | Spec |
|---|---|
| Push | Arriving screen: translateX +100% to 0, on top of everything (tab bar included). Leaving screen: recedes 25% with a 3px blur. |
| Pop | The exact reverse - and it is the leaving screen that travels, over the one being revealed. |
| Clock | 250ms (`--page-slide-dur`), cubic-bezier(0.22, 1, 0.36, 1), both directions, both screens. |
| Tab bar | Drops off the bottom edge on push, rides back on pop, in lockstep with the slide. No fade. |
| Tabs | Tab to tab is not a push: the arriving tab plays the rise-and-fade screen enter; nothing slides. |

## Behaviour

- Direction is computed from history, never from comparing routes - the browser's own Back animates
  correctly today, and the platform back gesture must run the same pop natively.
- While sliding: the leaving screen answers no taps; the arriving screen suppresses its own
  rise-and-fade.
- RTL: both distances are signed - deeper is off the trailing edge, so the transition mirrors with
  the writing direction.
- Reduced motion: the slide is dropped, not shortened.

## React Native

Port the numbers, not the mechanism. The two alternating slot layers, the monotonic history index
and holding the outgoing screen for the animation's length exist only because a browser's Back
button does not say which way it went - the navigator already knows. (Assumed Expo Router v6 /
native-stack, open questions 15 and 16: either the navigator's animation options get close enough,
or the transition is built custom in Reanimated to hit these numbers exactly.)

## Tokens

`--page-slide-dur` (250ms), `--page-slide-distance` (100%), `--page-parallax` (25%), `--page-blur`
(3px), `--page-slide-ease`. Deliberately off the `--distance-*` scale: those describe motion within
a screen, not a screen-sized push.
