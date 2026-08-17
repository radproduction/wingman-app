import type { CSSProperties } from 'react'
import { Icon, type IconName } from '../app/icons'
import { t } from '../i18n'

export const TAB_ROUTES = ['home', 'calendar', 'email', 'tasks', 'more'] as const

const TABS: { label: string; route: string; icon: IconName }[] = [
  { label: 'Home', route: 'home', icon: 'home' },
  { label: 'Calendar', route: 'calendar', icon: 'calendar' },
  { label: 'Email', route: 'email', icon: 'mail' },
  { label: 'Tasks', route: 'tasks', icon: 'task' },
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
        return (
          <button
            key={tab.route}
            className={active ? 'on' : ''}
            aria-current={active ? 'page' : undefined}
            onClick={() => {
              window.location.hash = `#/${tab.route}`
            }}
          >
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
