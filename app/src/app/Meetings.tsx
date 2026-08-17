import { useMemo, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconPlus } from './icons'
import {
  allMeetings,
  meetingInFilter,
  useMeetingState,
  MEETING_FILTERS,
  MEETING_STATUS,
  type Meeting,
  type MeetingFilter,
} from '../data/meetings'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'
import './business.css'

const haystack = (m: Meeting) =>
  [m.title, m.company, m.type, m.project ?? '', m.day, ...m.attendees.map((a) => a.name)]
    .join(' ')
    .toLowerCase()

export const Meetings = () => {
  const [filter, setFilter] = useState<MeetingFilter>('today')
  const [q, setQ] = useState('')
  const store = useMeetingState()

  const rows = useMemo(() => {
    const query = q.trim().toLowerCase()
    return allMeetings().filter((m) => meetingInFilter(m, filter) && (!query || haystack(m).includes(query)))
  }, [filter, q, store])

  return (
    <SubScreen
      title="Meetings"
      back="business"
      className="wg-mod"
      feedback="header"
      action={
        <button className="wg-subbar__act" aria-label={t('Start a meeting now')} onClick={() => navigate('meetings/instant')}>
          <IconPlus size={20} />
        </button>
      }
    >
      <div className="wg-msearch">
        <Icon name="search" size={18} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t('Search by person, company or project')}
          aria-label={t('Search meetings')}
        />
      </div>

      <div className="wg-mfilter" role="tablist" data-feedback="quiet">
        {MEETING_FILTERS.map((f) => (
          <button
            key={f.key}
            role="tab"
            aria-selected={filter === f.key}
            className={filter === f.key ? 'on' : ''}
            onClick={() => setFilter(f.key)}
          >
            {t(f.label)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <>
          <div className="wg-bc__summary wg-card-line">
            <Icon name="calendar" size={18} variant="duotone" />
            <p>{t('No meetings here. Change the filter or clear the search to see more.')}</p>
          </div>
          <button className="wg-btn full soft" onClick={() => navigate('meetings/instant')}>
            {t('Start a meeting now')}
          </button>
        </>
      ) : (
        <div className="wg-row-list" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          {rows.map((m) => {
            const st = MEETING_STATUS[m.status]
            const cancelled = m.status === 'cancelled'
            return (
              <button className={`wg-meeting wg-card-line ${cancelled ? 'cancel' : ''}`} key={m.id} onClick={() => navigate(`meetings/${m.id}`)}>
                <span className={`wg-chip ${m.tone} sm`}>
                  <Icon name={m.icon} size={20} variant="duotone" />
                </span>
                <span className="wg-meeting__tx">
                  <span className="wg-meeting__top">
                    <span className={`wg-meeting__name ${cancelled ? 'strike' : ''}`}>{t(m.title)}</span>
                    <span className="wg-meeting__time">{m.day === 'Today' ? m.when.split(' - ')[0] : t(m.day)}</span>
                  </span>
                  <span className="wg-meeting__meta">
                    {t(m.company)} · {t(m.type)}
                    {m.project ? ` · ${t(m.project)}` : ''}
                  </span>
                  <span className="wg-meeting__foot">
                    <span className={`wg-mstatus ${st.tone}`}>
                      {st.tone === 'live' && <span className="dot" />}
                      {t(st.label)}
                    </span>
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}
    </SubScreen>
  )
}
