import { SubScreen, SetRow } from './SubScreen'
import { Icon, IconSpark, IconWhatsapp } from './icons'
import { businessCenter as bcSeed } from '../data/mock'
import { useFollowups } from '../data/followups'
import { useTasks } from '../data/tasks'
import { allMeetings, useMeetingState } from '../data/meetings'
import { useProfile } from '../data/store'
import { localize, t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import './app.css'
import './business.css'

export const Business = () => {
  const bc = localize(bcSeed)
  const first = useProfile().name.split(' ')[0]

  // Real counts for the tiles the user actually has data for.
  const followups = useFollowups()
  const { openCount } = useTasks()
  useMeetingState()
  const meetingsToday = allMeetings().filter((m) => m.today && m.status !== 'cancelled').length
  const cardValue = (c: { key: string; value: string; sub: string }): { value: string; sub: string } => {
    if (c.key === 'tasks') return { value: t('{n} open', { n: openCount }), sub: c.sub }
    if (c.key === 'meetings') return { value: t('{n} today', { n: meetingsToday }), sub: c.sub }
    if (c.key === 'followups' && followups)
      return {
        value: t('{n} active', { n: followups.active }),
        sub: followups.overdue ? t('{n} overdue', { n: followups.overdue }) : t('None overdue'),
      }
    return { value: c.value, sub: c.sub }
  }

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
        {bc.cards.map((c) => {
          const v = cardValue(c)
          return (
            <button className="wg-card wg-card-line" key={c.key} onClick={() => navigate(c.route)}>
              <span className="wg-card__head">
                <span className={`wg-chip ${c.tone} sm`}>
                  <Icon name={c.icon} size={24} variant="duotone" />
                </span>
                <span className="wg-card__label">{c.label}</span>
              </span>
              <span className="wg-card__val">{v.value}</span>
              <span className="wg-card__sub">{v.sub}</span>
            </button>
          )
        })}
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

      <p className="wg-footnote">
        {t(
          'I read your store every hour. Nothing that changes a price, spends money or messages a customer happens without you approving it first.',
        )}
      </p>
    </SubScreen>
  )
}
