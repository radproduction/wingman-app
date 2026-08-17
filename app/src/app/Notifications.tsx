import { SubScreen } from './SubScreen'
import { ApprovalAction } from './ApprovalCard'
import { Icon, IconSpark } from './icons'
import { notifications as noticesSeed, type Notice } from '../data/mock'
import { useRead, markRead, markAllRead as clearAll } from '../data/notices'
import { localize, t, tx } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import './app.css'

const NoticeRow = ({ n, read, onRead }: { n: Notice; read: boolean; onRead: () => void }) => (
  <div
    className={`wg-notice wg-card-line ${read ? 'read' : ''}`}
    onClick={() => {
      tapQuiet()
      onRead()
    }}
  >
    <span className={`wg-chip ${n.tone} sm`}>
      <Icon name={n.icon} size={19} variant="duotone" />
      {!read && <i className="wg-notice__unread" aria-hidden="true" />}
    </span>
    <span className="wg-notice__tx">
      <span className="wg-notice__top">
        <span className="wg-notice__title">{n.title}</span>
        <span className="wg-notice__time">{n.time}</span>
      </span>
      <span className="wg-notice__body">{n.body}</span>
      {n.approval && <ApprovalAction id={n.approval} />}
    </span>
  </div>
)

export const Notifications = () => {
  const read = useRead()
  const notifications = localize(noticesSeed)

  const markAllRead = () => {
    tapQuiet()
    clearAll()
  }

  const isRead = (n: Notice) => read.includes(n.id)
  const unreadCount = notifications.today.filter((n) => !isRead(n)).length

  return (
    <SubScreen
      title="Notifications"
      back="home"
      className="wg-notices"
      action={
        unreadCount > 0 ? (
          <button className="wg-subbar__act" onClick={markAllRead}>
            {t('Mark all read')}
          </button>
        ) : undefined
      }
    >
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {unreadCount > 0
            ? tx('{n} want you.', { n: <b>{unreadCount}</b> })
            : t("You're all caught up.")}{' '}
          {tx('I handled {n} quietly since yesterday.', { n: <b>{notifications.handledQuietly}</b> })}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Today')}</h2>
        {unreadCount > 0 && <span>{t('{n} new', { n: unreadCount })}</span>}
      </div>
      <div className="wg-row-list">
        {notifications.today.map((n) => (
          <NoticeRow key={n.id} n={n} read={isRead(n)} onRead={() => markRead(n.id)} />
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Earlier')}</h2>
      </div>
      <div className="wg-row-list">
        {notifications.earlier.map((n) => (
          <NoticeRow key={n.id} n={n} read={isRead(n)} onRead={() => markRead(n.id)} />
        ))}
      </div>
    </SubScreen>
  )
}
