import { AppHeader } from './AppHeader'
import { Icon, IconCheck, IconChevronR, IconSpark, ConnectorMark, type IconName } from './icons'
import { type Connector } from '../data/mock'
import { useProfile } from '../data/store'
import { useWaiting } from '../data/approvals'
import { useConnections, disconnect } from '../data/connections'
import { languageName, useAgent } from '../data/agentSettings'
import { t, tx } from '../i18n'
import { navigate } from '../shell/nav'
import { openConnect } from './ConnectSheet'
import { confirmAction } from '../shell/confirm'
import { toast } from '../shell/toast'
import { confirmSignOut } from './SignIn'
import avatarUrl from '../assets/avatar.jpg'
import './app.css'

const settings: { name: string; tone: string; icon: IconName; route: string }[] = [
  { name: 'Agent personality', tone: 'lavender', icon: 'spark', route: 'settings/personality' },
  { name: 'Meeting notetaker', tone: 'mint', icon: 'checkCircle', route: 'settings/notetaker' },
  { name: 'Email priorities', tone: 'blue', icon: 'mail', route: 'settings/email-priorities' },
  { name: 'Places & commute', tone: 'blue', icon: 'pin', route: 'places' },
  { name: 'Theme & appearance', tone: 'blue', icon: 'palette', route: 'settings/appearance' },
  { name: 'Language', tone: 'sand', icon: 'translate', route: 'settings/language' },
  { name: 'Permissions & privacy', tone: 'mint', icon: 'shield', route: 'settings/privacy' },
  { name: 'Help & support', tone: 'peach', icon: 'chat', route: 'settings/help' },
]

export const More = () => {
  const profile = useProfile()
  const { items, connected, linkable } = useConnections()
  const waiting = useWaiting()
  const values: Record<string, string> = { 'settings/language': t(languageName(useAgent().language)) }

  const unlink = async (c: Connector) => {
    const ok = await confirmAction({
      title: t('Disconnect {service}?', { service: c.name }),
      body: t(
        "I'll stop reading it straight away, and anything it was feeding goes quiet: briefings, approvals, the {service} parts of your day. What I've already learned from it stays until you clear my memory.",
        { service: c.name },
      ),
      mark: <ConnectorMark brandKey={c.key} icon={c.icon} tone={c.tone} size={32} rung="lg" />,
      confirmLabel: t('Disconnect it'),
      cancelLabel: t('Keep it connected'),
      destructive: true,
    })
    if (!ok) return
    disconnect(c.key)
    toast(t('{service} disconnected.', { service: c.name }), 'check')
  }

  return (
    <div className="gh">
      <div className="wg-screen wg-more">
        <AppHeader />

        {}
        {}
        <section className="wg-panel">
          <div className="wg-panel__scroll">
            <button className="wg-account wg-card-line" data-feedback="header" onClick={() => navigate('profile')}>
              <span className="wg-account__ava">
                <img src={profile.avatarUrl || avatarUrl} alt="" referrerPolicy="no-referrer" />
              </span>
              <div className="wg-account__tx">
                <div className="wg-account__name">{profile.name}</div>
                <div className="wg-account__sub">{t(profile.workspace)}</div>
              </div>
              <IconChevronR size={20} className="chev" />
            </button>

            <div className="wg-brief-line">
              <IconSpark size={16} />
              <span>
                {linkable > 0
                  ? tx('{connected} connected. {linkable} ready to link when you are.', {
                      connected: <b>{connected}</b>,
                      linkable: <b>{linkable}</b>,
                    })
                  : tx("{connected} connected. That's everything I can reach today.", {
                      connected: <b>{connected}</b>,
                    })}
              </span>
            </div>

            {}
            <div className="wg-panel-head">
              <h2>{t('Your work')}</h2>
            </div>
            <div className="wg-row-list">
              <button className="wg-conn wg-card-line" data-feedback="header" onClick={() => navigate('approvals')}>
                <span className="wg-chip blue sm">
                  <Icon name="checkCircle" size={18} variant="duotone" />
                </span>
                <div className="wg-conn__tx">
                  <div className="wg-conn__name">{t('Approvals')}</div>
                  <div className="wg-conn__desc">{t('Every call I brought you, and what you did')}</div>
                </div>
                {waiting.length > 0 && <span className="wg-conn__count">{waiting.length}</span>}
                <IconChevronR size={18} className="chev" />
              </button>
            </div>

            <div className="wg-panel-head">
              <h2>{t('Connectors')}</h2>
            </div>
            {}
            <div className="wg-row-list" data-feedback="header">
              {items.map((c) => {
                return (
                <div className="wg-conn wg-card-line" key={c.key}>
                  <ConnectorMark brandKey={c.key} icon={c.icon} tone={c.tone} size={24} />
                  <div className="wg-conn__tx">
                    <div className="wg-conn__name">{c.name}</div>
                    <div className="wg-conn__desc">{t(c.desc)}</div>
                  </div>
                  {}
                  {c.status === 'connected' && (
                    <button className="wg-conn__status done" onClick={() => unlink(c)}>
                      <IconCheck size={14} /> {t('Connected')}
                    </button>
                  )}
                  {c.status === 'connect' && (
                    <button className="wg-btn sm" onClick={() => openConnect(c.key)}>
                      {t('Connect')}
                    </button>
                  )}
                  {c.status === 'soon' && <span className="wg-conn__status soon">{t('Soon')}</span>}
                </div>
                )
              })}
              <button
                className="wg-conn wg-card-line"
                data-feedback="header"
                style={{ width: '100%', textAlign: 'left' }}
                onClick={() => navigate('settings/google')}
              >
                <span className="wg-chip blue sm">
                  <Icon name="mail" size={18} variant="duotone" />
                </span>
                <div className="wg-conn__tx">
                  <div className="wg-conn__name">{t('Google accounts')}</div>
                  <div className="wg-conn__desc">{t('Add or switch between multiple Google accounts')}</div>
                </div>
                <IconChevronR size={18} className="chev" />
              </button>
            </div>

            <div className="wg-panel-head">
              <h2>{t('Settings')}</h2>
            </div>
            <div className="wg-row-list wg-row-list--grouped wg-card-line">
              {settings.map((s) => (
                <button className="wg-conn wg-card-line" key={s.name} data-feedback="header" onClick={() => navigate(s.route)}>
                  <span className={`wg-chip ${s.tone} sm`}>
                    <Icon name={s.icon} size={18} variant="duotone" />
                  </span>
                  <div className="wg-conn__tx">
                    <div className="wg-conn__name">{t(s.name)}</div>
                  </div>
                  {values[s.route] && <span className="wg-set__val">{values[s.route]}</span>}
                  <IconChevronR size={18} className="chev" />
                </button>
              ))}
            </div>

            <button className="wg-signout wg-btn full danger" onClick={confirmSignOut}>
              <Icon name="logout" size={18} variant="duotone" />
              {t('Sign out')}
            </button>
          </div>
        </section>
      </div>

    </div>
  )
}
