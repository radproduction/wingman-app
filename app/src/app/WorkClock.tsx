import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconShield } from './icons'
import { api, ApiError } from '../data/api'
import { t } from '../i18n'
import { toast } from '../shell/toast'
import { confirmAction } from '../shell/confirm'
import './app.css'
import './business.css'

// Connect the company attendance system (NOW HRMS) to the work clock.
//
// The headline path is one-tap: the employee types ONLY their company email and
// taps Connect — the endpoint URL + shared secret live server-side (set once for
// the whole company), so nobody copies URLs or secrets. The manual webhook/
// endpoint setup (for a different HRMS, or an admin) is tucked under "Advanced".
export const WorkClock = () => {
  const [loading, setLoading] = useState(true)

  // NOW HRMS one-tap connector
  const [nowAvailable, setNowAvailable] = useState(false)
  const [nowConnected, setNowConnected] = useState(false)
  const [nowEmail, setNowEmail] = useState('')
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [testing, setTesting] = useState(false)
  const [error, setError] = useState('')

  // Advanced (manual) — inbound link + outbound endpoint
  const [advanced, setAdvanced] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [receiving, setReceiving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [actionConfigured, setActionConfigured] = useState(false)
  const [actionUrl, setActionUrl] = useState('')
  const [secret, setSecret] = useState('')
  const [employeeRef, setEmployeeRef] = useState('')
  const [savingAction, setSavingAction] = useState(false)

  const load = () =>
    api
      .workConnect()
      .then((r) => {
        setNowAvailable(!!r.nowhrms?.available)
        setNowConnected(!!r.nowhrms?.connected)
        setNowEmail(r.nowhrms?.email ?? '')
        setWebhookUrl(r.webhook_url)
        setReceiving(!!r.connected)
        // Only surface the generic manual form when this is NOT a NOW HRMS link.
        setActionConfigured(!!r.action_configured && !r.nowhrms?.connected)
        setActionUrl(r.nowhrms?.connected ? '' : r.action_url ?? '')
        setEmployeeRef(r.nowhrms?.connected ? '' : r.employee_ref ?? '')
      })
      .catch(() => {})

  useEffect(() => {
    let alive = true
    void load().finally(() => {
      if (alive) setLoading(false)
    })
    return () => {
      alive = false
    }
  }, [])

  // ── NOW HRMS one-tap ──
  const connectNow = async () => {
    setError('')
    const e = email.trim()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError(t('Enter your company email (the one your HRMS knows you by).'))
      return
    }
    setBusy(true)
    try {
      await api.workConnectNowHrms(e)
      setNowConnected(true)
      setNowEmail(e)
      setEmail('')
      toast(t('Connected to NOW HRMS.'), 'checkCircle')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Could not connect right now.'))
    } finally {
      setBusy(false)
    }
  }

  const disconnectNow = async () => {
    const ok = await confirmAction({
      title: t('Disconnect NOW HRMS?'),
      body: t("I'll stop clocking you and stop watching for a forgotten clock-out. You can reconnect any time."),
      confirmLabel: t('Disconnect it'),
      cancelLabel: t('Keep it'),
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.workDisconnectNowHrms()
      setNowConnected(false)
      setNowEmail('')
      toast(t('NOW HRMS disconnected.'), 'check')
    } catch {
      toast(t('Could not disconnect right now.'), 'alert')
    } finally {
      setBusy(false)
    }
  }

  const testClockOut = async () => {
    setError('')
    setTesting(true)
    try {
      await api.workTestAction('clock_out')
      toast(t('Worked — a real clock-out was sent. Undo it in NOW HRMS if you did not mean to.'), 'checkCircle')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('That did not go through.'))
    } finally {
      setTesting(false)
    }
  }

  // ── Advanced: inbound link ──
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
      body: t('The current link stops working right away.'),
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

  // ── Advanced: manual outbound endpoint ──
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
    setSavingAction(true)
    try {
      await api.workSetAction({ url, secret: secret || undefined, employee_ref: employeeRef.trim() || null })
      setActionConfigured(true)
      setSecret('')
      toast(t('Saved. Send a test clock-out to be sure it works.'), 'checkCircle')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Could not save that.'))
    } finally {
      setSavingAction(false)
    }
  }

  return (
    <SubScreen title="Work clock" back="more" className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <Icon name="checkCircle" size={18} variant="duotone" />
        <p>
          {t(
            'Connect your company attendance system so I catch a forgotten clock-out — and clock you in and out when you ask on WhatsApp.',
          )}
        </p>
      </div>

      {loading ? (
        <p className="wg-note">{t('Loading…')}</p>
      ) : (
        <>
          {/* ── Hero: one-tap NOW HRMS ── */}
          {nowAvailable ? (
            nowConnected ? (
              <>
                <div className="wg-integ wg-card-line">
                  <div className="wg-integ__top">
                    <span className="wg-chip mint sm">
                      <IconCheck size={18} />
                    </span>
                    <div className="wg-integ__tx">
                      <div className="wg-integ__name">{t('NOW HRMS')}</div>
                      <div className="wg-integ__sync">{nowEmail || t('Connected')}</div>
                    </div>
                    <span className="wg-mstatus go">{t('Connected')}</span>
                  </div>
                </div>
                <button className="wg-btn full outline" disabled={testing} onClick={testClockOut}>
                  {testing ? t('Sending…') : t('Send a test clock-out')}
                </button>
                {error && <p style={{ color: '#c0392b', margin: 'var(--space-8) 0 0', fontSize: '0.9em' }}>{error}</p>}
                <button className="wg-btn full danger" disabled={busy} onClick={disconnectNow}>
                  {t('Disconnect NOW HRMS')}
                </button>
              </>
            ) : (
              <>
                <div className="wg-panel-head">
                  <h2>{t('Connect NOW HRMS')}</h2>
                </div>
                <p className="wg-note">{t('Enter your company email — the same one NOW HRMS knows you by. That’s it.')}</p>
                <div dir="ltr" className="wg-field wg-field--free">
                  <input
                    type="email"
                    inputMode="email"
                    autoCapitalize="off"
                    placeholder="you@wehearyou.studio"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') connectNow()
                    }}
                  />
                </div>
                {error && <p style={{ color: '#c0392b', margin: 'var(--space-8) 0 0', fontSize: '0.9em' }}>{error}</p>}
                <button className="wg-btn full" disabled={busy} onClick={connectNow}>
                  {busy ? t('Connecting…') : t('Connect')}
                </button>
                <p className="wg-note">
                  <IconShield size={16} />
                  {t('No passwords, no setup — I only clock you in/out and notice a forgotten clock-out.')}
                </p>
              </>
            )
          ) : (
            <p className="wg-note">
              {t('The NOW HRMS connector is not switched on for this workspace yet. Ask your admin, or use Advanced setup below.')}
            </p>
          )}

          {/* ── Advanced (manual) — for a different HRMS or an admin ── */}
          <button className="wg-btn-text" style={{ marginTop: 'var(--space-20)' }} onClick={() => setAdvanced((v) => !v)}>
            {advanced ? t('Hide advanced setup') : t('Advanced setup (other HRMS)')}
          </button>

          {advanced && (
            <>
              <div className="wg-panel-head">
                <h2>{t('Let your HRMS tell me')}</h2>
                {receiving && <span className="wg-mstatus go">{t('Receiving')}</span>}
              </div>
              <p className="wg-note">
                {t('POST to this private link on clock in/out, body {"event":"clock_in"} or {"event":"clock_out"}:')}
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

              <div className="wg-panel-head" style={{ marginTop: 'var(--space-20)' }}>
                <h2>{t('Let me clock you in & out')}</h2>
                {actionConfigured && <span className="wg-mstatus go">{t('On')}</span>}
              </div>
              <p className="wg-note">
                {t('Add an endpoint in your HRMS that clocks you in/out; I send the secret in an X-Wingman-Secret header.')}
              </p>
              <div dir="ltr" style={{ display: 'grid', gap: 'var(--space-12)' }}>
                <div className="wg-field wg-field--free">
                  <input
                    type="url"
                    inputMode="url"
                    autoCapitalize="off"
                    placeholder="https://your-hrms.example.com/api/wingman/clock"
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
                  <button className="wg-btn-text" onClick={generateSecret}>
                    {t('Generate a secret')}
                  </button>
                  {secret && (
                    <button className="wg-btn-text" onClick={() => copy(secret, t('Secret'))}>
                      {t('Copy secret')}
                    </button>
                  )}
                </div>
                <div className="wg-field wg-field--free">
                  <input
                    placeholder={t('Employee ID (optional)')}
                    value={employeeRef}
                    onChange={(e) => setEmployeeRef(e.target.value)}
                  />
                </div>
              </div>
              <button className="wg-btn full" disabled={savingAction} onClick={saveAction}>
                {savingAction ? t('Saving…') : actionConfigured ? t('Update endpoint') : t('Save endpoint')}
              </button>
            </>
          )}
        </>
      )}
    </SubScreen>
  )
}
