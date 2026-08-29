import { useEffect, useRef, useState } from 'react'
import { SubScreen } from './SubScreen'
import { IconSpark } from './icons'
import { Switch } from '../shell/Switch'
import { api, type BotSession } from '../data/api'
import { toast } from '../shell/toast'
import { t } from '../i18n'
import './app.css'

/**
 * Meeting Notetaker settings.
 *
 * Two ways to get the bot into a call:
 *  1. "Bring Wingman now" — paste a live Meet/Zoom/Teams link and the bot joins
 *     within ~30s. Reliable + instant, no calendar needed. This is the path to
 *     use when you're already in a meeting.
 *  2. Auto-join — for scheduled Google Meet meetings on your calendar, Wingman
 *     sends the bot on its own so you never touch a thing.
 *
 * Both persist to the backend (preferences.autoJoinMeetings / saveMeetingRecording)
 * and drive the same Recall.ai bot → transcript → summary + tasks + email pipeline.
 */

// Map a raw session status to a friendly label + tone chip.
function statusChip(s: string | undefined): { label: string; tone: string } {
  switch (s) {
    case 'recording':
      return { label: t('Recording'), tone: 'live' }
    case 'waiting':
      return { label: t('In the lobby — admit it'), tone: 'blue' }
    case 'processing':
      return { label: t('Writing your notes…'), tone: 'blue' }
    case 'done':
      return { label: t('Notes ready'), tone: 'done' }
    case 'failed':
      return { label: t("Couldn't join"), tone: 'fail' }
    case 'cancelled':
      return { label: t('Cancelled'), tone: 'muted' }
    default:
      return { label: t('Joining…'), tone: 'blue' }
  }
}

// Trim a meeting URL down to its recognisable code for the list.
function shortUrl(url: string | null | undefined): string {
  if (!url) return t('Meeting')
  return String(url).replace(/^https?:\/\//, '').replace(/^www\./, '')
}

export const NotetakerSettings = () => {
  const [autoJoin, setAutoJoin] = useState(false)
  const [record, setRecord] = useState(false)
  const [url, setUrl] = useState('')
  const [sending, setSending] = useState(false)
  const [sessions, setSessions] = useState<BotSession[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const loadSessions = () =>
    api
      .meetingBots()
      .then((r) => setSessions(r.sessions || []))
      .catch(() => {})

  useEffect(() => {
    api
      .me()
      .then((m) => {
        setAutoJoin(!!m.auto_join_meetings)
        setRecord(!!m.save_meeting_recording)
      })
      .catch(() => {})
    loadSessions()
    // Keep the status list live while the screen is open, so "Joining… →
    // Recording → Notes ready" updates on its own.
    pollRef.current = setInterval(loadSessions, 8000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
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

  const send = async () => {
    const link = url.trim()
    if (!link || sending) return
    setSending(true)
    try {
      await api.joinMeeting(link)
      toast(t('Wingman is joining your meeting — admit it when it knocks.'), 'check')
      setUrl('')
      loadSessions()
    } catch (e) {
      const msg = e instanceof Error ? e.message : t('That did not work — check the link.')
      toast(msg, 'alert')
    } finally {
      setSending(false)
    }
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

      {}
      <div className="wg-panel-head">
        <h2>{t('Bring Wingman now')}</h2>
      </div>
      <p className="wg-footnote" style={{ marginTop: 0 }}>
        {t('Already in a call? Paste the meeting link and I join within about 30 seconds. No calendar needed.')}
      </p>
      <label className="wg-field wg-field--free wg-card-line">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={t('Paste Meet / Zoom / Teams link')}
          aria-label={t('Meeting link')}
        />
      </label>
      <button
        className="wg-btn full"
        disabled={!url.trim() || sending}
        onClick={send}
        style={{ marginTop: 'var(--space-8)' }}
      >
        {sending ? t('Sending Wingman…') : t('Send Wingman now')}
      </button>

      {}
      {sessions.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Recent meetings')}</h2>
          </div>
          <div className="wg-row-list">
            {sessions.slice(0, 6).map((s) => {
              const chip = statusChip(s.status)
              return (
                <div className="wg-conn wg-card-line" key={s.id}>
                  <div className="wg-conn__tx">
                    <div className="wg-conn__name">{s.bot_name || t('Wingman')}</div>
                    <div className="wg-conn__desc">{shortUrl(s.meeting_url)}</div>
                  </div>
                  <span className={`wg-note-chip ${chip.tone}`}>{chip.label}</span>
                </div>
              )
            })}
          </div>
        </>
      )}

      <div className="wg-panel-head">
        <h2>{t('Automatic')}</h2>
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
          'The notetaker joins under your name (e.g. "Aamir Wingman") and waits for you to admit it. Works with scheduled Google Meet meetings.',
        )}
      </p>
    </SubScreen>
  )
}
