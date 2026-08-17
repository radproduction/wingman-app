import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconPlus, IconSpark } from './icons'
import { ActionSheet } from './ActionSheet'
import {
  addLiveNote,
  cancelAssist,
  clock,
  continueWithoutMic,
  endAssist,
  liveSeconds,
  meetingById,
  pauseRecording,
  retryMic,
  useLive,
} from '../data/meetings'
import { actionItemsOfMeeting, useActionItems } from '../data/actionItems'
import { t } from '../i18n'
import { goBack, navigate } from '../shell/nav'
import { toast } from '../shell/toast'
import { confirmAction } from '../shell/confirm'
import { tapQuiet } from '../shell/feedback'
import './app.css'
import './business.css'
import './dashboard.css'

export const MeetingLive = ({ id }: { id: string }) => {
  const m = meetingById(id)
  const live = useLive(id)
  const items = useActionItems()
  const [draft, setDraft] = useState('')
  const [capture, setCapture] = useState(false)
  const [, tick] = useState(0)

  useEffect(() => {
    if (live.phase !== 'recording') return
    const timer = window.setInterval(() => tick((n) => n + 1), 1000)
    return () => window.clearInterval(timer)
  }, [live.phase])

  useEffect(() => {
    if (live.phase === 'processing') navigate(`meetings/${id}/summary`)
  }, [live.phase, id])

  if (!m) {
    goBack('meetings')
    return null
  }
  if (live.phase === 'idle') {
    navigate(`meetings/${id}`)
    return null
  }

  const elapsed = liveSeconds(live)
  const captured = actionItemsOfMeeting(id, items)
  const notesOnly = live.mic === 'off'
  const arming = live.phase === 'arming'
  const failed = live.phase === 'error'
  const running = live.phase === 'recording' || live.phase === 'paused'

  const state = arming
    ? t('Starting')
    : failed
      ? t('Not started')
      : notesOnly
        ? t('Taking notes')
        : live.phase === 'paused'
          ? t('Paused')
          : t('Recording')

  const addNote = (moment = false) => {
    const text = moment ? t('Important moment') : draft.trim()
    if (!text) return
    addLiveNote(id, text, moment)
    if (!moment) setDraft('')
    toast(moment ? t('Moment marked.') : t('Note added.'), 'check')
  }

  const end = async () => {
    const ok = await confirmAction({
      title: 'End this meeting?',
      body: notesOnly
        ? 'I will write up your notes and the action items you captured, and the summary appears in a moment.'
        : 'I will stop recording and write up your notes, decisions and action items. The summary appears in a moment.',
      confirmLabel: 'End meeting',
      cancelLabel: 'Keep going',
    })
    if (!ok) return
    endAssist(id)
  }

  const abandon = async () => {
    const ok = await confirmAction({
      title: 'Discard this meeting?',
      body: 'Nothing was captured, so there is nothing to write up. Any action items you already added stay in your list.',
      confirmLabel: 'Discard',
      cancelLabel: 'Go back',
      destructive: true,
    })
    if (!ok) return
    cancelAssist(id)
    navigate('business')
  }

  return (
    <SubScreen
      title={m.title}
      back={m.instant ? 'business' : `meetings/${id}`}
      className="wg-mod"
      feedback="quiet"
      footer={
        failed ? (
          <div className="wg-inst__acts">
            <button className="wg-btn full" onClick={() => void retryMic(id)}>
              {t('Try the microphone again')}
            </button>
            <button className="wg-btn full outline" onClick={() => continueWithoutMic(id)}>
              {t('Continue without recording')}
            </button>
          </div>
        ) : (
          <button className="wg-btn full danger" disabled={arming} onClick={end}>
            {t('End meeting')}
          </button>
        )
      }
    >
      {}
      {!failed && (
        <div
          className={`wg-rec wg-card-line ${notesOnly ? 'notes' : ''} ${
            live.phase !== 'recording' ? 'held' : ''
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="wg-rec__state">
            <span className={`wg-live__dot ${notesOnly ? 'notes' : ''} ${live.phase !== 'recording' ? 'off' : ''}`} />
            {state}
          </span>
          <span className="wg-rec__time">{clock(elapsed)}</span>
          <span className="wg-rec__hint">
            {arming
              ? t('Waiting for microphone access. Allow it and I will start straight away.')
              : notesOnly
                ? t('Not recording. Nothing is being listened to - I only keep what you write here.')
                : live.phase === 'paused'
                  ? t('Paused. Nothing is being captured until you resume.')
                  : t('Recording, with everyone here informed. Kept 30 days, then deleted.')}
          </span>
        </div>
      )}

      {}
      {failed && (
        <div className="wg-live__fail wg-card-line">
          <span className="wg-chip sand md">
            <Icon name="alert" size={24} variant="duotone" />
          </span>
          <strong>{t('I could not start recording')}</strong>
          <p>{t(live.problem ?? 'Something stopped the microphone.')}</p>
          <ul className="wg-consent__list">
            <li>
              <IconCheck size={16} />
              {t('Check the microphone permission for this site in your browser settings.')}
            </li>
            <li>
              <IconCheck size={16} />
              {t('Nothing has been captured, and nothing was sent anywhere.')}
            </li>
            <li>
              <IconCheck size={16} />
              {t('You can carry on with notes only - action items still work exactly the same.')}
            </li>
          </ul>
          <button className="wg-link wg-link--danger" onClick={abandon}>
            {t('Discard this meeting')}
          </button>
        </div>
      )}

      {running && (
        <>
          {}
          <div className="wg-live__ctrls">
            <button className="wg-lc" onClick={() => pauseRecording(id)}>
              <Icon name={live.phase === 'paused' ? 'volume' : 'clock'} size={16} variant="duotone" />
              {live.phase === 'paused' ? t('Resume') : t('Pause')}
            </button>
            <button className="wg-lc" onClick={() => addNote(true)}>
              <IconSpark size={16} />
              {t('Mark moment')}
            </button>
            <button
              className="wg-lc wide accent"
              onClick={() => {
                tapQuiet()
                setCapture(true)
              }}
            >
              <IconPlus size={16} />
              {t('Capture an action item')}
            </button>
          </div>

          {}
          <div className="wg-msearch">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addNote()}
              placeholder={t('Write a note')}
              aria-label={t('Write a note')}
            />
            <button className="wg-link" disabled={!draft.trim()} onClick={() => addNote()}>
              {t('Add')}
            </button>
          </div>
        </>
      )}

      {}
      {captured.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Action items')}</h2>
            <span>{captured.length}</span>
          </div>
          <div className="wg-msteps">
            {captured.map((a) => (
              <div className="wg-ai wg-card-line" key={a.id}>
                <div className="wg-ai__tx">
                  <div className="wg-ai__task">{t(a.title)}</div>
                  <div className="wg-ai__meta">
                    {a.owner ? t(a.owner) : t('Unassigned')} · {t(a.due)}
                  </div>
                </div>
                <span className={`wg-pri ${a.priority}`}>{t(a.priority)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {}
      <div className="wg-panel-head">
        <h2>{t('Notes')}</h2>
        {live.notes.length > 0 && <span>{live.notes.length}</span>}
      </div>
      {live.notes.length === 0 ? (
        <div className="wg-bc__summary wg-card-line">
          <IconSpark size={18} />
          <p>
            {notesOnly || failed
              ? t('Nothing written down yet. Anything you type here goes into the summary at the end.')
              : t('Nothing written down yet. I am listening either way - notes are for the things you want to be sure I catch.')}
          </p>
        </div>
      ) : (
        <ul className="wg-transcript wg-card-line">
          {live.notes.map((n, i) => (
            <li key={i}>
              <span className="at">{n.at}</span>
              <span>
                {n.moment && <span className="sp">{t('Moment')}: </span>}
                {n.text}
              </span>
            </li>
          ))}
        </ul>
      )}

      {}
      {m.summary && running && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Detected')}</h2>
          </div>
          <ul className="wg-live__detect wg-card-line">
            {m.summary.decisions.slice(0, 2).map((d) => (
              <li key={d}>
                <span className="k dec">{t('Decision')}</span>
                {t(d)}
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="wg-footnote">
        {notesOnly || failed
          ? t('Notes only. When you end the meeting I write these up, with whatever action items you captured.')
          : t('Everything here stays on this meeting. When you end it, I write up the notes, decisions and action items.')}
      </p>

      <ActionSheet
        open={capture}
        onClose={() => setCapture(false)}
        meetingId={id}
        meeting={m.title}
        project={m.project}
      />
    </SubScreen>
  )
}
