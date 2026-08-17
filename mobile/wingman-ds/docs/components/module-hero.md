---
type: Note
---
# Module hero

The tapped Home tile, restated as the module screen's opening card: the value at full size, the
evidence under it, the module's chip grown to the lg rung - and no title, because the back bar
already says where you are. Under it, Wingman's one-line read; at the foot, the WhatsApp handoff.
Live page: `/components/module-hero`. Drawn in 23 app files - the roster's most-drawn pattern.

## Anatomy

| Part | Spec |
|---|---|
| Hero card | Home-surface, radius lg, hairline, padding `--space-16`, gap `--space-16`. Value and sub on the start side, the module's lg chip on the end. |
| Value | 26/400 / 1.15, -0.015em - the tile's value one size up. No title: the back bar carries it. |
| Sub | 13.5 muted, 4 below: the evidence line, unchanged from the tile. |
| Brief line | The spark and one sentence of Wingman's read - quieter than the assistant summary, one line, never a paragraph. |
| Ask | The full-width WhatsApp Button (`wg-btn full wa`) at the screen's foot. The FAB stands down on the detail layer; the app shows the state, WhatsApp is where you act. |

## Behaviour

- The zoom: hero and Bento tile are the same object at two sizes - same chip, same words. Build both
  from the same data object so they cannot drift.
- An unset module carries its own closing state instead of the ask button.
- One anatomy, five screens: Bills, Deliveries, Travel, People, Health.

## Audit note, resolved

`wg-mod` is ONE component. The extra rules at business.css:924 and mobility.css:272 are context
styles scoped under the module screen's class, not second definitions (inventory open question 3).

## React Native contract

```tsx
interface ModuleHeroProps {
  value: string
  sub: string
  icon: IconName
  tone: ChipTone
  brief?: string
  ask?: { thing: string; onAsk: () => void }
}
// Build the module screen as ONE scaffold taking hero data, rows and the
// ask - not five screens that each hand-assemble it.
```

## Tokens

`--home-surface`, `--card-line`, `--muted`, `--radius-lg`, `--space-4/8/12/16`, `--chip-lg`, the
module's chip tone pair, the Button's wa tokens.
