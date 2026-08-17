import { useRef } from 'react'
import { AppHeader } from './AppHeader'
import { Avatar } from './Avatar'
import { NotConnected } from './NotConnected'
import { openApproval } from './ApprovalCard'
import { IconCheck, IconSpark } from './icons'
import { PanelSkeleton } from './Skeleton'
import { email as emailSeed, type EmailItem } from '../data/mock'
import { useConnections } from '../data/connections'
import { useFeedLoad } from '../data/loading'
import { localize, t, tx } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import { usePullToRefresh } from '../shell/usePullToRefresh'
import { PullSpacer } from '../shell/PullSpacer'
import './app.css'

const MailRow = ({ m }: { m: EmailItem }) => (
  <button
    className={`wg-mail-row wg-card-line ${m.note ? 'handled' : ''}`}
    onClick={
      m.approval
        ? () => {
            tapQuiet()
            openApproval(m.approval!)
          }
        : undefined
    }
  >
    <span className={`wg-chip ${m.tone} sm`}>
      {m.person ? <Avatar id={m.initial} /> : m.initial}
      {m.unread && <i className="wg-mail-row__unread" aria-hidden="true" />}
    </span>
    <div className="wg-mail-row__tx">
      <div className="wg-mail-row__top">
        <span className="wg-mail-row__from">{m.from}</span>
        <span className="wg-mail-row__time">{m.time}</span>
      </div>
      <div className="wg-mail-row__subj">{m.subject}</div>
      {m.approval && (
        <span className="wg-mail-row__ready">
          <IconSpark size={12} /> {t('Reply ready')}
        </span>
      )}
      {m.note && (
        <span className="wg-mail-row__did">
          <IconCheck size={12} /> {m.note}
        </span>
      )}
    </div>
  </button>
)

export const Email = () => {
  const { revealed, showSkeleton, reload } = useFeedLoad()
  const scrollRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const email = localize(emailSeed)

  const { items } = useConnections()
  const linked = items.find((c) => c.key === 'gmail')?.status === 'connected'
  usePullToRefresh({ scrollerRef: scrollRef, hostRef: screenRef, onRefresh: reload, enabled: linked })
  if (!linked)
    return (
      <div className="gh">
        <div className="wg-screen wg-mail">
          <AppHeader />
          <NotConnected connector="gmail" />
        </div>
      </div>
    )

  return (
    <div className="gh">
      <div className="wg-screen wg-mail" ref={screenRef}>
        <AppHeader />
        <PullSpacer />

        {}
        {}
        <section className="wg-panel">
          <div className="wg-panel__scroll" ref={scrollRef}>
            <div className={`wg-skel ${revealed ? 'is-revealed' : ''}`} aria-busy={!revealed}>
              {showSkeleton && <PanelSkeleton groups={[3]} />}

              <div className="wg-skel__content" aria-hidden={!revealed}>
                {}
                <div className="wg-brief-line">
                  <IconSpark size={16} />
                  <span>
                    {tx('I cleared {done} today. {waiting} want a personal reply.', {
                      done: <b>{email.handledToday}</b>,
                      waiting: email.needsReply.length,
                    })}
                  </span>
                </div>

                <div className="wg-panel-head">
                  <h2>{t('Needs a reply')}</h2>
                  <span>{email.needsReply.length}</span>
                </div>

                <div className="wg-mail-list">
                  {email.needsReply.map((m) => (
                    <MailRow m={m} key={`${m.from}-${m.subject}`} />
                  ))}
                </div>

                <div className="wg-panel-head">
                  <h2>{t('Handled')}</h2>
                  <span>{email.handled.length}</span>
                </div>

                <div className="wg-mail-list">
                  {email.handled.map((m) => (
                    <MailRow m={m} key={`${m.from}-${m.subject}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
