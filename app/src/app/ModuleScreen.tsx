import type { ReactNode } from 'react'
import { SubScreen } from './SubScreen'
import { ApprovalAction } from './ApprovalCard'
import { Avatar } from './Avatar'
import { Icon, IconWhatsapp, IconSpark, type IconName } from './icons'
import { moduleHead, type BusinessKey, type ChipTone, type ModuleKey } from '../data/mock'
import { localize, t } from '../i18n'
import { openWhatsApp } from '../shell/whatsapp'
import './app.css'

export const ModuleScreen = ({
  k,
  back = 'home',
  footer,
  children,
}: {
  k: ModuleKey | BusinessKey
  back?: string
  footer?: ReactNode
  children: ReactNode
}) => {
  const head = localize(moduleHead(k))
  return (
    <SubScreen title={head.title} back={back} className="wg-mod" footer={footer}>
      {}
      <div className="wg-mod__hero wg-card-line">
        <span className="wg-mod__tx">
          <span className="wg-mod__val">{head.value}</span>
          <span className="wg-mod__sub">{head.sub}</span>
        </span>
        <span className={`wg-chip ${head.tone} lg`}>
          <Icon name={head.icon} size={24} variant="duotone" />
        </span>
      </div>

      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>{head.brief}</span>
      </div>

      {children}

      {}
      {!head.unset && (
        <button className="wg-mod__ask wg-btn full wa" onClick={() => openWhatsApp(head.askText)}>
          <IconWhatsapp size={18} /> {t('Ask Wingman about {thing}', { thing: head.ask })}
        </button>
      )}
    </SubScreen>
  )
}

export const ModHead = ({ title, note }: { title: string; note?: string }) => (
  <div className="wg-panel-head">
    <h2>{t(title)}</h2>
    {note && <span>{t(note)}</span>}
  </div>
)

export const ModRow = ({
  tone,
  icon,
  initial,
  face,
  name,
  meta,
  value,
  note,
  approval,
  done,
}: {
  tone: ChipTone
  face?: boolean
  icon?: IconName
  initial?: string
  name: string
  meta?: string
  value?: string
  note?: string
  approval?: string
  done?: boolean
}) => {
  return (
    <div className={`wg-mrow wg-card-line ${done ? 'done' : ''}`}>
      <span className={`wg-chip ${tone} ${initial && !face ? 'wg-chip--letter' : ''} sm`}>
        {face && initial ? <Avatar id={initial} /> : (initial ?? (icon && <Icon name={icon} size={19} variant="duotone" />))}
      </span>
      <span className="wg-mrow__tx">
        <span className="wg-mrow__top">
          <span className="wg-mrow__name">{t(name)}</span>
          {value && <span className="wg-mrow__val">{t(value)}</span>}
        </span>
        {meta && <span className="wg-mrow__meta">{t(meta)}</span>}
        {note && <span className="wg-mrow__note">{t(note)}</span>}
        {approval && <ApprovalAction id={approval} />}
      </span>
    </div>
  )
}
