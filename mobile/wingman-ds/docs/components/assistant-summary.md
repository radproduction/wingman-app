---
type: Note
---
# Assistant summary

The personalized read at the top of a screen: Wingman, in its own voice, telling you what the day or
the screen amounts to before you scan a single row. One spark, one paragraph, first person - and
seventeen screens open with it: the most reused block in the app after the primitives. Live page:
`/components/assistant-summary`.

## Anatomy

| Part | Spec |
|---|---|
| Card | Home-surface fill, radius lg, hairline, padding `--space-16`. A row at gap `--space-12`, top-aligned. |
| Spark | The 18 spark glyph in `--tone-mint`, nudged `--space-4` down onto the first line's cap height. |
| Paragraph | 15.5 / 1.5 - a step warmer and larger than a brief line. Bold runs at 600 carry the address and the verdict. |

## Behaviour

- Voice: first person, present tense, addressed to the user. It reads the screen; it never labels
  it. If the sentence would survive as a heading, rewrite it.
- First in the panel, before any list or grid.
- Not pressable. Anything actionable it mentions has its own row or button below.

## React Native contract

```tsx
interface AssistantSummaryProps {
  children: ReactNode      // the paragraph; bold spans at 600
}

// ONE Text element with nested bold spans - splitting the address into its
// own Text puts it on its own line and the card stops reading as a spoken
// sentence. No title, icon or action props, deliberately: the moment it
// grows them it becomes another card, and the one block that is
// unmistakably Wingman's voice disappears.
```

## Tokens

`--home-surface`, `--card-line`, `--tone-mint`, `--radius-lg`, `--space-4/12/16`.
