import { useState, type ReactNode } from 'react'
import { SubScreen } from './SubScreen'
import { IconCheck, IconSpark } from './icons'
import { CC_FLAGS, COUNTRY_CODES, ZONES, formatTime } from '../onboarding/shared'
import { saveProfile, useProfile, type Profile } from '../data/store'
import { api } from '../data/api'
import { t } from '../i18n'
import { goBack } from '../shell/nav'
import './app.css'

// Persist a settings change to the backend (best-effort) so it survives a reload
// and reaches the WhatsApp assistant — not just the local cache.
const persist = (patch: Record<string, unknown>) => {
  void api.updateMe(patch).catch(() => {})
}

export type FieldKey = 'name' | 'phone' | 'email' | 'timezone' | 'workday' | 'briefing' | 'wrap'


const EditShell = ({
  title,
  hint,
  error,
  dirty,
  onSave,
  children,
}: {
  title: string
  hint: string
  error?: string
  dirty: boolean
  onSave: () => void
  children: ReactNode
}) => (
  <SubScreen
    title={title}
    back="profile"
    className="wg-edit"
    footer={
      <div className="wg-actions wg-actions--stack">
        <button
          className="wg-btn full"
          data-feedback="quiet"
          disabled={!dirty || !!error}
          onClick={() => {
            onSave()
            goBack('profile')
          }}
        >
          {t('Save')}
        </button>
        <button className="wg-btn-text" data-feedback="quiet" onClick={() => goBack('profile')}>
          {t('Cancel')}
        </button>
      </div>
    }
  >
    <div className="wg-brief-line">
      <IconSpark size={16} />
      <span>{hint}</span>
    </div>

    <div className="wg-edit__body">{children}</div>

    {dirty && error && <p className="wg-edit__err">{error}</p>}
  </SubScreen>
)


const splitPhone = (full: string) => {
  const cc = COUNTRY_CODES.find((c) => full.startsWith(c))
  return cc ? { cc, rest: full.slice(cc.length).trim() } : { cc: COUNTRY_CODES[0], rest: full.replace(/^\+/, '') }
}

const splitRange = (range: string) => {
  const [start = '09:00', end = '18:00'] = range.split(/\s*[–-]\s*/)
  return { start, end }
}

const to24 = (t: string) => {
  const m = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i)
  if (!m) return '07:00'
  let h = Number(m[1])
  const meridiem = m[3]?.toUpperCase()
  if (meridiem === 'PM' && h < 12) h += 12
  if (meridiem === 'AM' && h === 12) h = 0
  return `${String(h).padStart(2, '0')}:${m[2]}`
}


const TimeField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <label className="wg-field">
    <span className="wg-edit__label">{label}</span>
    <input type="time" value={value} onChange={(e) => onChange(e.target.value)} />
  </label>
)

const Name = ({ p }: { p: Profile }) => {
  const [v, setV] = useState(p.name)
  return (
    <EditShell
      title="Name"
      hint={t('What I call you in briefings and messages.')}
      dirty={v.trim() !== p.name}
      error={v.trim().length < 2 ? t('I need something to call you.') : undefined}
      onSave={() => {
        saveProfile({ name: v.trim() })
        persist({ name: v.trim() })
      }}
    >
      <div className="wg-field">
        <input autoComplete="name" placeholder={t('Your name')} value={v} onChange={(e) => setV(e.target.value)} />
      </div>
    </EditShell>
  )
}

const Phone = ({ p }: { p: Profile }) => {
  const initial = splitPhone(p.phone)
  const [cc, setCc] = useState(initial.cc)
  const [rest, setRest] = useState(initial.rest)
  const next = `${cc} ${rest.trim()}`
  return (
    <EditShell
      title="WhatsApp"
      hint={t("The number I message you on. It's where every briefing and alert lands.")}
      dirty={next !== p.phone}
      error={rest.replace(/\D/g, '').length < 7 ? t("That doesn't look like a full number yet.") : undefined}
      onSave={() => saveProfile({ phone: next })}
    >
      <div className="wg-field">
        <select aria-label={t('Country code')} value={cc} onChange={(e) => setCc(e.target.value)}>
          {COUNTRY_CODES.map((c) => (
            <option key={c} value={c}>
              {CC_FLAGS[c] ? `${CC_FLAGS[c]} ${c}` : c}
            </option>
          ))}
        </select>
        <input
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="300 1234567"
          value={rest}
          onChange={(e) => setRest(e.target.value)}
        />
      </div>
    </EditShell>
  )
}

const Email = ({ p }: { p: Profile }) => {
  const [v, setV] = useState(p.email)
  return (
    <EditShell
      title="Email"
      hint={t('The address on your account.')}
      dirty={v.trim() !== p.email}
      error={/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? undefined : t('That address is missing something.')}
      onSave={() => saveProfile({ email: v.trim() })}
    >
      <div className="wg-field">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t('you@example.com')}
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
      </div>
    </EditShell>
  )
}

const Timezone = ({ p }: { p: Profile }) => {
  const [v, setV] = useState(p.timezone)
  const zones = ZONES.includes(v) ? ZONES : [v, ...ZONES]
  return (
    <EditShell
      title="Time zone"
      hint={t('I plan your day and time your briefings around this.')}
      dirty={v !== p.timezone}
      onSave={() => {
        saveProfile({ timezone: v })
        persist({ timezone: v })
      }}
    >
      <div className="wg-options">
        {zones.map((z) => (
          <button key={z} className={`wg-option wg-card-line ${v === z ? 'on' : ''}`} onClick={() => setV(z)}>
            <span className="tx">
              <strong>{z.replace('_', ' ')}</strong>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>
    </EditShell>
  )
}

const Workday = ({ p }: { p: Profile }) => {
  const initial = splitRange(p.workday)
  const [start, setStart] = useState(initial.start)
  const [end, setEnd] = useState(initial.end)
  const next = `${start} – ${end}`
  return (
    <EditShell
      title="Workday"
      hint={t('The hours I treat as yours. Outside them I keep things to the briefing.')}
      dirty={next !== p.workday}
      error={end <= start ? t('Your day would end before it starts.') : undefined}
      onSave={() => {
        saveProfile({ workday: next })
        persist({ work_hours_start: start, work_hours_end: end })
      }}
    >
      <TimeField label={t('Starts')} value={start} onChange={setStart} />
      <TimeField label={t('Ends')} value={end} onChange={setEnd} />
    </EditShell>
  )
}

const Briefing = ({ p }: { p: Profile }) => {
  const [v, setV] = useState(to24(p.briefing))
  const next = formatTime(v)
  return (
    <EditShell
      title="Morning briefing"
      hint={t('When your day lands on WhatsApp.')}
      dirty={next !== p.briefing}
      onSave={() => {
        saveProfile({ briefing: next })
        persist({ briefing_time: v })
      }}
    >
      <TimeField label={t('Arrives at')} value={v} onChange={setV} />
    </EditShell>
  )
}

const Wrap = ({ p }: { p: Profile }) => {
  const [v, setV] = useState(to24(p.wrap))
  const next = formatTime(v)
  return (
    <EditShell
      title="Evening wrap-up"
      hint={t('When I close the day out with you.')}
      dirty={next !== p.wrap}
      onSave={() => {
        saveProfile({ wrap: next })
        persist({ debrief_time: v })
      }}
    >
      <TimeField label={t('Arrives at')} value={v} onChange={setV} />
    </EditShell>
  )
}

const EDITORS: Record<FieldKey, (props: { p: Profile }) => ReactNode> = {
  name: Name,
  phone: Phone,
  email: Email,
  timezone: Timezone,
  workday: Workday,
  briefing: Briefing,
  wrap: Wrap,
}

export const ProfileEdit = ({ field }: { field: FieldKey }) => {
  const p = useProfile()
  const Editor = EDITORS[field]
  return <Editor p={p} />
}
