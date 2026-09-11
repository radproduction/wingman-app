import type { CSSProperties } from 'react'
import { Icon, type IconName } from '../app/icons'
import { WingGlyph } from '../onboarding/WingGlyph'
import { t } from '../i18n'

export const TAB_ROUTES = ['home', 'calendar', 'email', 'tasks', 'more'] as const

// Center slot is the raised Wingman logo → opens the chat. Tasks removed.
const TABS: { label: string; route: string; icon: IconName }[] = [
  { label: 'Home', route: 'home', icon: 'home' },
  { label: 'Calendar', route: 'calendar', icon: 'calendar' },
  { label: 'Chat', route: 'assistant', icon: 'chat' },
  { label: 'Email', route: 'email', icon: 'mail' },
  { label: 'More', route: 'more', icon: 'grid' },
]

export const TabBar = ({ route }: { route: string }) => {
  const activeIndex = Math.max(
    0,
    TABS.findIndex((tab) => tab.route === route),
  )
  return (
    <nav className="wg-nav" data-feedback="primary" style={{ '--active-index': activeIndex } as CSSProperties}>
      <span className="wg-nav__ind" aria-hidden="true" />
      {TABS.map((tab) => {
        const active = route === tab.route
        const go = () => {
          window.location.hash = `#/${tab.route}`
        }

        // The Wingman logo, raised, as the centre action.
        if (tab.route === 'assistant') {
          return (
            <button key={tab.route} className="wg-nav__logobtn" aria-label={t('Chat with Wingman')} onClick={go}>
              <span className="wg-nav__logo">
                <WingGlyph className="wg-nav__logo-mark" />
              </span>
            </button>
          )
        }

        return (
          <button key={tab.route} className={active ? 'on' : ''} aria-current={active ? 'page' : undefined} onClick={go}>
            <span className="pill">
              <Icon name={tab.icon} size={20} variant={active ? 'duotone' : 'stroke'} />
            </span>
            {t(tab.label)}
          </button>
        )
      })}
    </nav>
  )
}
