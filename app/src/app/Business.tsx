import { SubScreen, SetRow } from './SubScreen'
import { Icon, IconChevronR, IconSpark, IconWhatsapp } from './icons'
import { businessHeads as businessHeadsSeed, businessCenter as bcSeed } from '../data/mock'
import { approvals, useDecisions } from '../data/approvals'
import { useProfile } from '../data/store'
import { localize, t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import './app.css'
import './business.css'

export const Business = () => {
  const decisions = useDecisions()
  const waiting = approvals.filter(
    (a) => a.source === 'commerce' && (!decisions[a.id] || decisions[a.id].state === 'pending'),
  ).length
  const businessHeads = localize(businessHeadsSeed)
  const bc = localize(bcSeed)
  const first = useProfile().name.split(' ')[0]

  return (
    <SubScreen title="Business Center" back="home" className="wg-mod" feedback="header">
      {}
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>
          <b>{t('Good morning, {name}.', { name: first })}</b> {bc.summary}
        </p>
      </div>

      {}
      <div className="wg-now wg-card-line">
        <span className="wg-chip rose md">
          <Icon name="volume" size={24} variant="duotone" />
        </span>
        <div className="wg-now__tx">
          <strong>{t('Start a meeting now')}</strong>
          <span>{t('Unplanned conversation? I will record it, keep the notes and turn what you agree into action items.')}</span>
        </div>
        <button className="wg-btn full" data-feedback="quiet" onClick={() => navigate('meetings/instant')}>
          <span className="wg-live__dot" />
          {t('Start immediate meeting')}
        </button>
      </div>

      {}
      <div className="wg-grid">
        {bc.cards.map((c) => (
          <button className="wg-card wg-card-line" key={c.key} onClick={() => navigate(c.route)}>
            <span className="wg-card__head">
              <span className={`wg-chip ${c.tone} sm`}>
                <Icon name={c.icon} size={24} variant="duotone" />
              </span>
              <span className="wg-card__label">{c.label}</span>
            </span>
            <span className="wg-card__val">{c.value}</span>
            <span className="wg-card__sub">{c.sub}</span>
          </button>
        ))}
      </div>

      {}
      <div className="wg-bc__insight wg-card-line">
        <span className="wg-tag">
          <IconSpark size={14} /> {t(bc.insight.tag)}
        </span>
        <h2>{bc.insight.title}</h2>
        <p>{bc.insight.body}</p>
        <button
          className="wg-btn full wa"
          onClick={() => openWhatsApp(t('Tell me more about: {title}', { title: bc.insight.title }))}
        >
          <IconWhatsapp size={18} /> {t(bc.insight.cta)}
        </button>
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Meetings')}</h2>
        <span>{t('3 today')}</span>
      </div>
      <div className="wg-set-list wg-card-line">
        <SetRow icon="calendar" tone="lavender" name="Today's meetings" value={t('2 need prep')} to="meetings" />
        <SetRow
          icon="checkCircle"
          tone="blue"
          name={bc.completed.title}
          value={t('Summary ready')}
          to={`meetings/${bc.completed.meeting}/summary`}
        />
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('The store')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <SetRow icon="globe" tone="blue" name="Performance this week" value={t('Traffic up 18%')} to="business/performance" />
        <SetRow icon="grid" tone="mint" name="Connected services" value={t('4 connected')} to="business/integrations" />
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('What I watch')}</h2>
        {waiting > 0 && <span>{t('{n} waiting', { n: waiting })}</span>}
      </div>
      <div className="wg-row-list">
        {businessHeads.map((h) => (
          <button className="wg-brain wg-card-line" key={h.key} onClick={() => navigate(h.key)}>
            <span className={`wg-chip ${h.tone} md`}>
              <Icon name={h.icon} size={22} variant="duotone" />
            </span>
            <span className="wg-brain__tx">
              <span className="wg-brain__name">{h.title}</span>
              <span className={`wg-brain__val ${h.unset ? 'unset' : ''}`}>{h.value}</span>
              <span className="wg-brain__sub">{h.sub}</span>
            </span>
            <IconChevronR size={18} className="chev" />
          </button>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('How I decide')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <button className="wg-set" onClick={() => navigate('business/brain')}>
          <span className="wg-chip mint xs">
            <Icon name="spark" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Business Brain')}</span>
          <span className="wg-set__val">{t("What I've learned")}</span>
          <IconChevronR size={18} className="chev" />
        </button>
        <button className="wg-set" onClick={() => navigate('approvals')}>
          <span className="wg-chip blue xs">
            <Icon name="checkCircle" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Approvals')}</span>
          <span className="wg-set__val">{waiting > 0 ? t('{n} waiting', { n: waiting }) : t('All clear')}</span>
          <IconChevronR size={18} className="chev" />
        </button>
      </div>

      <p className="wg-footnote">
        {t(
          'I read your store every hour. Nothing that changes a price, spends money or messages a customer happens without you approving it first.',
        )}
      </p>
    </SubScreen>
  )
}
