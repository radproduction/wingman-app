import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { faceOf, openApproval } from './ApprovalCard'
import { Icon, IconSpark } from './icons'
import { approvals as approvalSeed, useDecisions, type Approval } from '../data/approvals'
import { localize, t, tx } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import './app.css'

const LogRow = ({ a, state }: { a: Approval; state: ReturnType<typeof useDecisions>[string] }) => {
  const face = faceOf(a, state?.state ?? 'pending', state?.note, state?.at)
  return (
    <button
      className="wg-alog wg-card-line"
      onClick={() => {
        tapQuiet()
        openApproval(a.id)
      }}
    >
      <span className={`wg-chip ${a.tone} sm`}>
        <Icon name={a.icon} size={19} variant="duotone" />
      </span>
      <span className="wg-alog__tx">
        <span className="wg-alog__title">{a.title}</span>
        <span className={`wg-alog__state ${face.tone}`}>
          <Icon name={face.icon} size={13} />
          {face.label}
        </span>
        {state?.state === 'executed' && a.worth && <span className="wg-alog__worth">{a.worth}</span>}
      </span>
    </button>
  )
}

export const Approvals = () => {
  const decisions = useDecisions()
  const approvals = localize(approvalSeed)
  const waiting = approvals.filter((a) => !decisions[a.id] || decisions[a.id].state === 'pending')
  const decided = approvals.filter((a) => decisions[a.id] && decisions[a.id].state !== 'pending')
  const [tab, setTab] = useState<'waiting' | 'decided'>('waiting')
  const list = tab === 'waiting' ? waiting : decided

  return (
    <SubScreen title="Approvals" back="more" className="wg-approvals">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {waiting.length > 0
            ? tx('{waiting} waiting on you. I made {calls} calls on my own this month and brought you these.', {
                waiting: <b>{waiting.length}</b>,
                calls: <b>214</b>,
              })
            : tx('Nothing waiting on you. I made {calls} calls on my own this month and brought you these.', {
                calls: <b>214</b>,
              })}
        </span>
      </div>

      <div className="wg-filters">
        <button className={tab === 'waiting' ? 'on' : ''} onClick={() => setTab('waiting')}>
          {t('Waiting')} {waiting.length > 0 && <b>{waiting.length}</b>}
        </button>
        <button className={tab === 'decided' ? 'on' : ''} onClick={() => setTab('decided')}>
          {t('Decided')} {decided.length > 0 && <b>{decided.length}</b>}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="wg-empty wg-card-line">
          <span className="wg-chip mint md">
            <Icon name={tab === 'waiting' ? 'checkCircle' : 'spark'} size={22} variant="duotone" />
          </span>
          <strong>{tab === 'waiting' ? t('Nothing waiting') : t('Nothing decided yet')}</strong>
          <p>
            {tab === 'waiting'
              ? t("You're through every decision I've raised. I'll bring you the next one when it matters.")
              : t('Once you approve or dismiss something, it stays here with what came of it.')}
          </p>
        </div>
      ) : (
        <div className="wg-row-list">
          {list.map((a) => (
            <LogRow key={a.id} a={a} state={decisions[a.id]} />
          ))}
        </div>
      )}

      <p className="wg-footnote">
        {t('Nothing that spends money, replies to a person or moves your calendar happens without a card here.')}
      </p>
    </SubScreen>
  )
}
