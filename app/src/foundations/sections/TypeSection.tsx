import { TEXT_ROLES, TYPE_TOKENS } from '../data'
import { Code, Note, Section, Sub, TokenTable, Trap } from '../parts'
import { tv } from '../tokenStore'

const SAMPLE = 'Two meetings moved, one needs you'

export const TypeSection = () => (
  <Section
    id="type"
    title="Typography"
    lead={
      <>
        Regular is the default and Medium is the only emphasis weight. Hierarchy comes from size and colour,
        not from boldness, and headings are Regular. A reimplementation that reaches for bold headings has
        changed the design rather than approximated it.
      </>
    }
  >
    <Sub title="Face and metrics">
      <TokenTable tokens={TYPE_TOKENS} />
      <Note>
        The face is re-pointed per language: Google Sans Flex draws Latin only, so Arabic and Urdu add Noto
        Sans Arabic and Hindi adds Noto Sans Devanagari. The pill metrics are stated rather than inherited,
        because leaving the line box to the font meant every pill in the app grew 9 to 12 pixels the moment
        the language changed.
      </Note>
    </Sub>

    <Sub
      title="Role ramp"
      note="Most sizes are applied per component rather than tokenized, so this is the design intent. Each row renders at its own spec."
    >
      <div className="wgd-scroll">
        <table className="wgd-table">
          <thead>
            <tr>
              <th scope="col">Role</th>
              <th scope="col">Spec</th>
              <th scope="col">Specimen</th>
              <th scope="col">Use</th>
            </tr>
          </thead>
          <tbody>
            {TEXT_ROLES.map((role) => (
              <tr key={role.role}>
                <th scope="row">
                  <code>{role.role}</code>
                </th>
                <td>
                  <code>
                    {role.size} / {role.weight}
                    {role.lineHeight ? ` / ${Math.round(role.lineHeight * 100)}%` : ''}
                    {role.tracking ? ` / ${role.tracking}` : ''}
                  </code>
                </td>
                <td>
                  <span
                    className="wgd-specimen"
                    style={{
                      fontSize: role.size,
                      fontWeight: role.weight,
                      lineHeight: role.lineHeight ?? 1.2,
                      letterSpacing: role.tracking ? `${Number.parseFloat(role.tracking) / 100}em` : undefined,
                      textTransform: role.role === 'overline' ? 'uppercase' : undefined,
                    }}
                  >
                    {SAMPLE}
                  </span>
                </td>
                <td>{role.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sub>

    <Trap>
      <p>
        <strong>The rounded axis needs a decision before any native screen is built.</strong> The app applies{' '}
        <code>font-variation-settings: 'ROND' {tv('--font-round').light || '100'}</code> on the root element,
        and that single axis is a large part of how Wingman looks. React Native has no cross-platform way to
        set an arbitrary variation axis. The workable answer is static instances of the face with the axis
        baked in, one per weight in use, registered as named families. Confirm the licence allows it before
        building on it; if it does not, the fallback is a different face, which is a visible design change.
      </p>
      <p>
        <strong>Line height is unitless here and absolute there.</strong> <code>--pill-line</code> is a ratio,
        so every use becomes <code>fontSize * ratio</code>, computed per component rather than copied.
      </p>
      <p>
        <strong>The optical nudge is in em.</strong> <code>--pill-nudge</code> sinks a pill's label onto its
        optical centre as asymmetric padding, so the pill's height is unchanged and the text is not blurred.
        Natively it is <code>fontSize * 0.055</code>, it needs{' '}
        <code>includeFontPadding: false</code> on Android, and it is zeroed for Arabic, Urdu and Hindi, which
        are set in Noto faces with their own metrics.
      </p>
      <Code>{`// pill label, React Native
const nudge = fontSize * 0.055   // zero for ar / ur / hi
paddingTop: base + nudge,
paddingBottom: base - nudge,
lineHeight: fontSize * 1.3,
includeFontPadding: false,       // Android`}</Code>
    </Trap>
  </Section>
)
