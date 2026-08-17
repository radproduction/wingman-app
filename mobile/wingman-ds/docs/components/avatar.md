---
type: Note
---
# Avatar

People get faces ([D-017]): a real photograph for the recurring cast, a drawn portrait for everyone
else, seeded from the person's initial so the same person wears the same face everywhere. The face
fills whatever Chip it is dropped into. Live page: `/components/avatar`.

## Rules

- **Frame**: a Chip. The face fills it edge to edge - no stroke, no inset; the photo is the disc.
- **Photo**: cover-cropped, centred, clipped to the circle, undistorted at any rung.
- **Drawn portrait**: flat, featureless on purpose - at 24px in an attendee stack, eyes turn to
  mush while hair silhouette, hair colour and skin tone stay legible. 4 skins x 3 hair colours x 5
  styles, closed lists.
- **Seed**: FNV-1a over the initial, unsigned. Same seed, same face, every time and everywhere.
- **Theming**: the shirt is currentColor - it takes the chip's tone. Skin and hair are fixed in
  both themes; a person does not change colour at sunset.
- **Companies never get a face**: Email renders a company initial as a plain letter (15/500) in an
  untinted chip, so Stripe's S and Sarah's S stay a letter and a face.

## React Native contract

```tsx
interface AvatarProps { id: string }   // the person's initial
```

The portable part is the seed rule: port the **same FNV-1a hash and the same closed lists**, and a
person's face matches across web and native without shipping images for the drawn cast. The portrait
paths are plain SVG and cross through `react-native-svg` like the icons do.
