import { SubScreen } from './SubScreen'
import { IconSpark, IconWhatsapp } from './icons'
import { businessCenter as bcSeed } from '../data/mock'
import { localize, t } from '../i18n'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import './app.css'
import './business.css'

export const BusinessPerformance = () => {
  const perf = localize(bcSeed).performance

  return (
    <SubScreen title="Performance" back="business" className="wg-mod" feedback="header">
      <div className="wg-panel-head">
        <h2>{t('The store')}</h2>
        <span>{t(perf.period)}</span>
      </div>

      <div className="wg-grid">
        {perf.metrics.map((m) => (
          <div className="wg-card wg-card-line" key={m.label}>
            <span className="wg-card__label">{t(m.label)}</span>
            <span className="wg-card__val">{m.value}</span>
            <span className={`wg-card__sub ${m.up ? 'up' : ''}`}>{t(m.delta)}</span>
          </div>
        ))}
      </div>

      {}
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>{perf.read}</p>
      </div>

      <div className="wg-panel-head">
        <h2>{t('What you can do')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <button className="wg-set" onClick={() => toast(t("Added to Today's Snapshot."), 'check')}>
          <span className="wg-chip mint xs">
            <IconSpark size={17} />
          </span>
          <span className="wg-set__name">{t("Add to Today's Snapshot")}</span>
        </button>
        <button className="wg-set" onClick={() => toast(t('Saved to Business Brain.'), 'check')}>
          <span className="wg-chip lavender xs">
            <IconSpark size={17} />
          </span>
          <span className="wg-set__name">{t('Save this insight')}</span>
        </button>
        <button className="wg-set" onClick={() => toast(t('Follow-up task created.'), 'check')}>
          <span className="wg-chip peach xs">
            <IconSpark size={17} />
          </span>
          <span className="wg-set__name">{t('Create a follow-up task')}</span>
        </button>
      </div>

      <button
        className="wg-mod__ask wg-btn full wa"
        onClick={() => openWhatsApp(t('Show me where visitors are dropping off this week'))}
      >
        <IconWhatsapp size={18} /> {t('Ask Wingman about the store')}
      </button>
    </SubScreen>
  )
}
