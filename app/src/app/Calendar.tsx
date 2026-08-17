import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { AppHeader } from './AppHeader'
import { Avatar } from './Avatar'
import { NotConnected } from './NotConnected'
import { Icon, IconChevronL, IconChevronR, IconSpark, IconWhatsapp } from './icons'
import { TODAY } from '../data/mock'
import { useConnections } from '../data/connections'
import { revealHold } from '../data/loading'
import { localize, t } from '../i18n'
import { Sheet } from '../shell/Sheet'
import { routeByKey, LEVEL_LABEL } from '../data/mobility'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { usePullToRefresh } from '../shell/usePullToRefresh'
import { PullSpacer } from '../shell/PullSpacer'
import {
  addDays,
  addMonths,
  agendaFor,
  briefFor,
  dayLabel,
  dayNumber,
  dotsFor,
  emptyLineFor,
  inSameMonth,
  isToday,
  monthGrid,
  monthLabel,
  peekFor,
  startOfWeek,
  summaryFor,
  useCalendarData,
  weekOf,
  weekdayInitial,
  initialOf,
  WEEKDAYS_SHORT,
  yearLabel,
  type AgendaEvent,
} from '../data/day'
import './app.css'
import './mobility.css'

const EventTravel = ({ place, onClose }: { place: string; onClose: () => void }) => {
  const r = routeByKey(place.toLowerCase())
  return (
    <div className="wg-origin" style={{ marginBottom: 'var(--space-16)' }}>
      <Icon name="pin" size={18} variant="duotone" />
      <div className="wg-origin__tx">
        <strong>{t('Leave by {time} for {dest}', { time: r.leaveBy, dest: place })}</strong>
        <span>
          {r.duration}, {t(LEVEL_LABEL[r.level])}
        </span>
      </div>
      <button
        className="wg-origin__change"
        onClick={() => {
          navigate(`route/${r.key}`)
          onClose()
        }}
      >
        {t('Route')}
      </button>
    </div>
  )
}

const EventRow = ({ ev, onOpen }: { ev: AgendaEvent; onOpen: () => void }) => (
  <div className={`wg-ev ${ev.state ?? ''}`}>
    <div className="wg-ev__time">
      <b>{ev.time}</b>
      <span>{t(ev.dur)}</span>
    </div>
    {}
    <button className="wg-ev__card wg-card-line" data-feedback="header" onClick={onOpen}>
      <div className="wg-ev__main">
        <span className={`wg-chip ${ev.tone} sm`}>
          <Icon name={ev.icon} size={19} variant="duotone" />
        </span>
        <div className="tx">
          <strong>{t(ev.title)}</strong>
          <small>{t(ev.sub)}</small>
        </div>
        {ev.avatars && (
          <div className="wg-ev__ava" aria-hidden="true">
            {}
            {ev.avatars.map((a) =>
              a.startsWith('+') ? (
                <span key={a} className="more">
                  {a}
                </span>
              ) : (
                <span key={a}>
                  <Avatar id={a} />
                </span>
              ),
            )}
          </div>
        )}
        {ev.flag && <span className="wg-ev__flag">{t(ev.flag)}</span>}
      </div>
      {}
      {ev.prep && (
        <div className="wg-ev__prep">
          <IconSpark size={15} />
          {t(ev.prep)}
        </div>
      )}
    </button>
  </div>
)

const NowDivider = () => (
  <div className="wg-now">
    <b>{t('now')}</b>
    <i />
  </div>
)

const DayCell = ({
  date,
  selected,
  dim,
  inStrip,
  onPick,
}: {
  date: string
  selected: string
  dim?: boolean
  inStrip?: boolean
  onPick: (date: string) => void
}) => {
  const on = date === selected
  return (
    <button
      {...(inStrip ? { role: 'tab', 'aria-selected': on } : { 'aria-pressed': on })}
      aria-label={dayLabel(date)}
      aria-current={isToday(date) ? 'date' : undefined}
      className={`${on ? 'on' : ''} ${isToday(date) ? 'today' : ''} ${dim ? 'dim' : ''}`}
      onClick={() => onPick(date)}
    >
      {}
      {inStrip && <small>{weekdayInitial(date)}</small>}
      <span className="num">{dayNumber(date)}</span>
      <span className="dots" aria-hidden="true">
        {Array.from({ length: dotsFor(date) }).map((_, d) => (
          <i key={d} />
        ))}
      </span>
    </button>
  )
}

const useFoldingBar = (trackRef: { current: HTMLElement | null }) => {
  const screenRef = useRef<HTMLDivElement>(null)
  const [tucked, setTucked] = useState(false)
  useEffect(() => {
    const track = trackRef.current
    if (!track) return
    const onScroll = () => setTucked((was) => (was ? track.scrollTop > 4 : track.scrollTop > 24))
    track.addEventListener('scroll', onScroll, { passive: true })
    return () => track.removeEventListener('scroll', onScroll)
  }, [trackRef])
  return { screenRef, tucked }
}

const REVEAL_LAST = 5
const revealer = () => {
  let n = 0
  return (cls: string) => ({
    className: `${cls} wg-reveal__line`,
    style: { '--i': Math.min(n++, REVEAL_LAST) } as CSSProperties,
  })
}

export const Calendar = () => {
  useCalendarData() // re-render when the real Google calendar finishes loading
  const trackRef = useRef<HTMLDivElement>(null)
  const { screenRef, tucked } = useFoldingBar(trackRef)
  const [nonce, setNonce] = useState(0)
  const refresh = useCallback(() => {
    setNonce((n) => n + 1)
    return revealHold()
  }, [])
  const [selected, setSelected] = useState(TODAY)
  const [anchor, setAnchor] = useState(() => startOfWeek(TODAY))
  const [monthOpen, setMonthOpen] = useState(false)
  const [openEv, setOpenEv] = useState<AgendaEvent | null>(null)

  const { events, nowAt } = agendaFor(selected)
  const brief = localize(briefFor(selected))
  const peek = localize(peekFor(selected))
  const empty = localize(emptyLineFor(selected))

  const page = (dir: -1 | 1) => {
    if (monthOpen) {
      setAnchor(addMonths(anchor, dir))
      return
    }
    const next = addDays(anchor, dir * 7)
    setAnchor(next)
    setSelected(addDays(selected, dir * 7))
  }

  const pick = (date: string) => {
    setSelected(date)
    setAnchor(startOfWeek(date))
    setMonthOpen(false)
  }

  const toggleMonth = () => {
    if (monthOpen) setAnchor(startOfWeek(selected))
    setMonthOpen((v) => !v)
  }

  const { items } = useConnections()
  const linked = items.find((c) => c.key === 'gcal')?.status === 'connected'
  usePullToRefresh({ scrollerRef: trackRef, hostRef: screenRef, onRefresh: refresh, enabled: linked })

  useEffect(() => {
    const el = trackRef.current
    if (!el) return
    el.classList.add('is-resetting')
    el.classList.remove('is-shown')
    void el.offsetHeight
    el.classList.remove('is-resetting')
    el.classList.add('is-shown')
  }, [selected, linked, nonce])

  const line = revealer()
  const step = monthOpen ? 'month' : 'week'

  const viewingToday = monthOpen ? inSameMonth(TODAY, anchor) : selected === TODAY
  const goToday = () => {
    setSelected(TODAY)
    setAnchor(monthOpen ? TODAY : startOfWeek(TODAY))
  }

  if (!linked)
    return (
      <div className="gh">
        <div className="wg-screen wg-cal">
          <div className="wg-cal__bar">
            <AppHeader />
          </div>
          <NotConnected connector="gcal" />
        </div>
      </div>
    )

  return (
    <div className="gh">
      <div className={`wg-screen wg-cal ${tucked ? 'tucked' : ''}`} ref={screenRef}>
        {}
        <div className="wg-cal__bar">
          <AppHeader />
        </div>

        {}
        <PullSpacer />

        {}
        <div className="wg-cal__dates">
          <div className="wg-topnav">
            {}
            <h1>
              <button
                className={`wg-topnav__title ${monthOpen ? 'open' : ''}`}
                aria-expanded={monthOpen}
                onClick={toggleMonth}
              >
                {monthLabel(anchor)} <span>{yearLabel(anchor)}</span>
                <IconChevronR size={18} className="caret" />
              </button>
            </h1>
            <div className="wg-topnav__btns" data-feedback="header">
              {!viewingToday && (
                <button className="wg-today" onClick={goToday}>
                  {t('Today')}
                </button>
              )}
              {}
              <button aria-label={step === 'month' ? t('Previous month') : t('Previous week')} onClick={() => page(-1)}>
                <IconChevronL size={20} />
              </button>
              <button aria-label={step === 'month' ? t('Next month') : t('Next week')} onClick={() => page(1)}>
                <IconChevronR size={20} />
              </button>
            </div>
          </div>

          {monthOpen ? (
            <div className="wg-monthgrid" aria-label={`${monthLabel(anchor)} ${yearLabel(anchor)}`}>
              {}
              {WEEKDAYS_SHORT.map((day) => (
                <small key={day} className="wg-monthgrid__head" aria-hidden="true">
                  {initialOf(day)}
                </small>
              ))}
              {monthGrid(anchor).map((date) => (
                <DayCell key={date} date={date} selected={selected} dim={!inSameMonth(date, anchor)} onPick={pick} />
              ))}
            </div>
          ) : (
            <div className="wg-week" role="tablist" aria-label={t('Week')}>
              {weekOf(anchor).map((date) => (
                <DayCell key={date} date={date} selected={selected} inStrip onPick={pick} />
              ))}
            </div>
          )}
        </div>

        {}
        <section className="wg-panel">
          <div className="wg-panel__scroll wg-reveal" ref={trackRef}>
            <div {...line('wg-panel-head')}>
              {}
              <h2>{dayLabel(selected)}</h2>
              <span>{summaryFor(selected)}</span>
            </div>

            {brief && (
              <div {...line('wg-brief wg-card-line')}>
                <span className="wg-chip mint sm">
                  <IconSpark size={18} variant="duotone" />
                </span>
                <div className="tx">
                  <strong>{brief.title}</strong>
                  <p>{brief.body}</p>
                </div>
              </div>
            )}

            {events.length === 0 ? (
              <div {...line('wg-empty wg-card-line')}>
                <span className="wg-chip mint md">
                  <IconSpark size={18} variant="duotone" />
                </span>
                <strong>{empty.title}</strong>
                <p>{empty.body}</p>
              </div>
            ) : (
              <div className="wg-agenda">
                {}
                {events.map((ev, i) => (
                  <div key={`${ev.time}-${ev.title}`} {...line('wg-agenda__slot')}>
                    {i === nowAt && <NowDivider />}
                    <EventRow ev={ev} onOpen={() => setOpenEv(ev)} />
                  </div>
                ))}
                {}
                {nowAt === events.length && <NowDivider />}
              </div>
            )}

            {peek && (
              <button {...line('wg-peek wg-card-line')} onClick={() => pick(peek.date)}>
                <div className="tx">
                  <strong>{peek.title}</strong>
                  <small>{peek.sub}</small>
                </div>
                <IconChevronR size={20} className="chev" />
              </button>
            )}
          </div>
        </section>
      </div>

      <Sheet open={!!openEv} onClose={() => setOpenEv(null)} labelledBy="wm-ev-title">
        {openEv && <EventSheet ev={openEv} onClose={() => setOpenEv(null)} />}
      </Sheet>
    </div>
  )
}

const EventSheet = ({ ev, onClose }: { ev: AgendaEvent; onClose: () => void }) => (
  <>
    <div className="wm-ap__head">
      <span className={`wg-chip ${ev.tone} sm`}>
        <Icon name={ev.icon} size={20} variant="duotone" />
      </span>
      <span className={`wm-ap__state ${ev.state === 'past' ? 'gone' : ev.flag ? 'warn' : ''}`}>
        {ev.state === 'past' ? t('Done') : ev.flag ? t(ev.flag) : `${ev.time} · ${t(ev.dur)}`}
      </span>
    </div>

    <h2 className="wm-sheet__title" id="wm-ev-title">
      {t(ev.title)}
    </h2>
    <p className="wm-ap__why">{t(ev.sub)}</p>

    {ev.prep && (
      <p className="wg-scopes__never">
        <IconSpark size={15} />
        <span>{t(ev.prep)}</span>
      </p>
    )}

    {}
    {ev.place && ev.state !== 'past' && <EventTravel place={ev.place} onClose={onClose} />}

    <div className="wm-ap__facts">
      <div className="wm-ap__fact">
        <span>{t('Starts')}</span>
        <strong>{ev.time}</strong>
      </div>
      <div className="wm-ap__fact">
        <span>{t('Runs')}</span>
        <strong>{t(ev.dur)}</strong>
      </div>
      {ev.avatars && (
        <div className="wm-ap__fact">
          <span>{t('With')}</span>
          <strong>{ev.avatars.join(', ')}</strong>
        </div>
      )}
    </div>

    <div className="wm-sheet__acts">
      <button
        className="wg-btn full wa"
        onClick={() => {
          openWhatsApp(t('About {title} at {time}', { title: t(ev.title), time: ev.time }))
          onClose()
        }}
      >
        <IconWhatsapp size={18} /> {t('Ask Wingman about this')}
      </button>
      <button className="wg-btn full quiet" onClick={onClose}>
        {t('Close')}
      </button>
    </div>
  </>
)
