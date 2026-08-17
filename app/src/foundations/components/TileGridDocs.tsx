import { Icon } from '../../app/icons'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage } from './docParts'

const GRID_CONTRACT = `// wg/TileGrid.tsx - implement to match.

interface TileGridProps {
  children: ReactNode      // BentoTiles (or Business's status cards)
}

// Two equal columns, gap 8. That is the whole component - and that is the
// point: the grid carries no surface, no padding, no scroll. It is the
// rhythm, the tiles are the ink.
//
// Natively: flexDirection row + flexWrap with each tile at
// width: (100% - 8) / 2, or a two-column list. Never a horizontal scroll -
// the grid wraps, it does not pan.`

const TILE_CONTRACT = `// wg/BentoTile.tsx - implement to match.

interface BentoTileProps {
  icon: IconName
  tone: ChipTone
  title: string            // 13/500 beside the chip
  value: string            // the headline: what Wingman knows right now
  sub: string              // the evidence, muted
  onPress: () => void      // a tile is a door into its module
}

// Geometry, from the theme:
//   tile: home-surface fill, radius lg, hairline (cardLine), padding 16,
//   column at gap 4, START-aligned (never centred)
//   head row: sm chip + title, gap 12, then 12 below-margin
//   value 18/400 / 1.15 - the largest thing on the tile, deliberately
//   regular weight: a reading, not a shout
//   sub 12 / 1.35, muted
//
// Business's status cards (wg-card) are THIS SAME ANATOMY under another
// class, on purpose: tapping from the Home tile into a Business card must
// read as a zoom into the same object. Build ONE native component and use
// it in both places; do not fork it.`

export const TileGridDoc = () => (
  <>
    <p className="wgd-lead">
      Two equal columns at gap 8, and nothing else. The grid that holds Home's Watching-for-you tiles
      and Business's status cards; it owns the rhythm and stays out of the ink.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-grid" style={{ width: '100%', maxWidth: 420 }}>
          {(
            [
              ['receipt', 'sand', 'Bills', '2 due this week', 'Electricity is higher than usual'],
              ['box', 'blue', 'Deliveries', '1 arriving', 'Your parcel clears customs today'],
            ] as const
          ).map(([icon, tone, title, value, sub]) => (
            <button type="button" className="wg-tile wg-card-line" key={title}>
              <span className="wg-tile__head">
                <span className={`wg-chip ${tone} sm`}>
                  <Icon name={icon} size={24} variant="duotone" />
                </span>
                <span className="ti">{title}</span>
              </span>
              <span className="val">{value}</span>
              <span className="sub">{sub}</span>
            </button>
          ))}
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Grid', spec: 'grid-template-columns 1fr 1fr, gap --space-8. No surface, no padding: the tiles carry all of that.' },
          { part: 'Cells', spec: 'Bento tiles (the next page), or Business\'s status cards - the same anatomy under another class.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Wrap, never pan', rule: 'The grid wraps to new rows; it is never a horizontal scroll.' },
          { state: 'Count', rule: 'The dashboard sizes it: four tiles on the md widget, six on lg. The grid itself does not care.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>--space-8.</Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/TileGrid.tsx" code={GRID_CONTRACT} />
    </DocSection>
  </>
)

export const BentoTileDoc = () => (
  <>
    <p className="wgd-lead">
      One module, one glance: chip and label on the top row, then what Wingman knows right now as the
      tile's headline, with the evidence muted underneath. Tapping it opens the module - a tile is a
      door, and the module screen restates it as the hero.
    </p>

    <DocSection title="Specimen">
      <Stage ground="panel">
        <div className="wg-grid" style={{ width: '100%', maxWidth: 420 }}>
          <button type="button" className="wg-tile wg-card-line">
            <span className="wg-tile__head">
              <span className="wg-chip peach sm">
                <Icon name="plane" size={24} variant="duotone" />
              </span>
              <span className="ti">Travel</span>
            </span>
            <span className="val">Trip in 12 days</span>
            <span className="sub">Check-in opens Thursday</span>
          </button>
          <button type="button" className="wg-tile wg-card-line">
            <span className="wg-tile__head">
              <span className="wg-chip rose sm">
                <Icon name="heart" size={24} variant="duotone" />
              </span>
              <span className="ti">Health</span>
            </span>
            <span className="val">Recovered</span>
            <span className="sub">Slept 7h 10m, HRV steady</span>
          </button>
        </div>
      </Stage>
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Tile', spec: 'Home-surface fill, radius lg, hairline (--card-line), padding --space-16. A start-aligned column at gap --space-4.' },
          { part: 'Head', spec: 'sm chip and the 13/500 label, gap --space-12, with --space-12 below before the value.' },
          { part: 'Value', spec: '18/400 / 1.15 - the tile\'s headline. Regular weight on purpose: a reading, not a shout.' },
          { part: 'Sub', spec: '12 / 1.35, muted. The evidence for the value.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'icon + tone', type: 'IconName + ChipTone', rn: 'icon: IconName; tone: ChipTone', desc: 'The module\'s identity chip.' },
          { prop: 'title', type: 'string', rn: 'title: string', desc: 'The module\'s name.' },
          { prop: 'value', type: 'string', rn: 'value: string', desc: 'What Wingman knows right now.' },
          { prop: 'sub', type: 'string', rn: 'sub: string', desc: 'The evidence, muted.' },
          { prop: 'onClick', type: '() => void', rn: 'onPress: () => void', desc: 'Opens the module screen.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Press', rule: 'The whole tile is the target; it navigates, it never toggles. Press feedback is the screen-level tier, no transform of the tile itself.' },
          { state: 'The zoom', rule: 'The module screen restates the tile as its hero - same chip, same words - so the push reads as the tile expanding, not as a new place.' },
          { state: 'Dark', rule: 'The home-surface ground follows the theme (white in light, the base charcoal in dark); the tile recesses into the feed panel the same way in both.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --home-surface, --card-line, --muted, --radius-lg, --space-4/12/16, --chip-sm, the chip tone
        pair.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Business's status cards are this same anatomy under another class (<code>wg-card</code>), kept
        separate in CSS only so Business does not drag Home's layout. Natively that duplication must
        NOT survive: build one component, use it in both grids - the whole point of the shared anatomy
        is that the tap into Business reads as a zoom into the same object.
      </Trap>
      <Contract label="wg/BentoTile.tsx" code={TILE_CONTRACT} />
    </DocSection>
  </>
)
