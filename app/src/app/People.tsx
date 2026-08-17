import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { people } from '../data/mock'
import './app.css'

export const People = () => (
  <ModuleScreen k="people">
    <ModHead title="Waiting on you" />
    <div className="wg-row-list">
      {people.waiting.map((p) => (
        <ModRow
          key={p.name}
          tone={p.tone}
          initial={p.initial}
          face={p.person}
          name={p.name}
          value={p.when}
          meta={p.context}
          note={p.promise}
          approval={p.approval}
        />
      ))}
    </div>

    <ModHead title="In touch" />
    <div className="wg-row-list">
      {people.recent.map((p) => (
        <ModRow key={p.name} tone={p.tone} initial={p.initial} face={p.person} name={p.name} value={p.when} meta={p.context} />
      ))}
    </div>
  </ModuleScreen>
)
