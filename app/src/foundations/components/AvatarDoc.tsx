import { Avatar } from '../../app/Avatar'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const CONTRACT = `// wg/Avatar.tsx - implement to match.
interface AvatarProps { id: string }   // the person's initial - the only
                                       // identity the attendee stack carries
// Renders ONE of, inside whatever Chip it is dropped into:
//   - a real photograph, cover-cropped to the chip's circle, for the mapped
//     initials (the owner and the recurring cast);
//   - otherwise a DRAWN portrait: flat, no facial features - at 24 in an
//     attendee stack, eyes turn to mush while hair silhouette, hair colour
//     and skin tone stay legible.
//
// The seed rule is the contract's heart: same seed, same face, everywhere.
//   seed = FNV-1a(initial); pick skin of 4, hair colour of 3, style of 5
// Port the SAME hash and the SAME closed lists, so Sarah in a Thursday
// meeting on native is the face Sarah wears on the web.
//
// The shirt is currentColor: it takes the tone the chip is already set to,
// and themes with the palette for free. Skin and hair are fixed in both
// themes - a person does not change colour at sunset.
//
// Companies never reach Avatar: Email renders their initial as a plain
// letter (15/500) in an untinted chip, so Stripe's S and Sarah's S stay a
// letter and a face.`

const CAST = ['A', 'S', 'R', 'B', 'D', 'H'] as const
const DRAWN = ['M', 'K', 'T', 'Z', 'F', 'N'] as const

export const AvatarDoc = () => (
  <>
    <p className="wgd-lead">
      People get faces ([D-017]). A real photograph for the recurring cast, a drawn portrait for everyone
      else - seeded from the person's initial, so the same person wears the same face in every list,
      stack and meeting, on every screen.
    </p>

    <DocSection title="Specimen">
      <Stage ground="home">
        {CAST.map((id) => (
          <span key={id} className="wg-chip lavender md">
            <Avatar id={id} />
          </span>
        ))}
      </Stage>
      <Note>The cast with photographs, each cover-cropped to its chip's circle.</Note>
      <Stage ground="home">
        {DRAWN.map((id) => (
          <span key={id} className="wg-chip mint md">
            <Avatar id={id} />
          </span>
        ))}
      </Stage>
      <Note>
        Drawn portraits for everyone else: flat, featureless on purpose, distinct by hair silhouette, hair
        colour and skin tone. The shirt is currentColor, so it picks up whatever tone the chip carries -
        these six wear mint because their chips do.
      </Note>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Frame', spec: 'A Chip. The face fills it edge to edge - no stroke, no inset; the photo IS the disc.' },
          { part: 'Photo', spec: 'Cover-cropped, centred, clipped to the circle, undistorted at any rung (24 in a stack, 52 in a hero).' },
          { part: 'Drawn portrait', spec: 'Head high and large, bust wide and low, barely any neck: portrait proportions. No facial features - they turn to mush at 24.' },
          { part: 'Palette', spec: '4 skins x 3 hair colours x 5 styles, closed lists. Skin and hair fixed in both themes; only the shirt themes, via currentColor.' },
          { part: 'Seed', spec: 'FNV-1a over the initial, unsigned. Same seed, same face, every time and everywhere.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'id', type: 'string', rn: 'id: string', desc: "The person's initial - the only identity the attendee stack carries. A mapped initial shows its photo; anyone else gets the drawn portrait." },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Companies', rule: "Never a face. Email renders a company's initial as a plain letter in an untinted chip, so a shared initial stays a letter and a face." },
          { state: 'Decorative', rule: 'The face is hidden from assistive tech; the row that contains it carries the name.' },
          { state: 'Collisions', rule: 'Two people sharing an initial would share a face; in this data every initial is its own person.' },
        ]}
      />
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        The portable part is the <strong>seed rule</strong>: port the same FNV-1a hash and the same closed
        lists, and a person's face matches across web and native without shipping a single image for the
        drawn cast. The portrait paths are plain SVG - they cross through{' '}
        <code>react-native-svg</code> like the icons do.
      </Trap>
      <Contract label="wg/Avatar.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
