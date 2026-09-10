import { Icon, type IconName } from '../app/icons'
import { t } from '../i18n'

// Routes that keep the bottom bar visible. (Chat opens full-screen, so it is NOT
// a tab route — the bar hides while you're in the chat, giving the chat input the
// whole bottom.)
export const TAB_ROUTES = ['home', 'calendar', 'email', 'tasks', 'more'] as const

type Tab = { label: string; route: string; icon: IconName }
const LEFT: Tab[] = [
  { label: 'Home', route: 'home', icon: 'home' },
  { label: 'Calendar', route: 'calendar', icon: 'calendar' },
]
const RIGHT: Tab[] = [
  { label: 'Email', route: 'email', icon: 'mail' },
  { label: 'More', route: 'more', icon: 'grid' },
]

export const TabBar = ({ route }: { route: string }) => {
  const go = (r: string) => {
    window.location.hash = `#/${r}`
  }

  const renderTab = (tab: Tab) => {
    const active = route === tab.route
    return (
      <button
        key={tab.route}
        className={active ? 'on' : ''}
        aria-current={active ? 'page' : undefined}
        onClick={() => go(tab.route)}
      >
        <span className="pill">
          <Icon name={tab.icon} size={20} variant={active ? 'duotone' : 'stroke'} />
        </span>
        {t(tab.label)}
      </button>
    )
  }

  return (
    <nav className="wg-nav" data-feedback="primary">
      {LEFT.map(renderTab)}

      {/* Center: chat with Wingman — the star action, raised iOS-style. */}
      <button className="wg-nav__chat" aria-label={t('Chat with Wingman')} onClick={() => go('assistant')}>
        <span className="wg-nav__chat-ic">
          <Icon name="chat" size={24} variant="duotone" />
        </span>
      </button>

      {RIGHT.map(renderTab)}
    </nav>
  )
}
