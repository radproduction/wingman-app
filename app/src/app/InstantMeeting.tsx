import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconPlus } from './icons'
import { useContacts, emailForName } from '../data/contacts'
import { createInstantMeeting, startAssist } from '../data/meetings'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'
import './business.css'
import './dashboard.css'

type Who = { name: string; phone?: string }

export const InstantMeeting = () => {
  const contacts = useContacts()
  const [title, setTitle] = useState('')
  const [who, setWho] = useState<Who[]>([])
  const [extra, setExtra] = useState('')
  const [extraPhone, setExtraPhone] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [starting, setStarting] = useState(false)

  const has = (name: string) => who.some((p) => p.name === name)
  const toggle = (name: string) =>
    setWho((w) => (w.some((p) => p.name === name) ? w.filter((p) => p.name !== name) : [...w, { name }]))

  const addExtra = () => {
    const name = extra.trim()
    if (!name || has(name)) return
    const phone = extraPhone.replace(/[^0-9+]/g, '').trim()
    setWho((w) => [...w, { name, ...(phone ? { phone } : {}) }])
    setExtra('')
    setExtraPhone('')
  }

  const begin = (recording: boolean) => {
    if (starting) return
    setStarting(true)
    // Carry each attendee's real email (known contact) + any WhatsApp number, so
    // the meeting's summary can actually be sent to them.
    const attendees = who.map((p) => ({ name: p.name, email: emailForName(p.name), phone: p.phone }))
    const id = createInstantMeeting({ title, attendees })
    void startAssist(id, recording)
    navigate(`meetings/${id}/live`)
  }

  const people = extra.trim() && !has(extra.trim()) ? [...who, { name: extra.trim() }] : who

  // Searchable, capped suggestions so a big address book never becomes a long
  // scroll: filter by the query (name or email), hide already-picked, show ≤8.
  const q = extra.trim().toLowerCase()
  const suggestions = (q
    ? contacts.filter((c) => c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q))
    : contacts
  )
    .filter((c) => !has(c.name))
    .slice(0, 8)

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
      {}
      {who.length > 0 && (
        <div className="wg-inst__who">
          {who.map((p) => (
            <button className="wg-gal__size on" key={p.name} aria-pressed onClick={() => toggle(p.name)}>
              {p.name}{p.phone ? ' 📱' : ''} ✕
            </button>
          ))}
        </div>
      )}
      {}
      <div className="wg-inst__add">
        <label className="wg-field wg-field--free wg-card-line">
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExtra()}
            placeholder={t('Search your contacts or type a name')}
            aria-label={t('Add someone')}
          />
        </label>
        <button className="wg-gal__add" aria-label={t('Add person')} disabled={!extra.trim()} onClick={addExtra}>
          <IconPlus size={18} />
        </button>
      </div>
      {extra.trim() && (
        <label className="wg-field wg-field--free wg-card-line" style={{ marginTop: 'var(--space-8)' }}>
          <input
            value={extraPhone}
            onChange={(e) => setExtraPhone(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addExtra()}
            inputMode="tel"
            placeholder={t('WhatsApp number (optional, e.g. 923001234567)')}
            aria-label={t('Attendee WhatsApp number')}
          />
        </label>
      )}
      {}
      {suggestions.length > 0 && (
        <div className="wg-inst__who">
          {suggestions.map((c) => (
            <button
              className="wg-gal__size"
              key={c.id}
              onClick={() => {
                toggle(c.name)
                setExtra('')
              }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}

      <div className="wg-panel-head">
        <h2>{t('Before I record')}</h2>
      </div>
      <div className="wg-consent wg-card-line">
        <ul className="wg-consent__list">
          <li>
            <IconCheck size={16} />
            {t('I record the audio, then turn it into a transcript when the meeting ends.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('I use it only to write your notes, decisions and action items.')}
          </li>
          <li>
            <IconCheck size={16} />
            {t('If Google Drive is connected, I save the full recording to your “Wingman Meetings” folder; otherwise the audio is discarded after transcribing.')}
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
