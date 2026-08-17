import { HeaderBrand } from './HeaderBrand'
import { Icon, IconWhatsapp } from './icons'
import { useUnreadCount } from '../data/notices'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import avatarUrl from '../assets/avatar.jpg'

export const AppHeader = () => {
  const unread = useUnreadCount()
  return (
    <header className="wg-appbar" data-feedback="header">
      <button className="wg-wa" aria-label={t('Wingman on WhatsApp — online')} onClick={() => openWhatsApp()}>
        <IconWhatsapp size={24} />
        <i className="wg-wa__dot" aria-hidden="true" />
      </button>
      <HeaderBrand />
      <div className="wg-appbar__end">
        <button
          className="wg-bell"
          aria-label={unread ? t('Notifications — {n} unread', { n: unread }) : t('Notifications')}
          onClick={() => navigate('notifications')}
        >
          <Icon name="bell" size={20} />
          {unread > 0 && <i className="wg-bell__dot" aria-hidden="true" />}
        </button>
        <button className="wg-avatar" aria-label={t('Your account')} onClick={() => navigate('profile')}>
          <img src={avatarUrl} alt="" />
        </button>
      </div>
    </header>
  )
}
