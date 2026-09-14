import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconShield } from './icons'
import { api, ApiError } from '../data/api'
import { t } from '../i18n'
import { toast } from '../shell/toast'
import { confirmAction } from '../shell/confirm'
import './app.css'
import './business.css'

// Connect an attendance / HRMS system (e.g. NOW HRMS) two ways:
//   Inbound  — the HRMS POSTs clock-in/out to a private webhook so Wingman
//              notices a forgotten clock-out.
//   Outbound — Wingman POSTs to the user's own endpoint (with a secret header)
//              so "clock out kar do" on WhatsApp actually clocks them out.
// The backend routes already exist (/api/work/*); this is the UI for them.
export const WorkClock = () => {
  const [loading, setLoading] = useState(true)

  // Inbound
  const [webhookUrl, setWebhookUrl] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [resetting, setResetting] = useState(false)

  // Outbound (Wingman → HRMS)
  const [actionConfigured, setActionConfigured] = useState(false)
  const [actionUrl, setActionUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [employeeRef, setEmployeeRef] = useState('')
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    void api
      .workConnect()
      .then((r) => {
        if (!alive) return
        setWebhookUrl(r.webhook_url)
        setReceiving(!!r.connected)
        setActionConfigured(!!r.action_configured)
        setActionUrl(r.action_url ?? 'https://nowhrms.com/api/wingman/clock')
        setEmployeeRef(r.employee_ref ?? '')
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const copy = async (text: string, what: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast(t('{what} copied.', { what }), 'check')
    } catch {
      toast(t('Copy failed — select it and copy by hand.'), 'alert')
    }
  }

  const resetLink = async () => {
    const ok = await confirmAction({
      title: t('Reset the link?'),
      body: t('The current link stops working right away. Put the new one into your HRMS afterwards.'),
      confirmLabel: t('Reset it'),
      cancelLabel: t('Keep it'),
      destructive: true,
    })
    if (!ok) return
    setResetting(true)
    try {
      const r = await api.workResetLink()
      setWebhookUrl(r.webhook_url)
      toast(t('New link ready.'), 'check')
    } catch {
      toast(t('Could not reset the link right now.'), 'alert')
    } finally {
      setResetting(false)
    }
  }

  const generateSecret = () => {
    const bytes = new Uint8Array(24)
    crypto.getRandomValues(bytes)
    setSecret(btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 28))
  }

  const saveAction = async () => {
    setError('')
    const url = actionUrl.trim()
    if (!/^https:\/\//i.test(url)) {
      setError(t('Enter the HTTPS endpoint your HRMS uses to clock in and out.'))
      return
    }
    if (!actionConfigured && secret.length < 8) {
      setError(t('Set a shared secret of at least 8 characters — your endpoint checks it.'))
      return
    }
    setSaving(true)
    try {
      await api.workSetAction({ url, secret: secret || undefined, employee_ref: employeeRef.trim() || null })
      setActionConfigured(true)
      setSecret('')
      toast(t('Saved. Send a test clock-out to be sure it works.'), 'checkCircle')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('Could not save that.'))
    } finally {
      setSaving(false)
    }
  }

  const testAction = async () => {
    setError('')
    setTesting(true)
    try {
      await api.workTestAction('clock_out')
      toast(t('Worked — a real clock-out was sent. Undo it in your HRMS if you did not mean to.'), 'checkCircle')
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t('That did not go through.'))
    } finally {
      setTesting(false)
    }
  }

  const disconnectAction = async () => {
    const ok = await confirmAction({
      title: t('Stop clocking from chat?'),
      body: t('Wingman will no longer clock you in or out. It still notices a forgotten clock-out.'),
      confirmLabel: t('Turn it off'),
      cancelLabel: t('Keep it on'),
      destructive: true,
    })
    if (!ok) return
    setSaving(true)
    try {
      await api.workClearAction()
      setActionConfigured(false)
      setSecret('')
      toast(t('Chat clocking turned off.'), 'check')
    } catch {
      toast(t('Could not turn it off right now.'), 'alert')
    } finally {
      setSaving(false)
    }
  }

  return (
    <SubScreen title="Work clock" back="more" className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <Icon name="checkCircle" size={18} variant="duotone" />
        <p>
          {t(
            'Connect your attendance system (like NOW HRMS) so I catch a forgotten clock-out — and, if you want, clock you in and out when you ask on WhatsApp.',
          )}
        </p>
      </div>

      {loading ? (
        <p className="wg-note">{t('Loading…')}</p>
      ) : (
        <>
          {/* ── Inbound: HRMS → Wingman ── */}
          <div className="wg-panel-head">
            <h2>{t('Let your HRMS tell me')}</h2>
            {receiving && <span className="wg-mstatus go">{t('Receiving')}</span>}
          </div>
          <p className="wg-note">
            {t('In NOW HRMS, POST to this private link when you clock in and out, with body {"event":"clock_in"} or {"event":"clock_out"}:')}
          </p>
          <div dir="ltr" className="wg-integ wg-card-line" style={{ wordBreak: 'break-all', fontSize: '0.85em' }}>
            {webhookUrl || t('Loading…')}
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
            <button className="wg-btn" disabled={!webhookUrl} onClick={() => copy(webhookUrl, t('Link'))}>
              {t('Copy link')}
            </button>
            <button className="wg-btn outline" disabled={resetting} onClick={resetLink}>
              {resetting ? t('Resetting…') : t('Reset link')}
            </button>
          </div>
          <p className="wg-note">
            <IconShield size={16} />
            {t('Anyone with this link can post clock events for you — keep it private, and reset it any time.')}
          </p>

          {/* ── Outbound: Wingman → HRMS ── */}
          <div className="wg-panel-head" style={{ marginTop: 'var(--space-20)' }}>
            <h2>{t('Let me clock you in & out')}</h2>
            {actionConfigured && <span className="wg-mstatus go">{t('On')}</span>}
          </div>
          <p className="wg-note">
            {t(
              'Add an endpoint in NOW HRMS that clocks you in/out, then put it here. I send the secret in an X-Wingman-Secret header — your endpoint must reject anything without it.',
            )}
          </p>

          <div dir="ltr" style={{ display: 'grid', gap: 'var(--space-12)' }}>
            <div className="wg-field wg-field--free">
              <input
                type="url"
                inputMode="url"
                autoCapitalize="off"
                placeholder="https://nowhrms.com/api/wingman/clock"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
              />
            </div>
            <div className="wg-field wg-field--free">
              <input
                type="password"
                placeholder={actionConfigured ? t('Secret (leave blank to keep current)') : t('Shared secret')}
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 'var(--space-8)', flexWrap: 'wrap' }}>
              <button className="wg-btn-text" style={{ justifySelf: 'start' }} onClick={generateSecret}>
                {t('Generate a secret')}
              </button>
              {secret && (
                <button className="wg-btn-text" onClick={() => copy(secret, t('Secret'))}>
                  {t('Copy secret')}
                </button>
              )}
            </div>
            {secret && <p className="wg-note">{t('Copy this into NOW HRMS too — it is hidden once saved.')}</p>}
            <div className="wg-field wg-field--free">
              <input
                placeholder={t('Employee ID (optional — only if your endpoint needs it)')}
                value={employeeRef}
                onChange={(e) => setEmployeeRef(e.target.value)}
              />
            </div>
          </div>

          {error && <p style={{ color: '#c0392b', margin: 'var(--space-8) 0 0', fontSize: '0.9em' }}>{error}</p>}

          <button className="wg-btn full" disabled={saving} onClick={saveAction}>
            {saving ? t('Saving…') : actionConfigured ? t('Update endpoint') : t('Save endpoint')}
          </button>

          {actionConfigured && (
            <>
              <button className="wg-btn full outline" disabled={testing} onClick={testAction}>
                {testing ? t('Sending…') : t('Send a test clock-out')}
              </button>
              <p className="wg-note">
                <IconCheck size={16} />
                {t('The test sends a real clock-out, not a pretend one — there is no safe way to check without calling your system.')}
              </p>
              <button className="wg-btn full danger" disabled={saving} onClick={disconnectAction}>
                {t('Turn off chat clocking')}
              </button>
            </>
          )}

          <p className="wg-note">
            {t("Can't add an endpoint? Zapier or Make can bridge most HR systems — or just tell me “clock kar diya” and I keep track.")}
          </p>
        </>
      )}
    </SubScreen>
  )
}
