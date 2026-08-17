import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { BRAND_MARKS } from './icons'
import { business as businessSeed } from '../data/mock'
import { localize, t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'

export const Traffic = () => {
  const Brand = BRAND_MARKS.ga
  const business = localize(businessSeed)

  return (
    <ModuleScreen k="traffic" back="business">
      <ModHead title="What I'd watch for you" />
      <div className="wg-row-list">
        {business.traffic.would.map((w) => (
          <ModRow key={w.name} tone={w.tone} icon={w.icon} name={w.name} meta={w.desc} />
        ))}
      </div>

      <ModHead title="Ready when you are" />
      <div className="wg-row-list">
        <div className="wg-conn wg-card-line">
          <span className="wg-chip wg-chip--brand sm">
            <Brand size={24} />
          </span>
          <div className="wg-conn__tx">
            <div className="wg-conn__name">Google Analytics</div>
            <div className="wg-conn__desc">{t('Traffic and conversions')}</div>
          </div>
          <button className="wg-btn sm" data-feedback="header" onClick={() => navigate('more')}>
            {t('Connect')}
          </button>
        </div>
      </div>

      <p className="wg-footnote">{business.traffic.promise}</p>
    </ModuleScreen>
  )
}
