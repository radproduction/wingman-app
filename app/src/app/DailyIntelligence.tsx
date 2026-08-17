import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconCheck, IconChevronR, IconWhatsapp } from './icons'
import { ApprovalAction } from './ApprovalCard'
import {
  dailyIntel,
  TIMELINE_FILTERS,
  useIntel,
  decideRec,
  recDecision,
  resetRec,
  isUndone,
  undoDecision,
  redoDecision,
  type TimelineKind,
} from '../data/intelligence'
import { useWaiting } from '../data/approvals'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import './app.css'
import './business.css'
import './intelligence.css'

const DecisionCard = ({ d }: { d: (typeof dailyIntel.decisions)[number] }) => {
  useIntel()
  if (isUndone(d.id)) {
    return (
      <div className="wg-di-card wg-card-line settled">
        <div className="wg-di-settled">
          <Icon name="clock" size={16} variant="duotone" />
          {t('Undone')}
          <button className="wg-link wg-link--end" onClick={() => redoDecision(d.id)}>
            {t('Redo')}
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="wg-di-card wg-card-line">
      <div className="wg-di-card__top">
        <span className="wg-chip blue xs">
          <Icon name="spark" size={17} variant="duotone" />
        </span>
        <span className="wg-di-card__title">{t(d.title)}</span>
        <span className="wg-state auto">{t('Done automatically')}</span>
      </div>
      <p className="wg-di-card__body">{t(d.body)}</p>
      <div className="wg-used">
        {d.used.map((u) => (
          <span key={u}>{t(u)}</span>
        ))}
      </div>
      <div className="wg-di-note ok">
        <IconCheck size={15} />
        {t(d.result)}
      </div>
      <div className="wg-di-acts">
        {d.undoable && (
          <button className="wg-btn sm quiet" onClick={() => undoDecision(d.id)}>
            {t('Undo')}
          </button>
        )}
        <button
          className="wg-btn sm quiet"
          onClick={() => openWhatsApp(t('Why did you: {title}?', { title: d.title }))}
        >
          {t('Ask why')}
        </button>
        <button className="wg-btn sm quiet" onClick={() => toast(t('Allowed by: {p}', { p: d.permission }), 'shield')}>
          {t('Permission used')}
        </button>
      </div>
    </div>
  )
}

const RecCard = ({ r }: { r: (typeof dailyIntel.recommendations)[number] }) => {
  useIntel()
  const decision = recDecision(r.id)
  if (decision) {
    return (
      <div className="wg-di-card wg-card-line settled">
        <div className="wg-di-settled">
          <Icon name={decision === 'accepted' ? 'checkCircle' : 'clock'} size={16} variant="duotone" />
          {decision === 'accepted' ? t('Accepted') : t('Dismissed')}
          <button className="wg-link wg-link--end" onClick={() => resetRec(r.id)}>
            {t('Undo')}
          </button>
        </div>
      </div>
    )
  }
  return (
    <div className="wg-di-card wg-card-line">
      <div className="wg-di-card__top">
        <span className={`wg-chip ${r.tone} xs`}>
          <Icon name={r.icon} size={17} variant="duotone" />
        </span>
        <span className="wg-di-card__title">{t(r.title)}</span>
        <span className="wg-state recommended">{t('Recommended')}</span>
      </div>
      <p className="wg-di-card__body">{t(r.reason)}</p>
      <div className="wg-di-note">
        <IconSpark size={15} />
        {t(r.suggestion)}
      </div>
      <div className="wg-di-acts">
        <button
          className="wg-btn sm"
          onClick={() => {
            decideRec(r.id, 'accepted')
            toast(t('Done. I applied it.'), 'check')
          }}
        >
          {t('Accept')}
        </button>
        <button className="wg-btn sm quiet" onClick={() => openWhatsApp(t('About your suggestion: {title}', { title: r.title }))}>
          {t('Edit')}
        </button>
        <button className="wg-btn sm quiet" onClick={() => decideRec(r.id, 'dismissed')}>
          {t('Dismiss')}
        </button>
      </div>
    </div>
  )
}

export const DailyIntelligence = () => {
  const o = dailyIntel.overview
  const waiting = useWaiting()
  const [filter, setFilter] = useState<TimelineKind | 'all'>('all')
  const timeline = dailyIntel.timeline.filter((i) => filter === 'all' || i.kind === filter)

  return (
    <SubScreen title="Daily Intelligence" back="home" className="wg-mod" feedback="header">
      {}
      <div className="wg-di-overview wg-card-line">
        <p>{t(o.text)}</p>
        <div className="wg-di-stats">
          <div className="wg-di-stat">
            <b>{o.completed}</b>
            <small>{t('Completed')}</small>
          </div>
          <div className="wg-di-stat">
            <b>{waiting.length}</b>
            <small>{t('Waiting')}</small>
          </div>
          <div className="wg-di-stat">
            <b>{o.recommendations}</b>
            <small>{t('Suggested')}</small>
          </div>
          <div className="wg-di-stat">
            <b>{o.insights}</b>
            <small>{t('Insights')}</small>
          </div>
        </div>
      </div>
      <p className="wg-footnote" style={{ textAlign: 'start', margin: '0 var(--space-8)' }}>
        {t('{date} · updated {time} · {status}', { date: o.date, time: o.updated, status: o.status })}
      </p>

      {}
      <div className="wg-panel-head">
        <h2>{t('Decisions I made')}</h2>
      </div>
      <div className="wg-msteps">
        {dailyIntel.decisions.map((d) => (
          <DecisionCard key={d.id} d={d} />
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Actions I completed')}</h2>
      </div>
      <div className="wg-msteps">
        {dailyIntel.actions.map((a) => (
          <div className="wg-di-act wg-card-line" key={a.id}>
            <span className={`wg-chip ${a.tone} xs`}>
              <Icon name={a.icon} size={18} variant="duotone" />
            </span>
            <div className="wg-di-act__tx">
              <div className="wg-di-act__top">
                <span className="wg-di-act__title">{t(a.title)}</span>
                <span className="wg-di-act__at">{a.at}</span>
              </div>
              <div className="wg-di-act__body">{t(a.body)}</div>
              <div className="wg-di-act__foot">
                <span className={`wg-state ${a.state}`}>
                  {a.state === 'approved' ? t('Done after approval') : t('Done automatically')}
                </span>
                <span className="wg-di-act__trigger">{t(a.trigger)}</span>
                {a.link && (
                  <button className="wg-link wg-link--end" onClick={() => navigate(a.link!.route)}>
                    {t(a.link.label)}
                    <IconChevronR size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Recommendations')}</h2>
      </div>
      <div className="wg-msteps">
        {dailyIntel.recommendations.map((r) => (
          <RecCard key={r.id} r={r} />
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Waiting for you')}</h2>
        {waiting.length > 0 && <span>{t('{n} to decide', { n: waiting.length })}</span>}
      </div>
      {waiting.length === 0 ? (
        <div className="wg-bc__summary wg-card-line">
          <IconCheck size={18} />
          <p>{t("Nothing is waiting on you right now. I'll bring you anything that needs a decision.")}</p>
        </div>
      ) : (
        <div className="wg-msteps">
          {waiting.slice(0, 4).map((a) => (
            <div className="wg-di-card wg-card-line" key={a.id}>
              <div className="wg-di-card__top">
                <span className={`wg-chip ${a.tone} xs`}>
                  <Icon name={a.icon} size={17} variant="duotone" />
                </span>
                <span className="wg-di-card__title">{t(a.title)}</span>
                <span className="wg-state waiting">{t('Waiting')}</span>
              </div>
              <p className="wg-di-card__body">{t(a.why)}</p>
              <div className="wg-di-card__act">
                <ApprovalAction id={a.id} />
              </div>
            </div>
          ))}
        </div>
      )}

      {}
      <div className="wg-panel-head">
        <h2>{t('What I noticed')}</h2>
      </div>
      <div className="wg-msteps">
        {dailyIntel.insights.map((i) => (
          <div className="wg-di-card wg-card-line" key={i.id}>
            <div className="wg-di-card__top">
              <span className={`wg-chip ${i.tone} xs`}>
                <Icon name={i.icon} size={17} variant="duotone" />
              </span>
              <span className="wg-di-card__title">{t(i.title)}</span>
              <span className="wg-state insight">{t('Insight')}</span>
            </div>
            <p className="wg-di-card__body">{t(i.body)}</p>
            {i.action && (
              <div className="wg-di-acts">
                <button className="wg-btn sm quiet" onClick={() => toast(t('Done.'), 'check')}>
                  {t(i.action)}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('What I read')}</h2>
      </div>
      <div className="wg-msteps">
        {dailyIntel.sources.map((s) => (
          <div className="wg-di-act wg-card-line" key={s.name}>
            <span className={`wg-chip ${s.tone} xs`}>
              <Icon name={s.icon} size={18} variant="duotone" />
            </span>
            <div className="wg-di-act__tx">
              <div className="wg-di-act__title">{t(s.name)}</div>
              <div className="wg-di-act__body">{t(s.note)}</div>
            </div>
          </div>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t("What I didn't do")}</h2>
      </div>
      <ul className="wg-mcontext wg-card-line wg-notdone">
        {dailyIntel.notDone.map((n) => (
          <li key={n}>
            <Icon name="shield" size={16} variant="duotone" />
            {t(n)}
          </li>
        ))}
      </ul>

      {}
      <div className="wg-panel-head">
        <h2>{t('Timeline')}</h2>
      </div>
      <div className="wg-mfilter" data-feedback="quiet">
        {TIMELINE_FILTERS.map((f) => (
          <button key={f.key} className={filter === f.key ? 'on' : ''} onClick={() => setFilter(f.key)}>
            {t(f.label)}
          </button>
        ))}
      </div>
      <ul className="wg-tl">
        {timeline.map((i, idx) => (
          <li key={idx}>
            <span className="wg-tl__mark">
              <span className={`wg-tl__dot ${i.kind}`} />
            </span>
            <div className="wg-tl__tx">
              <div className="wg-tl__at">{i.at}</div>
              <div className="wg-tl__text">{t(i.text)}</div>
            </div>
          </li>
        ))}
      </ul>

      <button className="wg-mod__ask wg-btn full wa" onClick={() => openWhatsApp(t('Tell me about my day'))}>
        <IconWhatsapp size={18} /> {t('Ask Wingman about today')}
      </button>
    </SubScreen>
  )
}
