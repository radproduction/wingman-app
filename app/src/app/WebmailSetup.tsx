import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconShield } from './icons'
import { api, ApiError } from '../data/api'
import { t } from '../i18n'
import { toast } from '../shell/toast'
import { confirmAction } from '../shell/confirm'
import './app.css'
import './business.css'

// Connect a business mailbox over IMAP/SMTP. The backend verifies the
// credentials against the real servers and encrypts the password at rest —
// nothing is stored until it actually connects.
export const WebmailSetup = () => {
  const [loading, setLoading] = useState(true)
  const [connected, setConnected] = useState(false)
  const [savedAddress, setSavedAddress] = useState('')

  const [address, setAddress] = useState('')
  const [password, setPassword] = useState('')
  const [advanced, setAdvanced] = useState(false)
  const [imapHost, setImapHost] = useState('')
  const [imapPort, setImapPort] = useState('')
  const [smtpHost, setSmtpHost] = useState('')
  const [smtpPort, setSmtpPort] = useState('')
  const [fromName, setFromName] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    void api
      .me()
      .then((me) => {
        if (!alive) return
        const m = me as Record<string, unknown>
        setConnected(!!m.webmail_connected)
        setSavedAddress(String(m.webmail_address || ''))
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const connect = async () => {
    setError('')
    const addr = address.trim()
    if (!addr || !password) {
      setError(t('Enter your email address and password.'))
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addr)) {
      setError(t("That email address doesn't look right — check it and try again."))
      return
    }
    setBusy(true)
    try {
      const body: Parameters<typeof api.webmailConnect>[0] = { address: addr, password }
      // Send any server settings the user typed, regardless of whether the panel
      // is open (collapsing it must not silently drop what they entered).
      if (imapHost.trim()) body.imap_host = imapHost.trim()
      if (smtpHost.trim()) body.smtp_host = smtpHost.trim()
      const ip = Number(imapPort)
      if (imapPort.trim() && Number.isInteger(ip) && ip > 0) body.imap_port = ip
      const sp = Number(smtpPort)
      if (smtpPort.trim() && Number.isInteger(sp) && sp > 0) body.smtp_port = sp
      if (fromName.trim()) body.from_name = fromName.trim()
      const res = await api.webmailConnect(body)
      setConnected(true)
      setSavedAddress(res.address)
      setPassword('')
      toast(res.send_note ? t('Connected — reading works, sending is limited.') : t('Business email connected.'), 'checkCircle')
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : t('Could not connect that mailbox. Check the details and try again.')
      setError(msg)
      // Only push the user toward server settings for a genuine host/port issue.
      if (/imap|smtp|host|port|server/i.test(msg)) setAdvanced(true)
    } finally {
      setBusy(false)
    }
  }

  const disconnect = async () => {
    const ok = await confirmAction({
      title: t('Disconnect {address}?', { address: savedAddress }),
      body: t("I'll stop reading this mailbox straight away. You can reconnect any time."),
      confirmLabel: t('Disconnect it'),
      cancelLabel: t('Keep it connected'),
      destructive: true,
    })
    if (!ok) return
    setBusy(true)
    try {
      await api.webmailDisconnect()
      setConnected(false)
      setSavedAddress('')
      toast(t('Business email disconnected.'), 'check')
    } catch {
      toast(t('Could not disconnect right now.'), 'alert')
    } finally {
      setBusy(false)
    }
  }

  return (
    <SubScreen title="Business email" back="business/integrations" className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <Icon name="mail" size={18} variant="duotone" />
        <p>
          {t(
            'Connect your own business inbox (IMAP/SMTP) and I watch customer mail and draft replies for you. I only read it — nothing sends without a card you approve.',
          )}
        </p>
      </div>

      {loading ? (
        <p className="wg-note">{t('Loading…')}</p>
      ) : connected ? (
        <>
          <div className="wg-integ wg-card-line">
            <div className="wg-integ__top">
              <span className="wg-chip mint sm">
                <IconCheck size={18} />
              </span>
              <div className="wg-integ__tx">
                <div className="wg-integ__name">{savedAddress || t('Business email')}</div>
                <div className="wg-integ__sync">{t('Connected')}</div>
              </div>
              <span className="wg-mstatus go">{t('Connected')}</span>
            </div>
          </div>
          <button className="wg-btn full danger" disabled={busy} onClick={disconnect}>
            {t('Disconnect')}
          </button>
        </>
      ) : (
        <>
          <div className="wg-panel-head">
            <h2>{t('Your mailbox')}</h2>
          </div>
          <div dir="ltr" style={{ display: 'grid', gap: 'var(--space-12)' }}>
            <div className="wg-field">
              <input
                type="email"
                inputMode="email"
                autoCapitalize="off"
                placeholder={t('Email address')}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="wg-field">
              <input
                type="password"
                placeholder={t('Password (or app password)')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button className="wg-btn-text" style={{ justifySelf: 'start' }} onClick={() => setAdvanced((v) => !v)}>
              {advanced ? t('Hide server settings') : t('Enter server settings manually')}
            </button>

            {advanced && (
              <>
                <div className="wg-field">
                  <input placeholder={t('IMAP host (e.g. imap.yourhost.com)')} value={imapHost} onChange={(e) => setImapHost(e.target.value)} />
                </div>
                <div className="wg-field">
                  <input inputMode="numeric" placeholder={t('IMAP port (993)')} value={imapPort} onChange={(e) => setImapPort(e.target.value)} />
                </div>
                <div className="wg-field">
                  <input placeholder={t('SMTP host (e.g. smtp.yourhost.com)')} value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
                </div>
                <div className="wg-field">
                  <input inputMode="numeric" placeholder={t('SMTP port (465)')} value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
                </div>
                <div className="wg-field">
                  <input placeholder={t('From name (optional)')} value={fromName} onChange={(e) => setFromName(e.target.value)} />
                </div>
              </>
            )}
          </div>

          {error && <p style={{ color: '#c0392b', margin: 'var(--space-8) 0 0', fontSize: '0.9em' }}>{error}</p>}

          <button className="wg-btn full" disabled={busy} onClick={connect}>
            {busy ? t('Connecting…') : t('Connect')}
          </button>

          <p className="wg-note">
            <IconShield size={16} />
            {t('Your password is verified with your mail server, encrypted, and never shown again. 2-factor accounts need an app password.')}
          </p>
        </>
      )}
    </SubScreen>
  )
}
