import { SubScreen } from './SubScreen'
import { Icon, IconChevronR, IconSpark, IconCheck } from './icons'
import { meetingById, MEETING_STATUS, useLive, type Meeting } from '../data/meetings'
import { CommuteWidget } from './RouteDetail'
import { routeByKey } from '../data/mobility'
import { t } from '../i18n'
import { navigate, goBack } from '../shell/nav'
import './app.css'
import './business.css'
import './mobility.css'

const primaryStep = (m: Meeting, started: boolean) => {
  if (m.status === 'in-progress' || started) return { label: 'Open live assistance', to: 'live', live: true }
  if (m.status === 'summary-ready' || m.status === 'completed' || m.status === 'follow-up')
    return { label: 'View meeting summary', to: 'summary' }
  if (m.status === 'processing') return { label: 'Processing notes', to: '', disabled: true }
  if (m.status === 'cancelled') return null
  return { label: 'Start meeting assistance', to: 'consent' }
}

const isUpcoming = (m: Meeting) =>
  ['prep-available', 'brief-ready', 'assist-approved', 'assist-requested', 'recording-scheduled'].includes(m.status)

export const MeetingDetail = ({ id }: { id: string }) => {
  const m = meetingById(id)
  const live = useLive(id)
  if (!m) {
    goBack('meetings')
    return null
  }
  const st = MEETING_STATUS[m.status]
  const primary = primaryStep(m, live.started)

  return (
    <SubScreen title="Meeting" back="meetings" className="wg-mod" feedback="header">
      {}
      <div className="wg-mdet__hero wg-card-line">
        <div className="wg-mdet__hero-top">
          <div className="wg-mdet__hero-tx">
            <span className="wg-mdet__title">{t(m.title)}</span>
            <span className="wg-mdet__when">
              {t(m.day)} · {t(m.when)}
            </span>
          </div>
          <span className={`wg-chip ${m.tone} lg`}>
            <Icon name={m.icon} size={24} variant="duotone" />
          </span>
        </div>
        <span className={`wg-mstatus ${st.tone}`}>
          {st.tone === 'live' && <span className="dot" />}
          {t(st.label)}
        </span>
      </div>

      {}
      <div className="wg-mfacts wg-card-line">
        <div>
          <div className="wg-mfact__k">{t('Company')}</div>
          <div className="wg-mfact__v">{t(m.company)}</div>
        </div>
        <div>
          <div className="wg-mfact__k">{t('Type')}</div>
          <div className="wg-mfact__v">{t(m.type)}</div>
        </div>
        <div>
          <div className="wg-mfact__k">{t('Where')}</div>
          <div className="wg-mfact__v">{t(m.location)}</div>
        </div>
        <div>
          <div className="wg-mfact__k">{t('Project')}</div>
          <div className="wg-mfact__v">{m.project ? t(m.project) : t('None')}</div>
        </div>
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Attendees')}</h2>
      </div>
      <div className="wg-mfaces">
        {m.attendees.map((a) => (
          <span className="wg-mface wg-card-line" key={a.name}>
            <span className={`wg-chip ${m.tone} wg-chip--letter xs`}>{a.initial}</span>
            <span className="wg-mface__tx">
              <span className="wg-mface__name">{t(a.name)}</span>
              {a.role && <span className="wg-mface__role">{t(a.role)}</span>}
            </span>
          </span>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('What I already have')}</h2>
      </div>
      <ul className="wg-mcontext wg-card-line">
        {m.context.map((c) => (
          <li key={c}>
            <IconCheck size={16} />
            {t(c)}
          </li>
        ))}
      </ul>

      {}
      {m.travelRoute && isUpcoming(m) && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Getting there')}</h2>
          </div>
          <CommuteWidget route={routeByKey(m.travelRoute)} onView={() => navigate(`route/${m.travelRoute}`)} />
        </>
      )}

      {}
      {isUpcoming(m) && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Before it starts')}</h2>
          </div>
          <ul className="wg-mcontext wg-card-line">
            <li>
              <IconSpark size={16} />
              {t('60 min before: I send your prepared brief.')}
            </li>
            <li>
              <IconSpark size={16} />
              {t('15 min before: I confirm assistance is ready.')}
            </li>
            <li>
              <IconSpark size={16} />
              {t('At the start: I ask you to begin, once everyone has agreed.')}
            </li>
          </ul>
        </>
      )}

      {}
      <div className="wg-panel-head">
        <h2>{t('Assistance')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <button className="wg-set" onClick={() => navigate(`meetings/${id}/brief`)}>
          <span className="wg-chip lavender xs">
            <Icon name="spark" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Meeting brief')}</span>
          <span className="wg-set__val">{m.brief ? t('Ready') : t('Prepare')}</span>
          <IconChevronR size={18} className="chev" />
        </button>
        <button className="wg-set" onClick={() => navigate(`meetings/${id}/settings`)}>
          <span className="wg-chip blue xs">
            <Icon name="grid" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Assistance settings')}</span>
          <span className="wg-set__val">{t('Per meeting')}</span>
          <IconChevronR size={18} className="chev" />
        </button>
      </div>

      {primary &&
        (primary.disabled ? (
          <button className="wg-btn full" disabled>
            {t(primary.label)}
          </button>
        ) : (
          <button
            className={`wg-btn full ${primary.live ? 'danger' : ''}`}
            onClick={() => navigate(`meetings/${id}/${primary.to}`)}
          >
            {primary.live && <span className="wg-live__dot" style={{ marginInlineEnd: 'var(--space-8)' }} />}
            {t(primary.label)}
          </button>
        ))}

      {m.status === 'cancelled' && (
        <p className="wg-footnote">{t('This meeting was cancelled. Rescheduling was proposed for next week.')}</p>
      )}
    </SubScreen>
  )
}
