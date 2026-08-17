import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Sheet } from '../shell/Sheet'
import { toast } from '../shell/toast'
import { openWhatsApp } from '../shell/whatsapp'
import { tapPrimary, tapQuiet } from '../shell/feedback'
import { Icon, IconWhatsapp, type IconName } from './icons'
import {
  DISMISS_REASONS,
  approvalById,
  approve,
  decisionOf,
  dismiss,
  isWorking,
  reopen,
  useDecision,
  useDecisions,
  type Approval,
  type ApprovalState,
} from '../data/approvals'
import { localize, t } from '../i18n'
import './app.css'



let openId: string | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const openApproval = (id: string) => {
  openId = id
  emit()
}
export const closeApproval = () => {
  openId = null
  emit()
}


type Face = { label: string; icon: IconName; tone: 'wait' | 'work' | 'done' | 'gone' | 'warn' }

export const faceOf = (a: Approval, state: ApprovalState, note?: string, at?: string): Face => {
  switch (state) {
    case 'approved':
      return { label: t('Doing it now'), icon: 'spark', tone: 'work' }
    case 'edited':
      return { label: t('Doing it now, your version'), icon: 'spark', tone: 'work' }
    case 'executed':
      return { label: at ? t('Done · {time}', { time: at }) : t('Done'), icon: 'checkCircle', tone: 'done' }
    case 'dismissed':
      return {
        label: note ? t('Dismissed · {reason}', { reason: t(note) }) : t('Dismissed'),
        icon: 'close',
        tone: 'gone',
      }
    case 'failed':
      return {
        label: at ? t("Couldn't finish it · {time}", { time: at }) : t("Couldn't finish it"),
        icon: 'alert',
        tone: 'warn',
      }
    default:
      return { label: t('Waiting on you · {time}', { time: a.raised }), icon: 'clock', tone: 'wait' }
  }
}


export const ApprovalAction = ({ id }: { id: string }) => {
  const d = useDecision(id)
  const a = localize(approvalById(id))
  if (!a) return null

  const open = () => {
    tapQuiet()
    openApproval(id)
  }

  if (d.state === 'pending')
    return (
      <button className="wg-btn sm soft wg-act" onClick={open}>
        {a.cta}
      </button>
    )

  const face = faceOf(a, d.state, d.note, d.at)
  return (
    <button className={`wg-act wg-act--settled ${face.tone}`} onClick={open}>
      <Icon name={face.icon} size={14} />
      {face.label}
    </button>
  )
}


type Mode = 'read' | 'edit' | 'dismiss'

const Facts = ({ a, value }: { a: Approval; value?: string }) => (
  <div className="wm-ap__facts">
    {a.facts.map((f) => (
      <div className="wm-ap__fact" key={f.label}>
        <span>{f.label}</span>
        <strong>{f.value}</strong>
      </div>
    ))}
    {value && a.edit && (
      <div className="wm-ap__fact changed">
        <span>{a.edit.label}</span>
        <strong>{value}</strong>
      </div>
    )}
  </div>
)

const ApprovalBody = ({ a }: { a: Approval }) => {
  const d = useDecision(a.id)
  const [mode, setMode] = useState<Mode>('read')
  const [draft, setDraft] = useState(a.edit?.value ?? '')

  useEffect(() => {
    setMode('read')
    setDraft(a.edit?.value ?? '')
  }, [a.id, a.edit?.value])

  const face = faceOf(a, d.state, d.note, d.at)
  const working = isWorking(d.state)
  const settled = d.state === 'executed' || d.state === 'dismissed' || d.state === 'failed'

  const doApprove = (value?: string) => {
    tapPrimary()
    approve(a.id, value)
    setMode('read')
  }

  return (
    <div className="wm-ap">
      <div className="wm-ap__head">
        <span className={`wg-chip ${a.tone} sm`}>
          <Icon name={a.icon} size={20} variant="duotone" />
        </span>
        <span className={`wm-ap__state ${face.tone}`}>
          {working ? <i className="wm-ap__pulse" /> : <Icon name={face.icon} size={13} />}
          {face.label}
        </span>
      </div>

      <h2 className="wm-sheet__title" id="wm-approval-title">
        {a.title}
      </h2>

      {}
      {d.state === 'executed' && <p className="wm-ap__why">{a.executed}</p>}
      {d.state === 'failed' && <p className="wm-ap__why">{a.fails}</p>}
      {d.state === 'dismissed' && (
        <p className="wm-ap__why">
          {d.note
            ? t('You said "{reason}". I won\'t raise this one again unless something changes.', { reason: t(d.note) })
            : t("You said no. I won't raise this one again unless something changes.")}
        </p>
      )}
      {!settled && <p className="wm-ap__why">{a.why}</p>}

      {mode === 'edit' && a.edit ? (
        <div className="wm-ap__edit">
          <label className="wm-ap__label" htmlFor="wm-ap-edit">
            {a.edit.label}
          </label>
          <div className={`wg-field ${a.edit.long ? 'wg-field--long' : ''}`}>
            {a.edit.long ? (
              <textarea id="wm-ap-edit" rows={4} value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
            ) : (
              <input id="wm-ap-edit" value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
            )}
          </div>
          {a.edit.hint && <p className="wm-ap__hint">{a.edit.hint}</p>}
        </div>
      ) : (
        <Facts a={a} value={d.value} />
      )}

      {}

      {mode === 'dismiss' ? (
        <div className="wm-ap__acts">
          <p className="wm-ap__label">{t('Tell me why, so I learn from it.')}</p>
          <div className="wg-options">
            {DISMISS_REASONS.map((r) => (
              <button
                key={r}
                className="wg-option wg-card-line"
                onClick={() => {
                  tapQuiet()
                  dismiss(a.id, r)
                  setMode('read')
                }}
              >
                <span className="tx">
                  {}
                  <strong>{t(r)}</strong>
                </span>
              </button>
            ))}
          </div>
          <button className="wg-btn full quiet" onClick={() => setMode('read')}>
            {t('Keep it waiting')}
          </button>
        </div>
      ) : mode === 'edit' ? (
        <div className="wm-ap__acts">
          <button className="wg-btn full" onClick={() => doApprove(draft)} disabled={!draft.trim()}>
            {a.approveLabel}
          </button>
          <button
            className="wg-btn full quiet"
            onClick={() => {
              setDraft(a.edit?.value ?? '')
              setMode('read')
            }}
          >
            {t('Cancel')}
          </button>
        </div>
      ) : working ? (
        <div className="wm-ap__acts">
          <button className="wg-btn full quiet" onClick={closeApproval}>
            {t('Leave me to it')}
          </button>
        </div>
      ) : d.state === 'executed' ? (
        <div className="wm-ap__acts">
          <button className="wg-btn full quiet" onClick={closeApproval}>
            {t('Close')}
          </button>
        </div>
      ) : d.state === 'failed' ? (
        <div className="wm-ap__acts">
          <button
            className="wg-btn full wa"
            onClick={() => openWhatsApp(t('About {thing}', { thing: a.title.toLowerCase() }))}
          >
            <IconWhatsapp size={18} /> {t('Talk to me about it')}
          </button>
          <button
            className="wg-btn full quiet"
            onClick={() => {
              dismiss(a.id, 'Leave it')
              closeApproval()
            }}
          >
            {t('Leave it for now')}
          </button>
        </div>
      ) : d.state === 'dismissed' ? (
        <div className="wm-ap__acts">
          <button
            className="wg-btn full quiet"
            onClick={() => {
              tapQuiet()
              reopen(a.id)
            }}
          >
            {t('Put it back')}
          </button>
        </div>
      ) : (
        <div className="wm-ap__acts">
          <button className="wg-btn full" onClick={() => doApprove()}>
            {a.approveLabel}
          </button>
          <div className="wm-ap__minor">
            {a.edit && (
              <button className="wg-btn full quiet" onClick={() => setMode('edit')}>
                {t('Change it')}
              </button>
            )}
            <button className="wg-btn full quiet" onClick={() => setMode('dismiss')}>
              {t('Dismiss')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export const ApprovalHost = () => {
  const id = useSyncExternalStore(subscribe, () => openId)
  const decisions = useDecisions()
  const seen = useRef<Record<string, ApprovalState>>({})

  useEffect(() => {
    Object.entries(decisions).forEach(([key, d]) => {
      const was = seen.current[key]
      seen.current[key] = d.state
      if (!was || was === d.state) return
      const a = approvalById(key)
      if (!a) return
      if (openId === key) return
      if (d.state === 'executed') toast(t(a.executed), 'checkCircle', 3400)
      if (d.state === 'failed') toast(t("I couldn't finish that one. Open it to see why."), 'alert', 3400)
    })
  }, [decisions])

  useEffect(() => {
    window.addEventListener('hashchange', closeApproval)
    return () => window.removeEventListener('hashchange', closeApproval)
  }, [])

  const a = id ? localize(approvalById(id)) : undefined
  return (
    <Sheet open={!!a} onClose={closeApproval} labelledBy="wm-approval-title">
      {a && <ApprovalBody a={a} />}
    </Sheet>
  )
}

export const pendingCount = (ids: string[]) => ids.filter((id) => decisionOf(id).state === 'pending').length
