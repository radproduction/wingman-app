import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { openApproval } from './ApprovalCard'
import { Icon, IconSpark, IconWhatsapp, IconChevronR } from './icons'
import { dailySummary, useIntel, markReviewed, type SummaryLine } from '../data/intelligence'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import { tapQuiet } from '../shell/feedback'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import './app.css'
import './business.css'
import './intelligence.css'

const Row = ({ line, done }: { line: SummaryLine; done?: boolean }) => {
  const body = (
    <>
      <span className={`wg-chip ${line.tone} sm`}>
        <Icon name={line.icon} size={18} variant="duotone" />
      </span>
      <span className="wg-dsum-row__tx">
        <span className="wg-dsum-row__title">{t(line.title)}</span>
        <span className="wg-dsum-row__sub">{t(line.sub)}</span>
      </span>
      {line.route && !line.approval && <IconChevronR size={18} className="chev" />}
    </>
  )
  const cls = `wg-dsum-row wg-card-line ${done ? 'done' : ''}`
  if (line.approval)
    return (
      <button
        className={cls}
        onClick={() => {
          tapQuiet()
          openApproval(line.approval!)
        }}
      >
        {body}
      </button>
    )
  return line.route ? (
    <button className={cls} onClick={() => navigate(line.route!)}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  )
}

const Group = ({ kind, title, note, lines }: { kind: string; title: string; note?: string; lines: SummaryLine[] }) => {
  if (lines.length === 0) return null
  return (
    <>
      <div className={`wg-dsum-head ${kind}`}>
        <span className="dot" />
        <h2>{t(title)}</h2>
        {note && <span>{t(note)}</span>}
      </div>
      <div className="wg-msteps">
        {lines.map((l) => (
          <Row key={l.title} line={l} done={kind === 'handled'} />
        ))}
      </div>
    </>
  )
}

export const DailySummary = () => {
  const { reviewed } = useIntel()
  const [tab, setTab] = useState<'morning' | 'evening'>('morning')
  const s = dailySummary

  return (
    <SubScreen
      title="Today's Snapshot"
      back="home"
      className="wg-mod"
      feedback="header"
      footer={
        <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
          <button
            className="wg-btn full outline"
            onClick={() => {
              markReviewed(tab)
              toast(t('Marked reviewed.'), 'check')
            }}
          >
            {reviewed[tab] ? t('Reviewed') : t('Mark reviewed')}
          </button>
          <button className="wg-btn full wa" onClick={() => openWhatsApp(t('Send me my daily summary'))}>
            <IconWhatsapp size={18} /> {t('To WhatsApp')}
          </button>
        </div>
      }
    >
      <div className="wg-seg">
        <button className={tab === 'morning' ? 'on' : ''} onClick={() => setTab('morning')}>
          {t('Morning')}
        </button>
        <button className={tab === 'evening' ? 'on' : ''} onClick={() => setTab('evening')}>
          {t('Evening')}
        </button>
      </div>

      {tab === 'morning' ? (
        <>
          <div className="wg-bc__summary wg-card-line">
            <IconSpark size={18} />
            <p>{s.intro}</p>
          </div>
          <Group kind="act" title="Act now" lines={s.actNow} />
          <Group kind="prepare" title="Prepare" lines={s.prepare} />
          <Group kind="aware" title="Be aware" lines={s.beAware} />
          <Group kind="handled" title="Handled by Wingman" note={`${s.handled.length} done`} lines={s.handled} />
        </>
      ) : (
        <>
          <div className="wg-bc__summary wg-card-line">
            <IconSpark size={18} />
            <p>{s.evening.intro}</p>
          </div>
          <div className="wg-msteps" style={{ marginTop: 'var(--space-12)' }}>
            {s.evening.lines.map((l) => (
              <Row key={l.title} line={l} />
            ))}
          </div>
        </>
      )}

      <p className="wg-footnote">
        {t('Built from')} {s.sources.map((x) => t(x)).join(' · ')} · {t('updated {time}', { time: s.updated })}
      </p>
    </SubScreen>
  )
}
