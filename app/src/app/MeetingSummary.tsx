import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconCheck, IconChevronR, IconPlus, type IconName } from './icons'
import { ActionSheet } from './ActionSheet'
import { ActionRow } from './Widgets'
import { actionItemsOfMeeting, addActionItem, useActionItems } from '../data/actionItems'
import {
  meetingById,
  useLive,
  useMeetingState,
  decisionOfAction,
  decideAction,
  approveAllActions,
  resetAction,
  actionDone,
  sendMeetingSummary,
  type Meeting,
  type ProposedAction,
} from '../data/meetings'
import { t } from '../i18n'
import { goBack, navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import './app.css'
import './business.css'
import './dashboard.css'

const DONE_STATUSES = ['summary-ready', 'completed', 'follow-up']

// Build a WhatsApp-ready text of the meeting's summary + action items.
const summaryToText = (m: Meeting): string => {
  const s = m.summary
  if (!s) return t('Here is my meeting summary.')
  const lines: string[] = [`*${m.title || t('Meeting')}*`]
  if (s.overview) lines.push('', s.overview)
  if (s.decisions.length) {
    lines.push('', `*${t('Decisions')}*`)
    s.decisions.forEach((d) => lines.push(`• ${d}`))
  }
  if (s.actions.length) {
    lines.push('', `*${t('Action items')}*`)
    s.actions.forEach((a) => {
      const meta = [a.owner, a.due].filter(Boolean).join(', ')
      lines.push(`• ${a.task}${meta ? ` (${meta})` : ''}`)
    })
  }
  return lines.join('\n')
}

const ACTION_LINK: Record<ProposedAction['kind'], { label: string; route: string } | undefined> = {
  tasks: { label: 'View tasks', route: 'tasks' },
  meeting: { label: 'View calendar', route: 'calendar' },
  email: { label: 'View draft', route: 'email' },
  whatsapp: undefined,
}

const ProposedCard = ({
  meetingId,
  action,
  onCreateTasks,
}: {
  meetingId: string
  action: ProposedAction
  onCreateTasks?: () => void
}) => {
  useMeetingState()
  const decision = decisionOfAction(meetingId, action.id)

  const approve = () => {
    // Email actually sends (to attendees with an address + the user) via the
    // backend, so only mark it done on a real success.
    if (action.kind === 'email') {
      void sendMeetingSummary(meetingId).then((res) => {
        if (res && res.sent.length) {
          decideAction(meetingId, action.id, 'approved')
          toast(t('Notes emailed.'), 'checkCircle')
        } else if (res && res.reason === 'gmail_not_connected') {
          toast(t('Connect Gmail first to email your notes.'), 'mail')
        } else if (res && res.reason === 'no_recipients') {
          toast(t('No email addresses to send to yet.'), 'mail')
        } else {
          toast(t('Could not email the notes right now.'), 'alert')
        }
      })
      return
    }
    decideAction(meetingId, action.id, 'approved')
    if (action.kind === 'whatsapp') {
      const m = meetingById(meetingId)
      openWhatsApp(m ? summaryToText(m) : t('Here is my meeting summary.'))
    }
    if (action.kind === 'tasks') onCreateTasks?.()
  }

  if (decision === 'approved') {
    const link = ACTION_LINK[action.kind]
    return (
      <div className="wg-pa wg-card-line settled">
        <div className="wg-pa__done">
          <IconCheck size={16} />
          {t(actionDone[action.kind])}
          <button className="wg-link wg-link--end" onClick={() => resetAction(meetingId, action.id)}>
            {t('Undo')}
          </button>
        </div>
        {link && (
          <button className="wg-link" onClick={() => navigate(link.route)}>
            {t(link.label)}
            <IconChevronR size={15} />
          </button>
        )}
      </div>
    )
  }

  if (decision === 'rejected' || decision === 'saved') {
    return (
      <div className="wg-pa wg-card-line settled">
        <div className="wg-pa__done rejected">
          <span>{decision === 'saved' ? t('Saved for later') : t('Rejected')}</span>
          <button className="wg-link wg-link--end" onClick={() => resetAction(meetingId, action.id)}>
            {t('Undo')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="wg-pa wg-card-line">
      <div className="wg-pa__top">
        <span className={`wg-chip ${action.tone} sm`}>
          <Icon name={action.icon} size={18} variant="duotone" />
        </span>
        <strong>{t(action.label)}</strong>
        {action.external && <span className="wg-pa__ext">{t('External')}</span>}
      </div>
      <p className="wg-pa__detail">{t(action.detail)}</p>
      <div className="wg-pa__acts">
        <button className="wg-btn full danger" onClick={() => decideAction(meetingId, action.id, 'rejected')}>
          {t('Reject')}
        </button>
        <button className="wg-btn full" onClick={approve}>
          {action.external ? t('Approve') : t('Do it')}
        </button>
      </div>
    </div>
  )
}

const Related = ({ icon, tone, name, route }: { icon: IconName; tone: string; name: string; route: string }) => (
  <button className="wg-set" onClick={() => navigate(route)}>
    <span className={`wg-chip ${tone} xs`}>
      <Icon name={icon} size={17} variant="duotone" />
    </span>
    <span className="wg-set__name">{t(name)}</span>
    <IconChevronR size={18} className="chev" />
  </button>
)

const FullSummary = ({ m }: { m: Meeting }) => {
  const s = m.summary!
  const all = useActionItems()
  const live = actionItemsOfMeeting(m.id, all)
  const [edit, setEdit] = useState<string | null>(null)
  const recorded = s.recorded !== false

  const createTasks = () => {
    let made = 0
    for (const a of s.actions) {
      if (live.some((x) => x.title.toLowerCase() === a.task.toLowerCase())) continue
      addActionItem({
        title: a.task,
        owner: a.owner === 'Wingman' ? 'Wingman' : a.owner,
        dueIn: a.due === 'Today' ? 0 : a.due === 'Tomorrow' ? 1 : 3,
        priority: a.priority,
        meetingId: m.id,
        meeting: m.title,
        project: a.project,
      })
      made += 1
    }
    toast(made > 0 ? t('{n} action items created.', { n: made }) : t('Those are already on your list.'), 'checkCircle')
  }
  const pendingIds = s.proposedActions
    .filter((a) => decisionOfAction(m.id, a.id) === 'pending')
    .map((a) => a.id)

  return (
    <SubScreen title="Meeting summary" back={`meetings/${m.id}`} className="wg-mod" feedback="header">
      {}
      <div className="wg-brief-obj">
        <span className="cap">
          <IconSpark size={13} /> {t(m.title)}
        </span>
        <p>{t(s.overview)}</p>
      </div>

      {}
      {pendingIds.length > 0 && (
        <div className="wg-pa-lead">
          <span className="wg-chip blue xs">
            <IconSpark size={17} />
          </span>
          <div className="wg-pa-lead__tx">
            <strong>{t('I found {n} next steps', { n: s.proposedActions.length })}</strong>
            <span>{t('Review each, or approve them all')}</span>
          </div>
          <button className="wg-btn sm" onClick={() => approveAllActions(m.id, pendingIds)}>
            {t('Approve all')}
          </button>
        </div>
      )}
      <div className="wg-msteps">
        {s.proposedActions.map((a) => (
          <ProposedCard key={a.id} meetingId={m.id} action={a} onCreateTasks={createTasks} />
        ))}
      </div>

      {}
      {s.discussion.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Discussion')}</h2>
          </div>
          <ul className="wg-mcontext wg-card-line">
            {s.discussion.map((d) => (
              <li key={d}>
                <Icon name="chat" size={16} variant="duotone" />
                {t(d)}
              </li>
            ))}
          </ul>
        </>
      )}

      {s.decisions.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Decisions made')}</h2>
          </div>
          <ul className="wg-mcontext wg-card-line">
            {s.decisions.map((d) => (
              <li key={d}>
                <IconCheck size={16} />
                {t(d)}
              </li>
            ))}
          </ul>
        </>
      )}

      {}
      <div className="wg-panel-head">
        <h2>{t('Action items')}</h2>
        <span>{live.length}</span>
      </div>
      {live.length === 0 ? (
        <div className="wg-bc__summary wg-card-line">
          <IconSpark size={18} />
          <p>{t('No action items on this meeting yet. Add one and I will track it with the rest.')}</p>
        </div>
      ) : (
        <div className="wg-set-list wg-card-line wg-att__list">
          {live.map((a) => (
            <ActionRow a={a} key={a.id} onOpen={() => setEdit(a.id)} />
          ))}
        </div>
      )}
      <button className="wg-btn full soft" onClick={() => setEdit('new')}>
        <IconPlus size={16} /> {t('Add an action item')}
      </button>

      {}
      {s.openQuestions.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Open questions')}</h2>
          </div>
          <ul className="wg-mcontext wg-card-line">
            {s.openQuestions.map((q) => (
              <li key={q}>
                <Icon name="alert" size={16} variant="duotone" />
                {t(q)}
              </li>
            ))}
          </ul>
        </>
      )}

      {}
      {s.followUps.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Follow-ups')}</h2>
          </div>
          <ul className="wg-mcontext wg-card-line">
            {s.followUps.map((f) => (
              <li key={f}>
                <Icon name="clock" size={16} variant="duotone" />
                {t(f)}
              </li>
            ))}
          </ul>
        </>
      )}

      {}
      {s.nextMeeting && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Suggested next meeting')}</h2>
          </div>
          <div className="wg-mfacts wg-card-line">
            <div>
              <div className="wg-mfact__k">{t('When')}</div>
              <div className="wg-mfact__v">
                {t(s.nextMeeting.date)}, {t(s.nextMeeting.time)}
              </div>
            </div>
            <div>
              <div className="wg-mfact__k">{t('With')}</div>
              <div className="wg-mfact__v">{t(s.nextMeeting.participants)}</div>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <div className="wg-mfact__k">{t('Objective')}</div>
              <div className="wg-mfact__v">{t(s.nextMeeting.objective)}</div>
            </div>
          </div>
        </>
      )}

      {s.transcript.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t(recorded ? 'Transcript' : 'What you wrote down')}</h2>
          </div>
          <ul className="wg-transcript wg-card-line">
            {s.transcript.map((line, i) => (
              <li key={i}>
                <span className="at">{line.at}</span>
                <span>
                  <span className="sp">{t(line.speaker)}: </span>
                  {t(line.text)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {}
      <div className="wg-panel-head">
        <h2>{t('Recording')}</h2>
      </div>
      {recorded ? (
        <div className="wg-bc__summary wg-card-line">
          <Icon name="volume" size={18} variant="duotone" />
          <p>{t('I turned the audio into the transcript above, then discarded the recording — nothing is stored to play or delete.')}</p>
        </div>
      ) : (
        <div className="wg-bc__summary wg-card-line">
          <Icon name="shield" size={18} variant="duotone" />
          <p>{t('Notes only. No audio was captured, so there is nothing to play, keep or delete.')}</p>
        </div>
      )}

      {}
      <div className="wg-panel-head">
        <h2>{t('Related')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <Related icon="task" tone="mint" name="Created tasks" route="tasks" />
        <Related icon="calendar" tone="lavender" name="Calendar event" route="calendar" />
        <Related icon="users" tone="blue" name="People CRM" route="people" />
        <Related icon="mail" tone="sand" name="Related emails" route="email" />
      </div>

      <ActionSheet
        open={edit !== null}
        onClose={() => setEdit(null)}
        edit={edit && edit !== 'new' ? live.find((a) => a.id === edit) : undefined}
        meetingId={m.id}
        meeting={m.title}
        project={m.project}
      />
    </SubScreen>
  )
}

export const MeetingSummary = ({ id }: { id: string }) => {
  const m = meetingById(id)
  const live = useLive(id)
  useMeetingState()
  if (!m) {
    goBack('meetings')
    return null
  }

  const processing = live.phase === 'processing' || m.status === 'processing'
  const ready = !processing && !!m.summary && (DONE_STATUSES.includes(m.status) || live.phase === 'ready')
  if (ready) return <FullSummary m={m} />

  return (
    <SubScreen title="Meeting summary" back={`meetings/${id}`} className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>
          {processing
            ? t("I'm processing your notes now. I'll have your summary, decisions and action items ready in a few minutes.")
            : t("There's no summary yet. It appears here once the meeting has been recorded or taken through assistance.")}
        </p>
      </div>
      {}
      {processing && (
        <ul className="wg-mcontext wg-card-line">
          <li>
            <IconCheck size={16} />
            {t('Recording saved')}
          </li>
          <li>
            <span className="wg-live__dot" />
            {t('Transcribing the recording')}
          </li>
          <li>
            <Icon name="spark" size={16} variant="duotone" />
            {t('Detecting decisions and action items')}
          </li>
        </ul>
      )}
      {processing && (
        <p className="wg-footnote">{t('This takes a moment. You can leave this screen - I will finish either way.')}</p>
      )}
    </SubScreen>
  )
}
