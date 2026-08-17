import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { Icon } from './icons'
import { business as businessSeed } from '../data/mock'
import { localize, t } from '../i18n'
import './app.css'

export const Pipeline = () => {
  const business = localize(businessSeed)

  return (
    <ModuleScreen k="pipeline" back="business">
      <ModHead title="What I'd watch for you" />
      <div className="wg-row-list">
        {business.pipeline.would.map((w) => (
          <ModRow key={w.name} tone={w.tone} icon={w.icon} name={w.name} meta={w.desc} />
        ))}
      </div>

      <ModHead title="When it's ready" />
      <div className="wg-row-list">
        <div className="wg-conn wg-card-line">
          <span className="wg-chip blue sm">
            <Icon name="clock" size={18} variant="duotone" />
          </span>
          <div className="wg-conn__tx">
            <div className="wg-conn__name">HubSpot &amp; Salesforce</div>
            <div className="wg-conn__desc">{t('Deals, contacts and stages')}</div>
          </div>
          <span className="wg-conn__status soon">{t('Soon')}</span>
        </div>
      </div>

      <p className="wg-footnote">{business.pipeline.promise}</p>
    </ModuleScreen>
  )
}
