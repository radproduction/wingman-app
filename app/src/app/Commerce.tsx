import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { ApprovalAction } from './ApprovalCard'
import { Icon } from './icons'
import { business as businessSeed } from '../data/mock'
import { approvalById } from '../data/approvals'
import { localize } from '../i18n'
import './app.css'

export const Commerce = () => {
  const business = localize(businessSeed)

  return (
    <ModuleScreen k="commerce" back="business">
      <div className="wg-figs">
        {business.commerce.today.map((fig) => (
          <div className="wg-fig wg-card-line" key={fig.label}>
            <span className="wg-fig__val">{fig.value}</span>
            <span className="wg-fig__label">{fig.label}</span>
            {}
            <span className={`wg-fig__delta ${fig.up ? 'up' : ''}`}>{fig.delta}</span>
          </div>
        ))}
      </div>

      <ModHead title="Waiting on you" note={`${business.commerce.decisions.length}`} />
      <div className="wg-row-list">
        {business.commerce.decisions.map((id) => {
          const a = localize(approvalById(id))
          if (!a) return null
          return (
            <div className="wg-mrow wg-card-line" key={id}>
              <span className={`wg-chip ${a.tone} sm`}>
                <Icon name={a.icon} size={19} variant="duotone" />
              </span>
              <span className="wg-mrow__tx">
                <span className="wg-mrow__top">
                  <span className="wg-mrow__name">{a.title}</span>
                </span>
                <span className="wg-mrow__note">{a.why}</span>
                <ApprovalAction id={id} />
              </span>
            </div>
          )
        })}
      </div>

      <ModHead title="What I'm watching" />
      <div className="wg-row-list">
        {business.commerce.watching.map((w) => (
          <ModRow key={w.name} tone={w.tone} icon={w.icon} name={w.name} value={w.value} note={w.note} />
        ))}
      </div>

      <p className="wg-footnote">{business.commerce.quiet}</p>
    </ModuleScreen>
  )
}
