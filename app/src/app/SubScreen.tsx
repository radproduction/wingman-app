import type { ReactNode } from 'react'
import { Icon, IconChevronL, IconChevronR, type IconName } from './icons'
import { t } from '../i18n'
import { goBack, navigate } from '../shell/nav'
import type { FeedbackTier } from '../shell/feedback'
import type { ChipTone } from '../data/mock'
import './app.css'

export const SubScreen = ({
  title,
  action,
  back,
  className = '',
  feedback,
  footer,
  children,
}: {
  title: string
  action?: ReactNode
  back: string
  className?: string
  feedback?: FeedbackTier
  footer?: ReactNode
  children: ReactNode
}) => (
  <div className="gh">
    <div className={`wg-screen wg-sub ${className}`}>
      <header className="wg-subbar">
        <button className="wg-subbar__back" data-feedback="back" aria-label={t('Back')} onClick={() => goBack(back)}>
          <IconChevronL size={20} />
        </button>
        {}
        <h1>{t(title)}</h1>
        {action}
      </header>

      <section className="wg-panel" data-feedback={feedback}>
        <div className="wg-panel__scroll">{children}</div>
        {footer && <div className="wg-sub__foot">{footer}</div>}
      </section>
    </div>
  </div>
)

export const SetRow = ({
  icon,
  tone,
  name,
  value,
  to,
  onTap,
  inPlace,
  warn,
}: {
  icon: IconName
  tone: ChipTone
  name: string
  value?: string
  to?: string
  onTap?: () => void
  inPlace?: boolean
  warn?: boolean
}) => (
  <button
    className={`wg-set ${warn ? 'warn' : ''}`}
    data-feedback={to ? 'header' : undefined}
    onClick={to ? () => navigate(to) : onTap}
  >
    <span className={`wg-chip ${tone} xs`}>
      <Icon name={icon} size={17} variant="duotone" />
    </span>
    <span className="wg-set__name">{t(name)}</span>
    {}
    {value && <span className="wg-set__val">{t(value)}</span>}
    {!inPlace && <IconChevronR size={18} className="chev" />}
  </button>
)
