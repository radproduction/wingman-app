import { SubScreen } from './SubScreen'
import { IconCheck } from './icons'
import { Switch } from '../shell/Switch'
import {
  meetingById,
  useMeetingConfig,
  setAssist,
  setLevel,
  setLead,
  ASSIST_OPTIONS,
  APPROVAL_LEVELS,
  REMINDER_LEADS,
} from '../data/meetings'
import { t } from '../i18n'
import { goBack } from '../shell/nav'
import './app.css'
import './business.css'

const GROUPS: { title: string; keys: string[] }[] = [
  { title: 'Before the meeting', keys: ['brief', 'remind'] },
  { title: 'During the meeting', keys: ['notes', 'record', 'transcribe', 'topics', 'decisions', 'actions', 'owners'] },
  { title: 'After the meeting', keys: ['tasks', 'draft', 'next', 'invite', 'whatsapp', 'crm', 'reminders'] },
]

const optionOf = (key: string) => ASSIST_OPTIONS.find((o) => o.key === key)!

export const MeetingSettings = ({ id }: { id: string }) => {
  const m = meetingById(id)
  const cfg = useMeetingConfig(id)
  if (!m) {
    goBack('meetings')
    return null
  }

  return (
    <SubScreen title="Assistance settings" back={`meetings/${id}`} className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <span className="wg-chip lavender xs">
          {m.attendees[0]?.initial}
        </span>
        <p>{t('How I help with {title}. Set this per meeting.', { title: m.title })}</p>
      </div>

      {GROUPS.map((g) => (
        <div key={g.title}>
          <div className="wg-panel-head">
            <h2>{t(g.title)}</h2>
          </div>
          <div className="wg-options">
            {g.keys.map((key) => {
              const opt = optionOf(key)
              const on = cfg.assist[key]
              return (
                <button
                  key={key}
                  className={`wg-option wg-card-line wg-option--switch ${on ? 'on' : ''}`}
                  onClick={() => setAssist(id, key, !on)}
                >
                  <span className="tx">
                    <strong>{t(opt.label)}</strong>
                    {opt.external && <span>{t('External · I always show you before it happens')}</span>}
                  </span>
                  <Switch on={on} />
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <div className="wg-panel-head">
        <h2>{t('When I can act')}</h2>
      </div>
      <div className="wg-options">
        {APPROVAL_LEVELS.map((l) => (
          <button
            key={l.key}
            className={`wg-option wg-card-line ${cfg.level === l.key ? 'on' : ''}`}
            onClick={() => setLevel(id, l.key)}
          >
            <span className="tx">
              <strong>{t(l.label)}</strong>
              <span>{t(l.desc)}</span>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Remind me')}</h2>
      </div>
      <div className="wg-seg">
        {REMINDER_LEADS.map((lead) => (
          <button key={lead} className={cfg.lead === lead ? 'on' : ''} onClick={() => setLead(id, lead)}>
            {t(lead)}
          </button>
        ))}
      </div>

      <p className="wg-footnote">
        {t('Sending an email, inviting someone external or sharing a recording always waits for your review, whatever this is set to.')}
      </p>
    </SubScreen>
  )
}
