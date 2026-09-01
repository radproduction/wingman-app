import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { IconSpark } from './icons'
import { Switch } from '../shell/Switch'
import { api } from '../data/api'
import { toast } from '../shell/toast'
import { t } from '../i18n'
import './app.css'

/**
 * Email priorities — the AI's onboarding for the inbox. The user tells Wingman,
 * in plain language, which people / topics / situations matter; the email scanner
 * reads every new message against this and (when Notify is on) messages the user
 * on WhatsApp with what it is and a suggested reply. Persists to
 * preferences.emailContext via POST /api/email-context.
 */
export const EmailPriorities = () => {
  const [instructions, setInstructions] = useState('')
  const [notify, setNotify] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    api
      .me()
      .then((m) => {
        const ec = (m.email_context || {}) as { instructions?: string; notify?: boolean }
        setInstructions(ec.instructions || '')
        setNotify(ec.notify !== false)
      })
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  const save = async () => {
    if (saving) return
    setSaving(true)
    try {
      await api.setEmailContext({ instructions: instructions.trim(), notify })
      toast(t('Saved. I’ll watch your inbox with this in mind.'), 'check')
    } catch {
      toast(t('Could not save right now — try again.'), 'alert')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SubScreen title="Email priorities" back="more" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {t(
            'Tell me what matters in your inbox — the people, topics and situations you want to know about. I read every new email (Gmail and business) against this, and message you when something fits.',
          )}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('What should I flag?')}</h2>
      </div>
      <label className="wg-field wg-field--area wg-card-line">
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={8}
          placeholder={t(
            'e.g. Always flag anything from my boss Aamir about the project modules. Tell me about client emails asking for an update, a quote or a payment. Flag invoices and bills. Ignore newsletters and promotions.',
          )}
          aria-label={t('Email priorities')}
        />
      </label>

      <div className="wg-options" style={{ marginTop: 'var(--space-12)' }}>
        <button
          className={`wg-option wg-card-line wg-option--switch ${notify ? 'on' : ''}`}
          onClick={() => setNotify((v) => !v)}
        >
          <span className="tx">
            <strong>{t('Notify me on WhatsApp')}</strong>
            <span>{t('When an important email lands, I message you with what it is and a suggested reply.')}</span>
          </span>
          <Switch on={notify} />
        </button>
      </div>

      <button className="wg-btn full" disabled={saving || !loaded} onClick={save} style={{ marginTop: 'var(--space-16)' }}>
        {saving ? t('Saving…') : t('Save priorities')}
      </button>

      <p className="wg-footnote">
        {t('Plain language is fine — I understand it. Be as specific as you like, and change it anytime.')}
      </p>
    </SubScreen>
  )
}
