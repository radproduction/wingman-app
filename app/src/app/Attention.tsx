import { Fragment, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconChevronR, IconPlus, IconSpark } from './icons'
import { ActionSheet } from './ActionSheet'
import { ActionRow } from './Widgets'
import { REASONS, useAttention, type AttentionReason } from '../data/attention'
import { actionItemById, type ActionItem } from '../data/actionItems'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'
import './business.css'
import './dashboard.css'


const ORDER: AttentionReason[] = ['overdue', 'blocked', 'unassigned', 'urgent', 'waiting']

const HELP: Record<AttentionReason, string> = {
  overdue: 'Past their date. Give them a new one, or hand them to someone who can.',
  blocked: 'Stopped by something else. Someone is waiting on the thing in the way.',
  unassigned: 'Agreed, but nobody has their name on it yet.',
  urgent: 'High priority and due today.',
  waiting: 'I am holding these until you decide. Nothing happens until you do.',
}

export const Attention = () => {
  const list = useAttention()
  const [edit, setEdit] = useState<ActionItem | undefined>()
  const [open, setOpen] = useState(false)

  const openItem = (id?: string) => {
    const item = id ? actionItemById(id) : undefined
    if (!item) return
    setEdit(item)
    setOpen(true)
  }

  return (
    <SubScreen
      title="Needs your attention"
      back="home"
      className="wg-mod"
      feedback="header"
      action={
        <button
          className="wg-subbar__act"
          aria-label={t('Add a task')}
          onClick={() => {
            setEdit(undefined)
            setOpen(true)
          }}
        >
          <IconPlus size={20} />
        </button>
      }
    >
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {list.length === 0
            ? t('Nothing is late, blocked or unowned, and I am not holding any decisions. I will tell you the moment that changes.')
            : t('{n} things need you. I have grouped them by what is actually wrong, so you can fix them the same way.', {
                n: list.length,
              })}
        </span>
      </div>

      {list.length === 0 ? (
        <>
          <div className="wg-bc__summary wg-card-line">
            <Icon name="checkCircle" size={18} variant="duotone" />
            <p>
              {t(
                'All clear. I am still watching every action item, task and decision - anything that goes overdue, gets blocked or ends up with nobody on it will appear here first.',
              )}
            </p>
          </div>
          <button className="wg-btn full soft" onClick={() => navigate('daily-summary')}>
            {t("See today's snapshot")}
          </button>
        </>
      ) : (
        ORDER.map((reason) => {
          const group = list.filter((a) => a.reason === reason)
          if (group.length === 0) return null
          return (
            <Fragment key={reason}>
              <div className="wg-panel-head">
                <h2>{t(REASONS[reason].label)}</h2>
                <span>{group.length}</span>
              </div>
              <p className="wg-att__help">{t(HELP[reason])}</p>
              <div className="wg-set-list wg-card-line wg-att__list">
                {group.map((a) => {
                  const item = a.actionId ? actionItemById(a.actionId) : undefined
                  return item ? (
                    <ActionRow a={item} key={a.id} onOpen={() => openItem(a.actionId)} />
                  ) : (
                    <button className="wg-wrow" key={a.id} onClick={() => navigate(a.route)}>
                      <span className={`wg-chip ${a.tone} xs`}>
                        <Icon name={a.icon} size={16} variant="duotone" />
                      </span>
                      <span className="wg-wrow__tx">
                        <span className="wg-wrow__name">{t(a.title)}</span>
                        <span className="wg-wrow__meta">{t(a.sub)}</span>
                      </span>
                      <IconChevronR size={18} className="chev" />
                    </button>
                  )
                })}
              </div>
            </Fragment>
          )
        })
      )}

      <p className="wg-footnote">
        {t(
          'This list is built, not kept: anything overdue, blocked, unassigned or waiting on your decision appears here on its own and leaves the moment it is settled.',
        )}
      </p>

      <ActionSheet open={open} onClose={() => setOpen(false)} edit={edit} />
    </SubScreen>
  )
}
