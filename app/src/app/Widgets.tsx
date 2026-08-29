import { useEffect, useState, type ReactNode } from 'react'
import { Icon, IconCheck, IconChevronR, IconPlus, IconSpark, IconWhatsapp, type IconName } from './icons'
import { CommuteWidget } from './RouteDetail'
import { NewsWidget } from './News'
import { home as homeSeed } from '../data/mock'
import { wingmanDay } from '../data/intelligence'
import { routeByKey, usePlaces } from '../data/mobility'
import { useConnections } from '../data/connections'
import { useWaiting } from '../data/approvals'
import { useTasks, toggleTask } from '../data/tasks'
import { useHomeStats } from '../data/homeStats'
import {
  useActionItems,
  toggleActionItem,
  openActionItems,
  type ActionItem,
} from '../data/actionItems'
import { useAttention, attentionSummary, REASONS, type AttentionItem } from '../data/attention'
import { useBills } from '../data/bills'
import { useVitals, fmtSleep } from '../data/vitals'
import { useFollowups } from '../data/followups'
import { allMeetings, MEETING_STATUS, useMeetingState, type Meeting } from '../data/meetings'
import type { WidgetSize, WidgetType } from '../data/dashboard'
import { localize, t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import { tapQuiet } from '../shell/feedback'
import './dashboard.css'


export const BARE: WidgetType[] = ['snapshot', 'counts', 'focus', 'wday', 'news', 'commute', 'watching']


const Head = ({
  icon,
  tone,
  title,
  end,
  onEnd,
}: {
  icon: IconName
  tone: string
  title: string
  end?: ReactNode
  onEnd?: () => void
}) => (
  <div className="wg-wgt__head">
    <span className={`wg-chip ${tone} xs`}>
      <Icon name={icon} size={17} variant="duotone" />
    </span>
    <span className="wg-wgt__title">{t(title)}</span>
    {end &&
      (onEnd ? (
        <button className="wg-wgt__end" onClick={onEnd}>
          {end}
          <IconChevronR size={14} />
        </button>
      ) : (
        <span className="wg-wgt__end">{end}</span>
      ))}
  </div>
)

const Glance = ({
  icon,
  tone,
  title,
  value,
  sub,
  onOpen,
  label,
}: {
  icon: IconName
  tone: string
  title: string
  value: string
  sub: string
  onOpen: () => void
  label?: string
}) => (
  <button className="wg-wgt__open" data-feedback="header" onClick={onOpen} aria-label={label ?? `${t(title)}: ${value}. ${sub}`}>
    <Head icon={icon} tone={tone} title={title} />
    <span className="wg-wgt__val">{value}</span>
    <span className="wg-wgt__sub">{sub}</span>
  </button>
)

const Empty = ({ line, cta, onCta }: { line: string; cta?: string; onCta?: () => void }) => (
  <div className="wg-wempty">
    <p>{t(line)}</p>
    {cta && onCta && (
      <button className="wg-btn sm soft" onClick={onCta}>
        {t(cta)}
      </button>
    )}
  </div>
)

const Tick = ({ on, label, onTap }: { on: boolean; label: string; onTap: () => void }) => (
  <button className={`wg-wtick ${on ? 'on' : ''}`} aria-pressed={on} aria-label={label} onClick={onTap}>
    <IconCheck size={13} />
  </button>
)

const rows = (size: WidgetSize) => (size === 'lg' ? 3 : 1)

const useFillRamp = () => {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let second = 0
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => setReady(true))
    })
    return () => {
      cancelAnimationFrame(first)
      cancelAnimationFrame(second)
    }
  }, [])
  return ready
}


const HANDLED_TICKS = 16

const SnapshotWidget = () => {
  const DAY = localize(homeSeed)
  const ready = useFillRamp()
  const pct = Math.round((DAY.handled / DAY.total) * 100)
  const needYou = DAY.total - DAY.handled
  const lit = Math.round((DAY.handled / DAY.total) * HANDLED_TICKS)
  const litPct = (lit / HANDLED_TICKS) * 100

  return (
    <button
      className="wg-daycard"
      data-feedback="header"
      onClick={() => navigate('daily-summary')}
      aria-label={`${t("Today's Snapshot")}. ${t('{n} need you', { n: needYou })}. ${t('Handled')} ${pct}%, ${t(
        '{done} of {total}',
        { done: DAY.handled, total: DAY.total },
      )}`}
    >
      <span className="wg-daycard__top">
        {}
        <span className="wg-chip sm">
          <Icon name="sun" size={20} variant="duotone" />
        </span>
        <IconChevronR size={18} className="chev" />
      </span>
      <span className="wg-daycard__tx">
        <strong>{t("Today's Snapshot")}</strong>
        <b>{t('{n} need you', { n: needYou })}</b>
      </span>
      {}
      <span className="wg-daycard__foot">
        <span className="wg-daycard__legend">
          <small>{t('Handled')}</small>
          <em>{t('{done} of {total}', { done: DAY.handled, total: DAY.total })}</em>
        </span>
        {}
        <span className="wg-daycard__bar">
          {Array.from({ length: HANDLED_TICKS }, (_, i) => (
            <span key={i} />
          ))}
          <i style={{ ['--fill' as string]: ready ? `${litPct}%` : '0%' }}>
            {Array.from({ length: HANDLED_TICKS }, (_, i) => (
              <span key={i} />
            ))}
          </i>
        </span>
      </span>
    </button>
  )
}


const AttentionRow = ({ a }: { a: AttentionItem }) => (
  <div className="wg-wrow">
    <span className={`wg-chip ${a.tone} xs`}>
      <Icon name={a.icon} size={16} variant="duotone" />
    </span>
    <span className="wg-wrow__tx">
      <span className="wg-wrow__name">{t(a.title)}</span>
      <span className="wg-wrow__meta">{t(a.sub)}</span>
    </span>
    <span className="wg-wrow__end">
      <span className={`wg-flag ${a.tone}`}>{t(REASONS[a.reason].label)}</span>
    </span>
  </div>
)

const AttentionWidget = ({ size }: { size: WidgetSize }) => {
  const list = useAttention()
  const summary = attentionSummary(list).map((s) => `${s.n} ${t(REASONS[s.reason].short)}`)

  if (size === 'sm')
    return (
      <Glance
        icon="alert"
        tone="rose"
        title="Needs attention"
        value={list.length === 0 ? t('All clear') : String(list.length)}
        sub={list.length === 0 ? t('Nothing late, blocked or unowned') : t(list[0].title)}
        onOpen={() => navigate('attention')}
      />
    )

  return (
    <>
      <Head
        icon="alert"
        tone="rose"
        title="Needs attention"
        end={list.length > 0 ? t('View all') : undefined}
        onEnd={list.length > 0 ? () => navigate('attention') : undefined}
      />
      {list.length === 0 ? (
        <Empty
          line="Nothing needs you right now. I am watching for anything overdue, blocked, unassigned or waiting on your decision."
          cta="See today's snapshot"
          onCta={() => navigate('daily-summary')}
        />
      ) : (
        <>
          <span className="wg-wgt__val">{t('{n} need you', { n: list.length })}</span>
          {}
          <span className="wg-wgt__sub">{summary.join(' · ')}</span>
          <div className="wg-wlist">
            {list.slice(0, rows(size)).map((a) => (
              <AttentionRow a={a} key={a.id} />
            ))}
          </div>
          <div className="wg-wgt__fill" />
        </>
      )}
    </>
  )
}


const meetingRank = (m: Meeting) =>
  m.status === 'in-progress' ? 0 : m.status === 'processing' ? 1 : m.status === 'summary-ready' || m.status === 'completed' ? 2 : 3

const recentMeetings = (n: number) =>
  allMeetings()
    .filter((m) => m.status !== 'cancelled')
    .sort((a, b) => meetingRank(a) - meetingRank(b) || b.at.localeCompare(a.at))
    .slice(0, n)

const meetingAction = (m: Meeting): { label: string; step: string } | null => {
  if (m.status === 'in-progress') return { label: 'Open', step: 'live' }
  if (m.status === 'processing') return null
  if (m.status === 'summary-ready' || m.status === 'completed' || m.status === 'follow-up')
    return { label: 'Open', step: 'summary' }
  return { label: 'Start', step: 'consent' }
}

const MeetingsWidget = ({ size }: { size: WidgetSize }) => {
  useMeetingState()
  const list = recentMeetings(rows(size))
  const total = allMeetings().filter((m) => m.today && m.status !== 'cancelled').length

  if (size === 'sm')
    return (
      <Glance
        icon="users"
        tone="lavender"
        title="Meetings"
        value={total === 0 ? t('None') : String(total)}
        sub={list[0] ? `${t('Latest')}: ${t(list[0].title)}` : t('Nothing on today')}
        onOpen={() => navigate('meetings')}
      />
    )

  return (
    <>
      <Head
        icon="users"
        tone="lavender"
        title="Recent meetings"
        end={total > 0 ? t('{n} today', { n: total }) : t('View all')}
        onEnd={() => navigate('meetings')}
      />
      {list.length === 0 ? (
        <Empty line="No meetings yet. Start one now and I will take the notes." cta="Start a meeting" onCta={() => navigate('meetings/instant')} />
      ) : (
        <>
          <div className="wg-wlist">
            {list.map((m) => {
              const st = MEETING_STATUS[m.status]
              const act = meetingAction(m)
              return (
                <div className="wg-wrow" key={m.id}>
                  <span className={`wg-chip ${m.tone} xs`}>
                    <Icon name={m.icon} size={16} variant="duotone" />
                  </span>
                  <button className="wg-wrow__tx" data-feedback="header" onClick={() => navigate(`meetings/${m.id}`)}>
                    <span className="wg-wrow__name">{t(m.title)}</span>
                    <span className="wg-wrow__meta">
                      {m.day === 'Today' ? m.when.split(' - ')[0] : t(m.day)} · {t(st.label)}
                    </span>
                  </button>
                  <span className="wg-wrow__end">
                    {act ? (
                      <button className="wg-btn sm soft" onClick={() => navigate(`meetings/${m.id}/${act.step}`)}>
                        {t(act.label)}
                      </button>
                    ) : (
                      <span className="wg-flag sand">{t('Processing')}</span>
                    )}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="wg-wgt__fill" />
          {size === 'lg' && (
            <div className="wg-wgt__foot">
              <button className="wg-btn sm soft" onClick={() => navigate('meetings/instant')}>
                <IconPlus size={14} /> {t('Start a meeting now')}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}


const TasksWidget = ({ size }: { size: WidgetSize }) => {
  const { groups, openCount } = useTasks()
  const list = groups.flatMap((g) => g.items).slice(0, rows(size))

  if (size === 'sm')
    return (
      <Glance
        icon="task"
        tone="mint"
        title="Tasks"
        value={openCount === 0 ? t('All done') : String(openCount)}
        sub={list[0] ? `${t('Next')}: ${t(list[0].title)}` : t('Nothing on your plate')}
        onOpen={() => navigate('tasks')}
      />
    )

  return (
    <>
      <Head
        icon="task"
        tone="mint"
        title="Recent tasks"
        end={openCount > 0 ? t('{n} open', { n: openCount }) : t('View all')}
        onEnd={() => navigate('tasks')}
      />
      {list.length === 0 ? (
        <Empty line="Nothing left on your plate. I will add anything new I find in your mail and meetings." cta="Open tasks" onCta={() => navigate('tasks')} />
      ) : (
        <>
          <div className="wg-wlist">
            {list.map((task) => (
              <div className="wg-wrow" key={task.title}>
                <Tick
                  on={false}
                  label={t('Complete: {title}', { title: t(task.title) })}
                  onTap={() => {
                    tapQuiet()
                    toggleTask(task.title)
                    toast(t('Done. Off your plate.'), 'checkCircle', 4000, {
                      label: t('Undo'),
                      onAct: () => toggleTask(task.title),
                    })
                  }}
                />
                <button className="wg-wrow__tx" data-feedback="header" onClick={() => navigate('tasks')}>
                  <span className="wg-wrow__name">{t(task.title)}</span>
                  <span className="wg-wrow__meta">
                    {t(task.due)}
                    {task.source ? ` · ${t(task.source)}` : ''}
                  </span>
                </button>
              </div>
            ))}
          </div>
          <div className="wg-wgt__fill" />
        </>
      )}
    </>
  )
}


export const ActionRow = ({ a, onOpen }: { a: ActionItem; onOpen?: () => void }) => (
  <div className="wg-wrow">
    <Tick
      on={a.status === 'done'}
      label={
        a.status === 'done' ? t('Completed: {title}', { title: t(a.title) }) : t('Complete: {title}', { title: t(a.title) })
      }
      onTap={() => {
        tapQuiet()
        toggleActionItem(a.id)
        if (a.status !== 'done')
          toast(t('Task completed.'), 'checkCircle', 4000, {
            label: t('Undo'),
            onAct: () => toggleActionItem(a.id),
          })
      }}
    />
    <button className="wg-wrow__tx" data-feedback="header" onClick={onOpen}>
      <span className={`wg-wrow__name ${a.status === 'done' ? 'done' : ''}`}>{t(a.title)}</span>
      <span className="wg-wrow__meta">
        {a.owner ? t(a.owner) : t('Unassigned')} · {t(a.due)}
        {a.meeting ? ` · ${t(a.meeting)}` : ''}
      </span>
    </button>
    <span className="wg-wrow__end">
      {a.status === 'blocked' ? (
        <span className="wg-flag sand">{t('Blocked')}</span>
      ) : (
        <span className={`wg-pri ${a.priority}`}>{t(a.priority)}</span>
      )}
    </span>
  </div>
)

const ActionsWidget = ({ size, onAdd }: { size: WidgetSize; onAdd: () => void }) => {
  const all = useActionItems()
  const open = openActionItems(all)
  const list = open.slice(0, rows(size))

  if (size === 'sm')
    return (
      <Glance
        icon="checkCircle"
        tone="blue"
        title="Tasks"
        value={open.length === 0 ? t('None open') : String(open.length)}
        sub={list[0] ? t(list[0].title) : t('Nothing outstanding')}
        onOpen={() => navigate('tasks')}
      />
    )

  return (
    <>
      <Head
        icon="checkCircle"
        tone="blue"
        title="Tasks"
        end={open.length > 0 ? t('{n} open', { n: open.length }) : t('View all')}
        onEnd={() => navigate('tasks')}
      />
      {list.length === 0 ? (
        <Empty
          line="No tasks open. I create them from your meetings, and you can add one yourself any time."
          cta="Add a task"
          onCta={onAdd}
        />
      ) : (
        <>
          <div className="wg-wlist">
            {list.map((a) => (
              <ActionRow a={a} key={a.id} onOpen={() => navigate('tasks')} />
            ))}
          </div>
          <div className="wg-wgt__fill" />
          {size === 'lg' && (
            <div className="wg-wgt__foot">
              <button className="wg-btn sm soft" onClick={onAdd}>
                <IconPlus size={14} /> {t('Add a task')}
              </button>
            </div>
          )}
        </>
      )}
    </>
  )
}


const COUNT_ROUTE: Record<string, string> = { email: 'email', cal: 'calendar', tasks: 'tasks' }
const COUNT_CONNECTOR: Record<string, string> = { email: 'gmail', cal: 'gcal' }

const CountsWidget = ({ size }: { size: WidgetSize }) => {
  const DAY = localize(homeSeed)
  const { openCount, progress } = useTasks()
  const stats = useHomeStats()
  const conn = useConnections()
  const ready = useFillRamp()

  return (
    <div className={`wg-metrics ${size === 'sm' ? '' : 'row'}`} data-feedback="header">
        {DAY.metrics.map((m, i) => {
          const key = COUNT_CONNECTOR[m.key]
          const on = !key || conn.items.find((c) => c.key === key)?.status === 'connected'
          // Tasks is live from useTasks; Email/Calendar from the real dashboard
          // aggregate once loaded; otherwise the seed value.
          const value =
            m.key === 'tasks' ? String(openCount)
            : m.key === 'email' && stats ? String(stats.emailToReply)
            : m.key === 'cal' && stats ? String(stats.calToday)
            : m.value
          const fill =
            m.key === 'tasks' ? progress
            : m.key === 'email' && stats ? Math.min(1, stats.emailToReply / 12)
            : m.key === 'cal' && stats ? Math.min(1, stats.calToday / 10)
            : m.fill
          return (
            <button
              className={`wg-metric ${m.tone}${on ? '' : ' off'}`}
              key={m.key}
              onClick={() => navigate(on ? (COUNT_ROUTE[m.key] ?? 'home') : 'more')}
              aria-label={
                on
                  ? t('{label}: {value} {unit}', { label: m.label, value, unit: m.unit })
                  : t('{label}: not connected, tap to connect', { label: m.label })
              }
              style={{
                ['--fill' as string]: ready && on ? `${fill * 100}%` : '0%',
                ['--fill-delay' as string]: `${i * 90}ms`,
              }}
            >
              <span className="wg-metric__fill" />
              <span className="wg-metric__icon">
                <Icon name={m.icon} size={22} variant="duotone" />
              </span>
              <span className="wg-metric__tx">
                <small>{m.label}</small>
                {on ? (
                  <b>
                    {value}
                    <span>{m.unit}</span>
                  </b>
                ) : (
                  <b className="off">{t('Connect')}</b>
                )}
              </span>
            </button>
          )
        })}
    </div>
  )
}


const BusinessWidget = ({ size }: { size: WidgetSize }) => {
  const waiting = useWaiting().filter((a) => a.source === 'commerce').length

  if (size === 'sm')
    return (
      <Glance
        icon="briefcase"
        tone="peach"
        title="Business"
        value={waiting > 0 ? t('{n} waiting', { n: waiting }) : t('All clear')}
        sub={t('Your store, traffic up 18%')}
        onOpen={() => navigate('business')}
      />
    )

  return (
    <>
      <Head icon="briefcase" tone="peach" title="Business" end={t('Open')} onEnd={() => navigate('business')} />
      <span className="wg-wgt__val">{waiting > 0 ? t('{n} waiting', { n: waiting }) : t('All clear')}</span>
      <span className="wg-wgt__sub">{t('Traffic up 18% · 3 meetings today')}</span>
      <div className="wg-wgt__fill" />
      <div className="wg-wgt__foot">
        <button className="wg-btn sm soft" onClick={() => navigate('meetings/instant')}>
          <Icon name="volume" size={14} variant="duotone" /> {t('Start a meeting now')}
        </button>
      </div>
    </>
  )
}


const FocusWidget = ({ size }: { size: WidgetSize }) => {
  const DAY = localize(homeSeed)
  return (
    <div className="wg-insight wg-card-line">
      <div className="wg-insight__top">
        <span className="wg-tag">
          <IconSpark size={14} /> {DAY.focus.tag}
        </span>
      </div>
      <h2>{DAY.focus.title}</h2>
      <p>{DAY.focus.body}</p>
      {size === 'lg' && (
        <div className="wg-insight__item">
          <span className={`wg-chip ${DAY.focus.item.tone} sm`}>
            <Icon name={DAY.focus.item.icon} size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>{DAY.focus.item.title}</strong>
            <small>{DAY.focus.item.sub}</small>
          </span>
        </div>
      )}
      {}
      <button
        className="wg-insight__cta wg-btn full wa"
        data-feedback="quiet"
        onClick={() => openWhatsApp(t('Tell me more about: {title}', { title: DAY.focus.title }))}
      >
        <IconWhatsapp size={18} /> {DAY.focus.cta}
      </button>
    </div>
  )
}

const WdayWidget = ({ size }: { size: WidgetSize }) => {
  const waiting = useWaiting()
  return (
    <div className="wg-wday wg-card-line">
      <span className="wg-tag">
        <IconSpark size={14} /> {t("Wingman's Day")}
      </span>
      <p className="wg-wday__sum">{t(wingmanDay.summary)}</p>
      <div className="wg-wday__counts">
        <div className="wg-wday__count">
          <b>{wingmanDay.counts.actions}</b>
          <small>{t('Actions')}</small>
        </div>
        <div className="wg-wday__count">
          <b>{wingmanDay.counts.decisions}</b>
          <small>{t('Decisions')}</small>
        </div>
        <div className="wg-wday__count">
          <b>{wingmanDay.counts.recommendations}</b>
          <small>{t('Suggested')}</small>
        </div>
        <div className="wg-wday__count">
          <b>{waiting.length}</b>
          <small>{t('Waiting')}</small>
        </div>
      </div>
      {size === 'lg' && (
        <div className="wg-wday__acts">
          {wingmanDay.activities.map((a) => (
            <div className="wg-wact" key={a.title}>
              <span className={`wg-chip ${a.tone} sm`}>
                <Icon name={a.icon} size={18} variant="duotone" />
              </span>
              <span className="wg-wact__tx">
                <strong>{t(a.title)}</strong>
                <span>{t(a.body)}</span>
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="wg-wday__btns">
        <button className="wg-btn full" data-feedback="header" onClick={() => navigate('daily-intelligence')}>
          {t('View Daily Intelligence')}
        </button>
      </div>
    </div>
  )
}

const CommuteWidgetCell = () => {
  const places = usePlaces()
  const ready = ['home', 'office'].every((k) => places.some((p) => p.key === k))
  return ready ? (
    <CommuteWidget route={routeByKey('office')} onView={() => navigate('route/office')} />
  ) : (
    <button className="wg-commute wg-card-line" data-feedback="header" onClick={() => navigate('places')}>
      <div className="wg-commute__route">
        <Icon name="pin" size={16} variant="duotone" />
        <b>{t('Set up your commute')}</b>
      </div>
      <div className="wg-commute__meta">
        {t('Save Home and Office and I will watch your commute and tell you when to leave.')}
      </div>
    </button>
  )
}

// Travel and Deliveries are parked for now — shown as "Coming soon" and not
// tappable, per the current product scope.
const SOON_TILES = new Set(['travel', 'deliveries'])

type WatchTile = {
  key: string
  title: string
  tone: string
  icon: IconName
  value: string
  sub: string
  soon?: boolean
}

const WatchingWidget = ({ size }: { size: WidgetSize }) => {
  const DAY = localize(homeSeed)
  const waiting = useWaiting()
  const bills = useBills()
  const vitals = useVitals()
  const followups = useFollowups()
  const bizWaiting = waiting.filter((a) => a.source === 'commerce').length

  const dyn = (w: WatchTile): WatchTile => {
    if (SOON_TILES.has(w.key)) return { ...w, value: t('Coming soon'), sub: '', soon: true }

    if (w.key === 'bills') {
      if (!bills) return w
      const value =
        bills.needsYou > 0 ? t('{n} need you', { n: bills.needsYou })
        : bills.paid > 0 ? t('All paid')
        : t('Nothing due')
      const sub =
        bills.coming ? t('{name} · due {due}', { name: bills.coming.name, due: bills.coming.due })
        : bills.paid > 0 ? t('{n} paid recently', { n: bills.paid })
        : t('Nothing coming up')
      return { ...w, value, sub }
    }

    if (w.key === 'health') {
      if (!vitals) return w
      if (!vitals.connected) return { ...w, value: t('Get started'), sub: t('Connect to see sleep & recovery') }
      const r = (n: number) => Math.round(n)
      // The headline value, and which metric it used — so the sub never repeats it.
      let value: string
      let shown: 'recovery' | 'sleep' | 'rhr' | null
      if (vitals.recovery != null) { value = t('{n}% recovered', { n: r(vitals.recovery) }); shown = 'recovery' }
      else if (vitals.sleepHours != null) { value = t('Slept {v}', { v: fmtSleep(vitals.sleepHours) }); shown = 'sleep' }
      else if (vitals.restingHr != null) { value = t('Resting HR {n}', { n: r(vitals.restingHr) }); shown = 'rhr' }
      else { value = t('Connected'); shown = null }
      const parts: string[] = []
      if (vitals.sleepHours != null && shown !== 'sleep') parts.push(t('Slept {v}', { v: fmtSleep(vitals.sleepHours) }))
      if (vitals.hrv != null) parts.push(`HRV ${r(vitals.hrv)}ms`)
      if (vitals.restingHr != null && shown !== 'rhr') parts.push(t('Resting HR {n}', { n: r(vitals.restingHr) }))
      const sub = parts.join(' · ') || vitals.summary || t('Sleep, recovery, movement')
      return { ...w, value, sub }
    }

    if (w.key === 'people') {
      if (!followups) return w
      const value = followups.active > 0 ? t('{n} follow-ups', { n: followups.active }) : t('All caught up')
      const sub = followups.overdue > 0 ? t('{n} overdue', { n: followups.overdue }) : t('Nothing waiting on you')
      return { ...w, value, sub }
    }

    if (w.key === 'business') {
      return { ...w, value: bizWaiting > 0 ? t('{n} waiting', { n: bizWaiting }) : t('All clear') }
    }

    return w
  }

  // Order the home tiles: Business first, then the active modules, with the
  // "coming soon" tiles (Travel, Deliveries) pushed to the end. Stable sort keeps
  // each group's original order.
  const rank = (w: WatchTile) => (w.key === 'business' ? 0 : SOON_TILES.has(w.key) ? 2 : 1)
  const tiles = [...(DAY.watching as WatchTile[])]
    .sort((a, b) => rank(a) - rank(b))
    .map(dyn)
    .slice(0, size === 'lg' ? 6 : 4)

  return (
    <>
      <h3 className="wg-sect">{t('Watching for you')}</h3>
      <div className="wg-grid" data-feedback="header">
        {tiles.map((w) => (
          <button
            className={`wg-tile wg-card-line${w.soon ? ' soon' : ''}`}
            key={w.key}
            disabled={w.soon}
            onClick={() => {
              if (!w.soon) navigate(w.key)
            }}
          >
            <span className="wg-tile__head">
              <span className={`wg-chip ${w.tone} sm`}>
                <Icon name={w.icon} size={24} variant="duotone" />
              </span>
              <span className="ti">{w.title}</span>
              {w.soon && <span className="wg-tile__soon">{t('Soon')}</span>}
            </span>
            <span className="val">{w.value}</span>
            <span className="sub">{w.sub}</span>
          </button>
        ))}
      </div>
    </>
  )
}


export const WidgetBody = ({
  type,
  size,
  onAdd,
}: {
  type: WidgetType
  size: WidgetSize
  onAdd: () => void
}) => {
  switch (type) {
    case 'attention':
      return <AttentionWidget size={size} />
    case 'meetings':
      return <MeetingsWidget size={size} />
    case 'tasks':
      return <TasksWidget size={size} />
    case 'actions':
      return <ActionsWidget size={size} onAdd={onAdd} />
    case 'snapshot':
      return <SnapshotWidget />
    case 'counts':
      return <CountsWidget size={size} />
    case 'business':
      return <BusinessWidget size={size} />
    case 'focus':
      return <FocusWidget size={size} />
    case 'wday':
      return <WdayWidget size={size} />
    case 'news':
      return <NewsWidget />
    case 'commute':
      return <CommuteWidgetCell />
    case 'watching':
      return <WatchingWidget size={size} />
  }
}
