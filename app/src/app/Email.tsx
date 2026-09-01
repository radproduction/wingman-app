import { useEffect, useRef, useState } from 'react'
import { AppHeader } from './AppHeader'
import { Avatar } from './Avatar'
import { NotConnected } from './NotConnected'
import { openApproval } from './ApprovalCard'
import { IconCheck, IconSpark } from './icons'
import { PanelSkeleton } from './Skeleton'
import { type EmailItem } from '../data/mock'
import { useEmails } from '../data/emails'
import { useConnections } from '../data/connections'
import { useFeedLoad } from '../data/loading'
import { api } from '../data/api'
import { t, tx } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import { Sheet } from '../shell/Sheet'
import { usePullToRefresh } from '../shell/usePullToRefresh'
import { PullSpacer } from '../shell/PullSpacer'
import './app.css'

// Where the email came from — shown as a small tag so the user can tell their
// Gmail apart from their connected business (webmail) inbox.
const SourceTag = ({ source }: { source?: 'gmail' | 'webmail' }) =>
  source ? (
    <span className={`wg-src-tag ${source}`}>{source === 'webmail' ? t('Business') : t('Gmail')}</span>
  ) : null

const MailRow = ({ m, onOpen }: { m: EmailItem; onOpen: (m: EmailItem) => void }) => (
  <button
    className={`wg-mail-row wg-card-line ${m.note ? 'handled' : ''}`}
    onClick={() => {
      tapQuiet()
      // Pre-drafted demo replies keep their approval flow; every real email opens
      // to read.
      if (m.approval) openApproval(m.approval)
      else onOpen(m)
    }}
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
      <div className="wg-mail-row__meta">
        <SourceTag source={m.source} />
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
    </div>
  </button>
)

// Read one email: fetch its full body live, show sender + subject + body.
const EmailSheet = ({ m, onClose }: { m: EmailItem; onClose: () => void }) => {
  const [body, setBody] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    if (m.id) {
      api
        .emailBody(m.id)
        .then((r) => alive && setBody(r.body || r.summary || t('(No content.)')))
        .catch(() => alive && setBody(m.preview || t('Could not open this email right now.')))
    } else {
      setBody(m.preview || '')
    }
    return () => {
      alive = false
    }
  }, [m.id, m.preview])

  return (
    <>
      <div className="wm-ap__head">
        <span className={`wg-chip ${m.tone} sm`}>{m.person ? <Avatar id={m.initial} /> : m.initial}</span>
        <SourceTag source={m.source} />
      </div>
      <h2 className="wm-sheet__title" id="wm-mail-title">
        {m.subject}
      </h2>
      <p className="wm-ap__why">{m.from}</p>

      <div className="wg-mail-read">
        {body === null ? (
          <p className="wg-mail-read__loading">
            <IconSpark size={14} /> {t('Opening…')}
          </p>
        ) : (
          <p className="wg-mail-read__body">{body}</p>
        )}
      </div>

      <button className="wg-btn full quiet" onClick={onClose}>
        {t('Close')}
      </button>
    </>
  )
}

export const Email = () => {
  const { revealed, showSkeleton, reload } = useFeedLoad()
  const scrollRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const email = useEmails()
  const [open, setOpen] = useState<EmailItem | null>(null)

  const { items, webmail } = useConnections()
  // Show the inbox when EITHER Gmail or a business mailbox is connected.
  const linked = webmail || items.find((c) => c.key === 'gmail')?.status === 'connected'
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
                  {email.needsReply.map((m, i) => (
                    <MailRow m={m} onOpen={setOpen} key={m.id || `${m.from}-${m.subject}-${i}`} />
                  ))}
                </div>

                <div className="wg-panel-head">
                  <h2>{t('Handled')}</h2>
                  <span>{email.handled.length}</span>
                </div>

                <div className="wg-mail-list">
                  {email.handled.map((m, i) => (
                    <MailRow m={m} onOpen={setOpen} key={m.id || `${m.from}-${m.subject}-${i}`} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Sheet open={!!open} onClose={() => setOpen(null)} labelledBy="wm-mail-title">
        {open && <EmailSheet m={open} onClose={() => setOpen(null)} />}
      </Sheet>
    </div>
  )
}
