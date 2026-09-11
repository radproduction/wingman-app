import { SubScreen, SetRow } from './SubScreen'
import { Icon, IconSpark } from './icons'
import { businessCenter as bcSeed } from '../data/mock'
import { useFollowups } from '../data/followups'
import { useTasks } from '../data/tasks'
import { allMeetings, useMeetingState } from '../data/meetings'
import { useConnections } from '../data/connections'
import { useProfile } from '../data/store'
import { localize, t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'
import './business.css'

export const Business = () => {
  const bc = localize(bcSeed)
  const first = useProfile().name.split(' ')[0]

  // Only surface what we can back with a real data source. The store metrics
  // that used to live here (traffic "up 18%", a fabricated insight, hardcoded
  // counts) were invented — with no store connected yet, we show real counts or
  // an honest not-connected line instead of fiction.
  const followups = useFollowups()
  const { openCount } = useTasks()
  useMeetingState()
  const today = allMeetings().filter((m) => m.today && m.status !== 'cancelled')
  const meetingsToday = today.length
  const toPrep = today.filter((m) => m.status === 'prep-available' || m.status === 'brief-ready').length
  const briefReady = today.filter((m) => m.status === 'brief-ready').length
  const { connected } = useConnections()

  // A one-line summary built only from real counts (was a fabricated string).
  const parts: string[] = []
  if (meetingsToday) parts.push(t('{n} meetings today', { n: meetingsToday }))
  if (toPrep) parts.push(t('{n} to prepare', { n: toPrep }))
  if (followups?.overdue) parts.push(t('{n} follow-up overdue', { n: followups.overdue }))
  const summary = parts.length ? parts.join(', ') + '.' : t('Nothing urgent right now.')

  const cardValue = (c: { key: string; value: string; sub: string }): { value: string; sub: string } => {
    switch (c.key) {
      case 'tasks':
        return { value: t('{n} open', { n: openCount }), sub: c.sub }
      case 'meetings':
        return { value: t('{n} today', { n: meetingsToday }), sub: t('{n} to prepare', { n: toPrep }) }
      case 'prep':
        return { value: t('{n} to prepare', { n: toPrep }), sub: t('{n} brief ready', { n: briefReady }) }
      case 'followups':
        return followups
          ? {
              value: t('{n} active', { n: followups.active }),
              sub: followups.overdue ? t('{n} overdue', { n: followups.overdue }) : t('None overdue'),
            }
          : { value: c.value, sub: c.sub }
      default:
        return { value: c.value, sub: c.sub }
    }
  }

  // Keep only the tiles backed by real data. The "Approvals" and "Store" tiles
  // read invented seed numbers, so they stay off until there's a real source.
  const cards = bc.cards.filter((c) => c.key !== 'approvals' && c.key !== 'performance')

  return (
    <SubScreen title="Business Center" back="home" className="wg-mod" feedback="header">
      {}
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>
          <b>{t('Good morning, {name}.', { name: first })}</b> {summary}
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
        {cards.map((c) => {
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
      <div className="wg-panel-head">
        <h2>{t('Meetings')}</h2>
        <span>{t('{n} today', { n: meetingsToday })}</span>
      </div>
      <div className="wg-set-list wg-card-line">
        <SetRow icon="calendar" tone="lavender" name="Today's meetings" value={t('{n} need prep', { n: toPrep })} to="meetings" />
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('The store')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <SetRow icon="globe" tone="blue" name="Performance this week" value={t('Not connected')} to="business/performance" />
        <SetRow icon="grid" tone="mint" name="Connected services" value={t('{n} connected', { n: connected })} to="business/integrations" />
      </div>

      <p className="wg-footnote">
        {t(
          'Nothing that changes a price, spends money or messages a customer happens without you approving it first.',
        )}
      </p>
    </SubScreen>
  )
}
