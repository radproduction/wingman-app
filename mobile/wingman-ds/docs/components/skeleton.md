---
type: Note
---
# Skeleton

A feed, drawn before it has anything to say: a placeholder in the content's own shape, pulsing, then
a cross-fade + cross-blur reveal. Live page: `/components/skeleton`.

- Two layers in one cell. Skeleton above until loaded, then it blurs out as the content blurs in,
  both over `--reveal-dur` with `--reveal-ease` and `--reveal-blur`. Content is untouchable until it
  is readable.
- The pulse rides the bars, not the layer (the layer's opacity belongs to the cross-fade). The feed
  skeleton dips to 0.5 and breathes exactly twice - two beats that fill `--skel-hold`, so content
  arrives on a full-opacity beat instead of catching the pulse mid-dim.
- Shapes are built from the row tokens, so density and text-size settings move placeholder and
  content together.
- The skeleton never mirrors real counts - one that knew how many mails you had would be claiming to
  have loaded them. One screenful, always.

```tsx
interface SkeletonHostProps {
  loaded: boolean
  skeleton: ReactNode      // the placeholder, in the content's own shape
  children: ReactNode
}
// Native: the cross-blur is intent - keep it where the platform gives blur
// cheaply, degrade to the opacity cross-fade alone where it does not. The
// fade is the load-bearing half. Reduced motion: pulse stops, reveal is a swap.
```
