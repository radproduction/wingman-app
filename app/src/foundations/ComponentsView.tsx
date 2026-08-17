import { COMPONENTS, TIER_TITLES, TIERS, findComponent, type ComponentEntry, type ComponentStatus } from './components-catalog'
import { DOC_PAGES } from './components/registry'
import { navigateDocs } from './route'

const STATUS_LABEL: Record<ComponentStatus, string> = {
  documented: 'documented',
  pending: 'page pending',
  blocked: 'contract pending',
  decide: 'needs a decision',
  'web-only': 'does not cross',
}

const liveStatus = (entry: ComponentEntry): ComponentStatus =>
  DOC_PAGES[entry.id] ? 'documented' : entry.status

const Row = ({ entry }: { entry: ComponentEntry }) => {
  const status = liveStatus(entry)
  return (
    <button
      type="button"
      className="wgd-roster__row"
      onClick={() => navigateDocs({ view: 'components', component: entry.id })}
    >
      <span className="wgd-roster__name">{entry.name}</span>
      <code className="wgd-roster__family">{entry.family}</code>
      <span className="wgd-roster__used">{entry.used || '-'}</span>
      <span className="wgd-roster__figma">{entry.figma ?? '-'}</span>
      <span className={`wgd-status wgd-status--${status}`}>{STATUS_LABEL[status]}</span>
    </button>
  )
}

export const ComponentsOverview = () => (
  <div className="wgd-page">
    <h1 className="wgd-h1">Components</h1>
    <p className="wgd-lead">
      {COMPONENTS.length} entries, audited from the code rather than invented. The full roster, including
      the screen patterns not listed here, is in{' '}
      <code>design/design-system/component-inventory.md</code>: 161 class families folded into roughly 85
      components.
    </p>
    <p className="wgd-note">
      The <strong>used</strong> column counts how many app files draw the thing. It is the build order: the
      high numbers are what a native app needs on day one.
    </p>

    {TIERS.map((tier) => {
      const rows = COMPONENTS.filter((entry) => entry.tier === tier)
      if (!rows.length) return null
      return (
        <section className="wgd-roster" key={tier}>
          <h2 className="wgd-h2">{TIER_TITLES[tier]}</h2>
          <div className="wgd-roster__head">
            <span>Component</span>
            <span>Class family</span>
            <span>Used</span>
            <span>Figma</span>
            <span>Status</span>
          </div>
          {rows
            .slice()
            .sort((a, b) => b.used - a.used)
            .map((entry) => (
              <Row key={entry.id} entry={entry} />
            ))}
        </section>
      )
    })}
  </div>
)

export const ComponentPage = ({ id }: { id: string }) => {
  const entry = findComponent(id)
  if (!entry) return <ComponentsOverview />
  const status = liveStatus(entry)
  const Page = DOC_PAGES[entry.id]

  return (
    <div className="wgd-page">
      <button type="button" className="wgd-back" onClick={() => navigateDocs({ view: 'components', component: null })}>
        All components
      </button>
      <h1 className="wgd-h1">{entry.name}</h1>
      <div className="wgd-meta">
        <span className={`wgd-status wgd-status--${status}`}>{STATUS_LABEL[status]}</span>
        <code>{entry.family}</code>
        <span>{entry.used ? `drawn in ${entry.used} app file${entry.used === 1 ? '' : 's'}` : 'not drawn in the app'}</span>
        {entry.figma ? <span>Figma: {entry.figma}</span> : null}
      </div>
      {entry.note ? <p className="wgd-lead">{entry.note}</p> : null}

      {Page ? (
        <Page />
      ) : entry.status === 'web-only' ? (
        <div className="wgd-trap">
          <span className="wgd-trap__tag">React Native</span>
          <div>
            <p>
              This is a browser mechanism rather than a design decision, and it stops at the boundary. It is
              catalogued so nobody spends a sprint rebuilding it natively.
            </p>
          </div>
        </div>
      ) : (
        <div className="wgd-pending">
          <p>
            <strong>This page is not written yet.</strong> The roster was audited first, deliberately, so
            the size of the job is visible before any of it is done.
          </p>
          <p>When it is written it will carry:</p>
          <ul className="wgd-list">
            <li>What it is, when to use it, and when not to</li>
            <li>A live specimen with every state and variant</li>
            <li>Anatomy, with the spacing and size token behind each part</li>
            <li>Props, each row mapped to its React Native equivalent</li>
            <li>The tokens it consumes, by name</li>
            <li>Behaviour: press, disabled, selected, error, loading, empty, long text, right-to-left</li>
            <li>An RN contract: the TypeScript signature, its enums, defaults and geometry</li>
          </ul>
        </div>
      )}
    </div>
  )
}
