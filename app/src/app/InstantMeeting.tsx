import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconPlus } from './icons'
import { ASSIGNEES } from '../data/actionItems'
import { createInstantMeeting, startAssist } from '../data/meetings'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'
import './business.css'
import './dashboard.css'

export const InstantMeeting = () => {
  const [title, setTitle] = useState('')
  const [who, setWho] = useState<string[]>([])
  const [extra, setExtra] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [starting, setStarting] = useState(false)

  const toggle = (name: string) => setWho((w) => (w.includes(name) ? w.filter((n) => n !== name) : [...w, name]))

  const addExtra = () => {
    const name = extra.trim()
    if (!name || who.includes(name)) return
    setWho((w) => [...w, name])
    setExtra('')
  }

  const begin = (recording: boolean) => {
    if (starting) return
    setStarting(true)
    const id = createInstantMeeting({ title, attendees: who })
    void startAssist(id, recording)
    navigate(`meetings/${id}/live`)
  }

  const people = extra.trim() && !who.includes(extra.trim()) ? [...who, extra.trim()] : who

  return (
    <SubScreen
      title="Start a meeting now"
      back="business"
      className="wg-mod"
      feedback="header"
      footer={
        <div className="wg-inst__acts">
          <button className="wg-btn full danger" disabled={!confirmed || starting} onClick={() => begin(true)}>
            <span className="wg-live__dot" />
            {t('Start recording')}
          </button>
          <button className="wg-btn full outline" disabled={starting} onClick={() => begin(false)}>
            {t('Take notes without recording')}
          </button>
        </div>
      }
    >
      <div className="wg-bc__summary wg-card-line">
        <Icon name="volume" size={18} variant="duotone" />
        <p>
          <b>{t('No setup needed.')}</b>{' '}
          {t(
            'I will start listening, keep the notes and pull out the decisions and action items. You can name it and add people afterwards.',
          )}
        </p>
      </div>

      <div className="wg-panel-head">
        <h2>{t('What is it about?')}</h2>
        <span>{t('Optional')}</span>
      </div>
      <label className="wg-field wg-field--free wg-card-line">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('Quick meeting')}
          aria-label={t('Meeting name')}
        />
      </label>

      <div className="wg-panel-head">
        <h2>{t('Who is here?')}</h2>
        <span>{people.length > 0 ? t('{n} plus you', { n: people.length }) : t('Just you')}</span>
      </div>
      <div className="wg-inst__who">
        {ASSIGNEES.filter((n) => n !== 'You' && n !== 'Wingman').map((name) => (
          <button
            className={`wg-gal__size ${who.includes(name) ? 'on' : ''}`}
            key={name}
            aria-pressed={who.includes(name)}
            onClick={() => toggle(name)}
          >
            {t(name)}
          </button>
        ))}
        {who
          .filter((n) => !ASSIGNEES.includes(n))
          .map((name) => (
            <button className="wg-gal__size on" key={name} aria-pressed onClick={() => toggle(name)}>
              {name}
            </button>
          ))}
      </div>
      <div className="wg-inst__add">
        <label className="wg-field wg-field--free wg-card-line">
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExtra()}
            placeholder={t('Add someone else')}
            aria-label={t('Add someone else')}
          />
        </label>
        <button className="wg-gal__add" aria-label={t('Add person')} disabled={!extra.trim()} onClick={addExtra}>
          <IconPlus size={18} />
        </button>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Before I record')}</h2>
      </div>
      <div className="wg-consent wg-card-line">
        <ul className="wg-consent__list">
          <li>
            <IconCheck size={16} />
            {t('I record the audio and build a live transcript while the meeting runs.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('I use it only to write your notes, decisions and action items.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('The recording is kept for 30 days, then deleted automatically. You can delete it sooner.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('Nothing leaves this meeting without a card you approve first.')}
          </li>
        </ul>
      </div>

      <button className={`wg-confirm wg-card-line ${confirmed ? 'on' : ''}`} onClick={() => setConfirmed((v) => !v)}>
        <span className="wg-confirm__box">
          <IconCheck size={15} />
        </span>
        <span>{t('Everyone here has been told they are being recorded and has agreed.')}</span>
      </button>

      <p className="wg-footnote">
        {t(
          'Taking notes without recording needs no microphone and no consent - I only write down what you type. Recording needs both.',
        )}
      </p>
    </SubScreen>
  )
}
