import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck } from './icons'
import { meetingById, startAssist } from '../data/meetings'
import { t } from '../i18n'
import { goBack, navigate } from '../shell/nav'
import './app.css'
import './business.css'

export const MeetingConsent = ({ id }: { id: string }) => {
  const m = meetingById(id)
  const [confirmed, setConfirmed] = useState(false)
  if (!m) {
    goBack('meetings')
    return null
  }

  const begin = (recording: boolean) => {
    startAssist(id, recording)
    navigate(`meetings/${id}/live`)
  }

  return (
    <SubScreen
      title="Before we record"
      back={`meetings/${id}`}
      className="wg-mod"
      feedback="header"
      footer={
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-12)' }}>
          <button className="wg-btn full danger" disabled={!confirmed} onClick={() => begin(true)}>
            {t('Start meeting assistance')}
          </button>
          <button className="wg-btn full outline" onClick={() => begin(false)}>
            {t('Take notes without recording')}
          </button>
        </div>
      }
    >
      <div className="wg-consent wg-card-line">
        <div className="wg-consent__lead">
          <span className={`wg-chip ${m.tone} sm`}>
            <Icon name={m.icon} size={20} variant="duotone" />
          </span>
          <div>
            <strong>{t(m.title)}</strong>
            <span>{m.attendees.map((a) => t(a.name)).join(', ')}</span>
          </div>
        </div>
        <ul className="wg-consent__list">
          <li>
            <IconCheck size={16} />
            {t('I record the audio and build a live transcript while the meeting runs.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('I use the recording and transcript only to write your summary, decisions and action items.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('The recording is kept for 30 days, then deleted automatically. You can delete it sooner.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('Nothing is shared with anyone outside this meeting without a card you approve.')}
          </li>
        </ul>
      </div>

      <button className={`wg-confirm wg-card-line ${confirmed ? 'on' : ''}`} onClick={() => setConfirmed((v) => !v)}>
        <span className="wg-confirm__box">
          <IconCheck size={15} />
        </span>
        <span>{t('I confirm that everyone in this meeting has been informed and has agreed to the recording.')}</span>
      </button>
    </SubScreen>
  )
}
