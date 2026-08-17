import { useState } from 'react'
import { Icon } from '../../app/icons'
import { APP_ICONS, appIconUri, type AppIconKey } from '../../shell/appIcon'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const THEME_CONTRACT = `// wg/ThemePicker.tsx - implement to match.

type ThemeChoice = 'light' | 'dark' | 'system'

interface ThemePickerProps {
  value: ThemeChoice
  onChange: (next: ThemeChoice) => void
}

// Three tiles, capped at 96 wide and centred - phones you look at, not
// a strip of artwork. Each tile is a column at gap 8: frame, mark, name.
//
// frame: aspect 100/160, radius md, holding a DRAWING of the app's Home
// (a mock, not a live render); an OUTER 1 frameLine hairline - inset, it
// vanishes on the dark face; missing, the light face melts into the
// panel.
// selected: the frame keeps its hairline, then a 2 gap of the panel
// colour, then the accent at 5 - the ring reads as around the phone,
// not drawn on it. The name turns accentDeep.
// system: the same drawing split down the middle, the dark half
// clipped over the light - one phone, two futures.
// mark: the option rows' 22 selection mark one size down (20).
//
// The dark drawing's palette is ITS OWN mock palette, not the dark
// theme tokens: a drawing of dark, stable even while the real dark
// theme evolves.`

const ICON_CONTRACT = `// wg/AppIconPicker.tsx - implement to match.

interface AppIconPickerProps {
  value: AppIconKey        // 'midnight' | 'paper' | 'blue' | 'aurora'
  onChange: (next: AppIconKey) => void
}

// Four faces across, capped at 66, centred on the theme row's gap so
// the two pickers read as one centred column. Same anatomy one row
// down: art, mark (18), name (12.5/500).
//
// art: the icon itself at radius 22% - the icon's own corner, so the
// tile IS the icon; the same outer hairline + ring recipe as the theme
// frames. Press scales the art to 0.94.
//
// Natively this maps to alternate app icons
// (expo-alternate-app-icons / setAlternateIconName): picking a face
// changes the HOME SCREEN icon, and iOS shows its own system alert the
// first time - say so in the row's support copy rather than fighting it.`

const THEMES = [
  { key: 'light', name: 'Light' },
  { key: 'dark', name: 'Dark' },
  { key: 'system', name: 'System' },
] as const

const FaceMock = () => (
  <svg className="wg-theme__mock" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
    <rect width="100" height="160" fill="var(--m-bg)" />
    <circle cx="12" cy="13" r="4.5" fill="var(--m-block)" />
    <rect x="45" y="11" width="10" height="4" rx="2" fill="var(--m-block)" />
    <circle cx="88" cy="13" r="4.5" fill="var(--m-block)" />
    <rect x="8" y="28" width="84" height="34" rx="6" fill="var(--m-card)" stroke="var(--m-track)" />
    <circle cx="24" cy="45" r="9" fill="none" stroke="var(--m-accent)" strokeWidth="4" />
    <rect x="8" y="70" width="84" height="82" rx="8" fill="var(--m-panel)" />
    <rect x="14" y="78" width="72" height="16" rx="4" fill="var(--m-card)" />
    <rect x="14" y="100" width="72" height="16" rx="4" fill="var(--m-card)" />
    <rect x="14" y="122" width="46" height="16" rx="4" fill="var(--m-card)" />
  </svg>
)

const ThemeDemo = () => {
  const [picked, setPicked] = useState<'light' | 'dark' | 'system'>('light')
  return (
    <Stage ground="panel">
      <div className="wg-themes" style={{ width: '100%', maxWidth: 380 }}>
        {THEMES.map((th) => (
          <button key={th.key} type="button" className={`wg-theme ${picked === th.key ? 'on' : ''}`} onClick={() => setPicked(th.key)}>
            <span className="wg-theme__frame">
              <span className={`wg-theme__face ${th.key === 'dark' ? 'dark' : ''}`}>
                <FaceMock />
              </span>
              {th.key === 'system' && (
                <span className="wg-theme__face dark half">
                  <FaceMock />
                </span>
              )}
            </span>
            <span className="mark">
              <Icon name="check" size={13} />
            </span>
            <span className="wg-theme__name">{th.name}</span>
          </button>
        ))}
      </div>
    </Stage>
  )
}

const IconDemo = () => {
  const [picked, setPicked] = useState<AppIconKey>(APP_ICONS[0].key)
  return (
    <Stage ground="panel">
      <div className="wg-icons" style={{ width: '100%', maxWidth: 380 }}>
        {APP_ICONS.map((face) => (
          <button key={face.key} type="button" className={`wg-icon ${picked === face.key ? 'on' : ''}`} onClick={() => setPicked(face.key)}>
            <img className="wg-icon__art" src={appIconUri(face.key)} alt="" />
            <span className="mark">
              <Icon name="check" size={13} />
            </span>
            <span className="wg-icon__name">{face.name}</span>
          </button>
        ))}
      </div>
    </Stage>
  )
}

export const ThemePickerDoc = () => (
  <>
    <p className="wgd-lead">
      Three little phones - light, dark, and one split down the middle for system - each a drawing of
      Home, not a live render. Selection is the accent ring around the phone, standing off the frame
      by a gap of the panel's own colour.
    </p>

    <DocSection title="Specimen">
      <ThemeDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Three tiles capped at 96 wide, centred, at the shared --pick-gap - phones you look at, not artwork edge to edge.' },
          { part: 'Frame', spec: 'Aspect 100/160, radius md, an OUTER 1 --frame-line hairline: inset it vanishes on the dark face, and without it the light face melts into the panel.' },
          { part: 'Face', spec: 'A drawing of Home on its own mock palette - a drawing of dark, deliberately not the dark theme\'s tokens. System clips the dark drawing over the light at 50%.' },
          { part: 'Selected ring', spec: 'Hairline, then 2 of the panel colour, then the accent at 5 - the ring reads as around the phone, never drawn on it. The name turns --accent-deep.' },
          { part: 'Mark + name', spec: 'The option rows\' selection mark one size down (20), and the 14/500 name.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Pick', rule: 'The ring and mark arrive over the quick duration and the app re-themes immediately - the picker itself is the preview\'s proof.' },
          { state: 'System', rule: 'One phone, two futures: the split face says "follows the phone" without a sentence of copy.' },
          { state: 'Drawing, not render', rule: 'The faces are mocks on their own palette, so the tiles stay stable while the real themes evolve.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --frame-line, --panel, --accent, --accent-deep, --track, --on-accent, --pick-gap,
        --radius-md, --radius-pill, --space-4/8, --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Contract label="wg/ThemePicker.tsx" code={THEME_CONTRACT} />
    </DocSection>
  </>
)

export const AppIconPickerDoc = () => (
  <>
    <p className="wgd-lead">
      Four faces of the same wing: the icon the app wears on the home screen. The tile is the icon
      itself at its own 22% corner, with the shared ring recipe and mark - the theme picker's anatomy
      one row down, so the two read as one centred column.
    </p>

    <DocSection title="Specimen">
      <IconDemo />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Row', spec: 'Four faces capped at 66, centred on the theme row\'s --pick-gap: four faces plus three gaps equal three theme tiles plus two, so the pickers align as one column.' },
          { part: 'Art', spec: 'The icon at radius 22% - its own corner, so the tile IS the icon - with the outer --frame-line hairline that holds on the pale faces and the near-black one alike.' },
          { part: 'Selected ring', spec: 'The theme frames\' recipe exactly: hairline, 2 of panel, accent at 5.' },
          { part: 'Mark + name', spec: 'The shared mark at 18, and the 12.5/500 name.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Press', rule: 'The art scales to 0.94; the ring answers the pick over the quick duration.' },
          { state: 'What it changes', rule: 'On the web, the tab favicon rewrites at runtime. Natively it is the actual home-screen icon.' },
          { state: 'The wing', rule: 'Every face draws the same W+Star mark - the faces differ only in ground and wing treatment.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <Note>
        --frame-line, --panel, --accent, --track, --on-accent, --pick-gap, --radius-pill,
        --space-4/8, --duration-quick, --ease.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Alternate app icons are a platform feature with platform ceremony: iOS shows a system alert on
        the first change, and Android needs activity-alias juggling that can briefly kill the app.
        Use the Expo module for it, warn in the support copy, and never fake it with an in-app-only
        icon - the promise of this picker is the home screen.
      </Trap>
      <Contract label="wg/AppIconPicker.tsx" code={ICON_CONTRACT} />
    </DocSection>
  </>
)
