import { SubScreen } from './SubScreen'
import { Icon, IconSpark } from './icons'
import { t } from '../i18n'
import './app.css'


// Phase 1 (no backend yet): the memory notes and the business-brain rules were
// seeded from mock data. A real user has none of that, so both screens show an
// honest empty state until real, user-derived facts exist.

export const Memory = () => {
  return (
    <SubScreen title="What I remember" back="settings/privacy" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>{t("I haven't learned anything about you yet — it'll build up as we work together.")}</span>
      </div>

      <div className="wg-empty wg-card-line">
        <span className="wg-chip lavender md">
          <Icon name="spark" size={22} variant="duotone" />
        </span>
        <strong>{t('Nothing on file yet')}</strong>
        <p>{t('Everything I learn comes from something you do or say, and you can take any of it back.')}</p>
      </div>

      <p className="wg-footnote">
        {t('I keep what helps me act for you and nothing else. This is never sold, and never used to train models.')}
      </p>
    </SubScreen>
  )
}


export const BusinessBrain = () => {
  return (
    <SubScreen title="Business Brain" back="business" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {t("I'm not holding any rules for your business yet. Set one and I'll check every recommendation against it.")}
        </span>
      </div>

      <div className="wg-empty wg-card-line">
        <span className="wg-chip mint md">
          <Icon name="spark" size={22} variant="duotone" />
        </span>
        <strong>{t('No rules yet')}</strong>
        <p>{t('When you set a rule — a margin floor, a price you never go below — it lives here, and I never act on it alone.')}</p>
      </div>

      <p className="wg-footnote">
        {t('I never act on these alone. They decide what I recommend and what I refuse to recommend.')}
      </p>
    </SubScreen>
  )
}
