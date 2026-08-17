import { ROW_TOKENS } from '../data'
import { Note, Section, Sub, Trap } from '../parts'
import { resolveUnder } from '../resolve'
import { tv } from '../tokenStore'

const DENSITY_ROWS = resolveUnder('data-density', null, ROW_TOKENS)
const DENSITY_COMPACT = resolveUnder('data-density', 'compact', ROW_TOKENS)

const TEXT_TOKENS = ['--fs-row', '--fs-sub'] as const
const TEXT_SMALL = resolveUnder('data-text', 'small', TEXT_TOKENS)
const TEXT_DEFAULT = resolveUnder('data-text', null, TEXT_TOKENS)
const TEXT_LARGE = resolveUnder('data-text', 'large', TEXT_TOKENS)

const AxisTable = ({
  columns,
  tokens,
  values,
}: {
  columns: readonly string[]
  tokens: readonly string[]
  values: readonly Record<string, string>[]
}) => (
  <div className="wgd-scroll">
    <table className="wgd-table">
      <thead>
        <tr>
          <th scope="col">Token</th>
          {columns.map((c) => (
            <th scope="col" key={c}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {tokens.map((name) => (
          <tr key={name}>
            <th scope="row">
              <code>{name}</code>
            </th>
            {values.map((set, i) => (
              <td key={columns[i]}>
                <code>{set[name] || '(not set)'}</code>
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
)

export const AxesSection = () => (
  <Section
    id="axes"
    title="Runtime axes"
    lead="Four things re-point tokens while the app is running: the theme, the list density, the text size, and the writing direction. All four are written onto the root element, which is why one dark block and one compact block are enough."
  >
    <Sub
      title="Theme"
      note="Three states: light, dark, and system, which follows the phone. Every colour token keeps its name and changes its value; no token is added or removed by the dark block."
    >
      <Note>
        Natively this is a theme context with the same three states. The value of following the phone is
        that it is a real choice a user made somewhere else, so it is honoured rather than overridden.
      </Note>
    </Sub>

    <Sub
      title="Density"
      note="Two states. Compact takes the air out of a row without moving the chip column, so a dense list still scans by glyph. Onboarding option rows are left at default on purpose: they are a flow you walk through once, not a list you live in."
    >
      <AxisTable
        columns={['comfortable', 'compact']}
        tokens={ROW_TOKENS}
        values={[DENSITY_ROWS, DENSITY_COMPACT]}
      />
      <Note>
        Note what compact does to the chip: the small rung folds down to extra small rather than the row
        simply losing padding. That is why a component asks for a rung and never for a diameter.
      </Note>
    </Sub>

    <Sub
      title="Text size"
      note="Three steps either side of the default and no further: enough to help without letting anyone break the layout."
    >
      <AxisTable
        columns={['small', 'default', 'large']}
        tokens={TEXT_TOKENS}
        values={[TEXT_SMALL, TEXT_DEFAULT, TEXT_LARGE]}
      />
      <div className="wgd-textsizes">
        {(
          [
            ['small', TEXT_SMALL],
            ['default', TEXT_DEFAULT],
            ['large', TEXT_LARGE],
          ] as const
        ).map(([label, set]) => (
          <div className="wgd-textsize" key={label}>
            <span className="wgd-textsize__tag">{label}</span>
            <span style={{ fontSize: set['--fs-row'], fontWeight: 500 }}>Flight to Dubai</span>
            <span style={{ fontSize: set['--fs-sub'], opacity: 0.62 }}>Checked in, gate at 6:40</span>
          </div>
        ))}
      </div>
    </Sub>

    <Sub
      title="Motion"
      note="Two layers, and the in-app choice wins. The phone's own reduce-motion setting is honoured, but choosing to keep the motion in Settings genuinely keeps it, which is why every media query in the app is guarded."
    >
      <Note>
        Natively that is the OS value plus app state layered over it. Built as the OS value alone, the
        Settings toggle silently does nothing.
      </Note>
    </Sub>

    <Sub
      title="Direction"
      note="English plus three right-to-left languages. Layout is direction-safe throughout: logical properties only, never a hardcoded left or right."
    >
      <div className="wgd-dir">
        <code>--dir</code>
        <span>
          {tv('--dir').light} in left-to-right, -1 under right-to-left. Anything that slides sideways in a
          transform multiplies by it, because a transform knows nothing about writing direction.
        </span>
      </div>
      <Note>
        Three things deliberately do not mirror: two pieces of fixed chrome keep their side, and one
        physical edge could not be avoided. A chevron means onward and back rather than right and left, so
        it turns with the direction. Arabic and Urdu are one script and one face, and positive
        letter-spacing breaks the joining, so it is removed on those languages rather than reduced.
      </Note>
    </Sub>

    <Trap>
      <p>
        <strong>All four are theme axes, not conditionals.</strong> Resolve them once into the theme object
        so a component reads <code>theme.rowPadY</code> and never asks which density it is in. Density in
        particular is not a font-size change.
      </p>
      <p>
        <strong>The direction multiplier transfers almost exactly</strong>, because React Native transforms
        also know nothing about writing direction: <code>I18nManager</code> flips layout, but a{' '}
        <code>translateX</code> in an animation still needs its sign flipped by hand. Everything else is
        layout, and the <code>start</code> and <code>end</code> props are the direct equivalent of the
        logical properties used here.
      </p>
      <p>
        <strong>One product decision hides in this section.</strong>{' '}
        <code>I18nManager.forceRTL</code> needs an app restart to take effect, and the web app switches
        language live. That is a real difference in the experience, not an engineering detail to work
        around quietly.
      </p>
    </Trap>
  </Section>
)
