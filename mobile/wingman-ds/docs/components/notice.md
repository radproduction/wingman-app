---
type: Note
---
# Notice

A notification row. Unread sits on a white card, its chip wearing the accent dot; tap it (or Mark
all read) and it recedes into the panel - the screen literally empties as you clear it, and the
state change is the feedback. Live page: `/components/notice`.

## Anatomy

| Part | Spec |
|---|---|
| Card | Home-surface fill, radius lg, hairline. Padding `--row-pad-y` by `--space-16`, gap `--row-gap`, top-aligned. |
| Chip | The sm rung with the notice's tone and glyph. |
| Unread dot | A 10 accent circle on the chip's top-end corner, overhanging by 1 (optical, the [D-029] carve-out), ringed 2.5 in `--surface`. The same dot Email's sender chip wears. |
| Top line | Title `--fs-row`/500 and the time (12, muted) pushed apart on one baseline. |
| Body | `--fs-sub` / 1.4, muted, 4 above-gap. |

## Behaviour

- Read: ground drops to `--settled`, the hairline goes, title relaxes to 400 muted, chip dims to
  0.72. The one settled state that recedes - a settled module row keeps its elevation instead.
- Ground transitions over the quick duration; no transform. Only an approval action inside is a
  real control.
- Mark all read recedes every row at once; the emptying is the feedback, so no toast follows.
- RTL: the dot rides `inset-inline-end` and flips with the script.

## React Native contract

```tsx
interface NoticeProps {
  icon: IconName
  tone: ChipTone
  title: string
  time: string             // already formatted
  body: string
  read: boolean
  onRead: () => void
  approval?: string
}

// The dot's ring is a box-shadow spread on the web; natively a 2.5 border
// in the surface colour on a 15 circle, absolutely positioned off the
// chip's top-end corner. The -1 overhang is stated optical geometry - do
// not "fix" it to 0.
```

## Tokens

`--home-surface`, `--settled`, `--card-line`, `--surface`, `--accent`, `--muted`, `--row-pad-y`,
`--row-gap`, `--fs-row`, `--fs-sub`, `--radius-lg`, `--radius-pill`, `--space-4/16`,
`--duration-quick`, `--ease`, the chip tone pair.
