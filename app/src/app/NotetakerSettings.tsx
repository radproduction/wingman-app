import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { IconSpark } from './icons'
import { Switch } from '../shell/Switch'
import { api } from '../data/api'
import { t } from '../i18n'
import './app.css'

/**
 * Meeting Notetaker settings. When Auto-join is on, Wingman sends a notetaker bot
 * to the user's scheduled Google Meet meetings, records them, and delivers the
 * summary + action items — all on its own. To bring the bot into a meeting you're
 * already in, use "Bring Wingman now" on the meeting in your Calendar. Persists to
 * the backend (preferences.autoJoinMeetings / saveMeetingRecording).
 */
export const NotetakerSettings = () => {
  const [autoJoin, setAutoJoin] = useState(false)
  const [record, setRecord] = useState(false)

  useEffect(() => {
    api
      .me()
      .then((m) => {
        setAutoJoin(!!m.auto_join_meetings)
        setRecord(!!m.save_meeting_recording)
      })
      .catch(() => {})
  }, [])

  const toggleAuto = () => {
    const next = !autoJoin
    setAutoJoin(next)
    api.setAutoJoin(next).catch(() => setAutoJoin(!next))
  }
  const toggleRecord = () => {
    const next = !record
    setRecord(next)
    api.setMeetingRecording(next).catch(() => setRecord(!next))
  }

  return (
    <SubScreen title="Meeting notetaker" back="more" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {t(
            'When this is on, I join your calendar meetings as a notetaker, listen, and send you the summary, decisions and action items afterwards — automatically.',
          )}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Notetaker')}</h2>
      </div>
      <div className="wg-options">
        <button
          className={`wg-option wg-card-line wg-option--switch ${autoJoin ? 'on' : ''}`}
          onClick={toggleAuto}
        >
          <span className="tx">
            <strong>{t('Auto-join my meetings')}</strong>
            <span>{t('I join every scheduled meeting that has a video link and take notes for you.')}</span>
          </span>
          <Switch on={autoJoin} />
        </button>

        <button
          className={`wg-option wg-card-line wg-option--switch ${record ? 'on' : ''}`}
          onClick={toggleRecord}
        >
          <span className="tx">
            <strong>{t('Save the recording to my Drive')}</strong>
            <span>{t('Off = transcribe only, nothing stored. On = keep the full recording in your Google Drive.')}</span>
          </span>
          <Switch on={record} />
        </button>
      </div>

      <p className="wg-footnote">
        {t(
          'Already in a meeting? Open it in your Calendar and tap "Bring Wingman now" — the bot joins under your name (e.g. "Aamir Wingman") within about 30 seconds. Waits for you to admit it.',
        )}
      </p>
    </SubScreen>
  )
}
