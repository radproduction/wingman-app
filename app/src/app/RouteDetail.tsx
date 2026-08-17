import { useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconChevronR, IconWhatsapp, ModeIcon } from './icons'
import {
  routeByKey,
  routeForMode,
  clockToMin,
  minToClock,
  MODE_LABEL,
  LEVEL_LABEL,
  TRAVEL_MODES,
  type Route,
  type TrafficLevel,
  type TrafficLoad,
  type TrafficSpan,
  type TravelMode,
} from '../data/mobility'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { motionReduced } from '../shell/prefs'
import { tapHeader } from '../shell/feedback'
import { toast } from '../shell/toast'
import './app.css'
import './business.css'
import './mobility.css'


type Pt = [number, number]

const ROUTE_WAYPOINTS: Pt[] = [
  [40, 150],
  [112, 141],
  [108, 98],
  [180, 88],
  [238, 80],
  [235, 56],
  [262, 52],
  [288, 34],
]

const buildPoints = (wps: Pt[]): Pt[] => {
  const pts: Pt[] = [wps[0]]
  for (let i = 1; i < wps.length; i++) {
    const [x0, y0] = wps[i - 1]
    const [x1, y1] = wps[i]
    const steps = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0) / 2))
    for (let s = 1; s <= steps; s++) pts.push([x0 + ((x1 - x0) * s) / steps, y0 + ((y1 - y0) * s) / steps])
  }
  return pts
}

const toD = (pts: Pt[]) =>
  pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')

const ROUTE_POINTS = buildPoints(ROUTE_WAYPOINTS)

const ALT_WAYPOINTS: Pt[] = [
  [40, 150],
  [92, 143],
  [82, 58],
  [160, 46],
  [231, 36],
  [235, 56],
  [262, 52],
  [288, 34],
]
const ALT_POINTS = buildPoints(ALT_WAYPOINTS)

const ALT_TRAFFIC: TrafficSpan[] = [
  { w: 3, load: 'flow' },
  { w: 3, load: 'severe' },
  { w: 3.5, load: 'jam' },
  { w: 3, load: 'severe' },
  { w: 1.5, load: 'heavy' },
  { w: 3.2, load: 'flow' },
]

const LOAD_STROKE: Record<TrafficLoad, string> = {
  flow: 'var(--tf-flow)',
  slow: 'var(--tf-slow)',
  heavy: 'var(--tf-heavy)',
  severe: 'var(--tf-severe)',
  jam: 'var(--tf-jam)',
}


const kmOf = (s: string) => parseFloat(s) || 0
const minOf = (s: string) => parseInt(s, 10) || 0

const LOAD_SEVERITY: Record<TrafficLoad, number> = { flow: 0, slow: 1, heavy: 2, severe: 3, jam: 4 }

const avgSeverity = (traffic: TrafficSpan[]) => {
  const w = traffic.reduce((s, x) => s + x.w, 0) || 1
  return traffic.reduce((s, x) => s + x.w * LOAD_SEVERITY[x.load], 0) / w
}

const levelForSeverity = (sev: number): TrafficLevel => (sev < 0.9 ? 'light' : sev < 1.9 ? 'moderate' : 'heavy')

const delayText = (duration: number, usual: number) => {
  const d = Math.round(duration - usual)
  return d >= 1 ? `${d} min slower than usual` : d <= -1 ? `${-d} min faster than usual` : 'About usual'
}

export type RoutePhase = 'blue' | 'live'

const RouteTrace = ({ points, traffic, phase }: { points: Pt[]; traffic: TrafficSpan[]; phase: RoutePhase }) => {
  const total = traffic.reduce((sum, s) => sum + s.w, 0) || 1
  const last = points.length - 1
  const full = toD(points)
  let acc = 0
  const legs = traffic.map((s) => {
    const i0 = Math.round((acc / total) * last)
    acc += s.w
    const i1 = Math.round((acc / total) * last)
    return { load: s.load, d: toD(points.slice(i0, i1 + 1)) }
  })
  return (
    <g className="wg-route" data-phase={phase}>
      <path
        className="wg-route__casing"
        d={full}
        pathLength={1}
        fill="none"
        stroke="var(--home-surface)"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <g className="wg-route__legs">
        {legs.map((leg, i) => (
          <path
            key={i}
            d={leg.d}
            fill="none"
            stroke={LOAD_STROKE[leg.load]}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </g>
      <path
        className="wg-route__blue"
        d={full}
        pathLength={1}
        fill="none"
        stroke="var(--accent)"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

const AltLine = ({ points, phase, onSelect }: { points: Pt[]; phase: RoutePhase; onSelect: () => void }) => {
  const d = toD(points)
  return (
    <g
      className="wg-route-alt-g"
      role="button"
      tabIndex={0}
      onClick={() => {
        tapHeader()
        onSelect()
      }}
      aria-label={t('Take the alternative route')}
    >
      <path d={d} fill="none" stroke="transparent" strokeWidth="16" style={{ pointerEvents: 'stroke' }} />
      <path
        className="wg-route-alt"
        data-phase={phase}
        d={d}
        pathLength={1}
        fill="none"
        stroke="var(--route-alt)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  )
}

export const CommuteWidget = ({ route, onView }: { route: Route; onView?: () => void }) => (
  <div className="wg-commute wg-card-line">
    <div className="wg-commute__route">
      <ModeIcon mode={route.mode} size={16} />
      <b>{t(route.origin)}</b>
      <Icon name="chevronRight" size={16} />
      <b>{t(route.dest)}</b>
    </div>
    <div className="wg-commute__big">
      <span className="wg-commute__dur">{route.duration}</span>
      <span className={`wg-tlevel ${route.level}`}>
        <span className="dot" />
        {t(LEVEL_LABEL[route.level])}
      </span>
    </div>
    <div className="wg-commute__meta">
      {t('Leave by')} <b>{route.leaveBy}</b> {t('to arrive by {eta}', { eta: route.eta })}
    </div>
    <div className="wg-commute__delay">{t(route.delay)}</div>
    {}
    {onView && (
      <div className="wg-commute__acts">
        <button className="wg-btn full" data-feedback="header" onClick={onView}>
          <Icon name="pin" size={18} variant="duotone" /> {t('View route')}
        </button>
        <button
          className="wg-btn full wa"
          data-feedback="quiet"
          onClick={() => openWhatsApp(t('When should I leave for {dest}?', { dest: route.dest }))}
        >
          <IconWhatsapp size={18} /> {t('Remind me')}
        </button>
      </div>
    )}
  </div>
)

const ORIGIN_OPTIONS = ['Current location', 'Previous meeting', 'Office', 'Home']

export const RouteDetail = ({ routeKey }: { routeKey?: string }) => {
  const route = routeByKey(routeKey)
  const [origin, setOrigin] = useState(route.origin)
  const [mode, setMode] = useState<TravelMode>(route.mode)
  const [pickOrigin, setPickOrigin] = useState(false)

  const view = routeForMode(route, mode)

  const [selected, setSelected] = useState<'primary' | 'alt'>('primary')
  const etaMin = clockToMin(view.eta)

  const primKm = kmOf(view.distance)
  const primUsual = minOf(view.normal)
  const primDur = minOf(view.duration)
  const primSev = avgSeverity(route.traffic)
  const pace = primKm > 0 ? primUsual / primKm : 2
  const k = primSev > 0 && primUsual > 0 ? primDur / primUsual - 1 : 0.25
  const perSeverity = primSev > 0 ? k / primSev : 0.18

  const altKm = primKm + 3
  const altUsual = Math.round(altKm * pace)
  const altSev = avgSeverity(ALT_TRAFFIC)
  const altDur = Math.round(altUsual * (1 + altSev * perSeverity))

  const primary = {
    points: ROUTE_POINTS,
    traffic: route.traffic,
    distance: view.distance,
    normal: view.normal,
    duration: view.duration,
    level: view.level,
    leaveBy: view.leaveBy,
    delay: view.delay,
  }
  const alt = {
    points: ALT_POINTS,
    traffic: ALT_TRAFFIC,
    distance: `${Math.round(altKm)} km`,
    normal: `${altUsual} min`,
    duration: `${altDur} min`,
    level: levelForSeverity(altSev),
    leaveBy: etaMin != null ? minToClock(etaMin - altDur) : view.leaveBy,
    delay: delayText(altDur, altUsual),
  }
  const active = selected === 'alt' ? alt : primary
  const other = selected === 'alt' ? primary : alt

  const pickOther = () => {
    const next = selected === 'alt' ? 'primary' : 'alt'
    setSelected(next)
    const name = route.alts[0]?.name
    toast(
      next === 'alt'
        ? t('{name} selected · {dur}', { name: t(name ?? 'Alternative route'), dur: alt.duration })
        : t('Fastest route · {dur}', { dur: primary.duration }),
      'pin',
    )
  }

  const [phase, setPhase] = useState<RoutePhase>(() => (motionReduced() ? 'live' : 'blue'))
  useEffect(() => {
    if (phase !== 'blue') return
    const id = window.setTimeout(() => setPhase('live'), 3000)
    return () => window.clearTimeout(id)
  }, [phase])

  return (
    <SubScreen title="Route" back="home" className="wg-mod" feedback="header">
      {route.forEvent && (
        <div className="wg-bc__summary wg-card-line">
          <Icon name="calendar" size={18} variant="duotone" />
          <p>
            {t('For {event}. I keep watching the traffic and move your leave reminder if it changes.', {
              event: route.forEvent,
            })}
          </p>
        </div>
      )}

      {}
      <div className="wg-origin">
        <Icon name="pin" size={18} variant="duotone" />
        <div className="wg-origin__tx">
          <strong>{t('Starting from {origin}', { origin })}</strong>
          {route.originReason && <span>{t(route.originReason)}</span>}
        </div>
        <button className="wg-origin__change" onClick={() => setPickOrigin((v) => !v)}>
          {t('Change')}
        </button>
      </div>
      {pickOrigin && (
        <div className="wg-options">
          {ORIGIN_OPTIONS.map((o) => (
            <button
              key={o}
              className={`wg-option wg-card-line ${origin === o ? 'on' : ''}`}
              onClick={() => {
                setOrigin(o)
                setPickOrigin(false)
                toast(t('Recalculated from {origin}.', { origin: o }), 'pin')
              }}
            >
              <span className="tx">
                <strong>{t(o)}</strong>
              </span>
              <span className="mark">
                <Icon name="check" size={14} />
              </span>
            </button>
          ))}
        </div>
      )}

      {}
      <div className="wg-route-map">
        <svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice">
          {}
          <AltLine points={other.points} phase={phase} onSelect={pickOther} />
          {}
          <RouteTrace points={active.points} traffic={active.traffic} phase={phase} />
          <circle className="wg-route__dot" cx="40" cy="150" r="7" fill="var(--accent)" stroke="var(--home-surface)" strokeWidth="3" />
          <circle className="wg-route__dot" cx="288" cy="34" r="5" fill="var(--home-surface)" stroke="var(--accent)" strokeWidth="3" />
          <text x="40" y="170" textAnchor="middle" className="wg-route-map__pin">
            {t(origin)}
          </text>
          <text x="288" y="24" textAnchor="middle" className="wg-route-map__pin">
            {t(route.dest)}
          </text>
        </svg>
      </div>

      {}
      <div className="wg-commute wg-card-line">
        <div className="wg-commute__big">
          <span className="wg-commute__dur">{active.duration}</span>
          <span className={`wg-tlevel ${active.level}`}>
            <span className="dot" />
            {t(LEVEL_LABEL[active.level])}
          </span>
        </div>
        <div className="wg-tbar" data-phase={phase}>
          {phase === 'live' ? (
            active.traffic.map((s, i) => <i key={i} className={s.load} style={{ flex: s.w }} />)
          ) : (
            <i className="fetch" />
          )}
        </div>
        <div className="wg-commute__meta">
          {t('Leave by')} <b>{active.leaveBy}</b> {t('to arrive by {eta}', { eta: view.eta })}
        </div>
        <div className="wg-commute__delay">{t(active.delay)}</div>
      </div>

      {}
      <div className="wg-mfacts wg-card-line">
        <div>
          <span className="wg-mfact__i">
            <Icon name="pin" size={18} variant="duotone" />
          </span>
          <div className="wg-mfact__tx">
            <div className="wg-mfact__k">{t('Distance')}</div>
            <div className="wg-mfact__v">{active.distance}</div>
          </div>
        </div>
        <div>
          <span className="wg-mfact__i">
            <Icon name="clock" size={18} variant="duotone" />
          </span>
          <div className="wg-mfact__tx">
            <div className="wg-mfact__k">{t('Usually')}</div>
            <div className="wg-mfact__v">{active.normal}</div>
          </div>
        </div>
        <div>
          <span className="wg-mfact__i">
            <Icon name="checkCircle" size={18} variant="duotone" />
          </span>
          <div className="wg-mfact__tx">
            <div className="wg-mfact__k">{t('Arrive')}</div>
            <div className="wg-mfact__v">{view.eta}</div>
          </div>
        </div>
        <div>
          <span className="wg-mfact__i">
            <ModeIcon mode={mode} size={18} />
          </span>
          <div className="wg-mfact__tx">
            <div className="wg-mfact__k">{t('Mode')}</div>
            <div className="wg-mfact__v">{t(MODE_LABEL[mode])}</div>
          </div>
        </div>
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t(MODE_LABEL[mode])}</h2>
      </div>
      <div className="wg-seg">
        {TRAVEL_MODES.map((m) => (
          <button
            key={m}
            className={mode === m ? 'on' : ''}
            aria-label={t(MODE_LABEL[m])}
            onClick={() => setMode(m)}
          >
            <span className="m">
              <ModeIcon mode={m} size={22} />
            </span>
          </button>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Along the way')}</h2>
      </div>
      <ul className="wg-tseg wg-card-line">
        {view.segments.map((s) => (
          <li key={s.name}>
            <span className={`wg-tseg__dot ${s.level}`} />
            <span className="wg-tseg__name">{t(s.name)}</span>
            <span className="wg-tseg__mins">{s.mins}</span>
          </li>
        ))}
      </ul>

      {}
      <div className="wg-panel-head">
        <h2>{t('Other routes')}</h2>
      </div>
      <div className="wg-msteps">
        {view.alts.map((a) => (
          <button className="wg-alt wg-card-line" key={a.name} onClick={() => toast(t('Switched to {name}.', { name: a.name }), 'pin')}>
            <div className="wg-alt__tx">
              <span className="wg-alt__name">{t(a.name)}</span>
              <span className="wg-alt__note">{t(a.note)}</span>
            </div>
            <span className="wg-alt__dur">{a.duration}</span>
            <IconChevronR size={16} className="chev" />
          </button>
        ))}
      </div>

      {}
      <div className="wg-panel-head">
        <h2>{t('Do something')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <button className="wg-set" onClick={() => toast(t('Starting navigation.'), 'pin')}>
          <span className="wg-chip blue xs">
            <Icon name="pin" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Start navigation')}</span>
        </button>
        <button className="wg-set" onClick={() => toast(t("Leave reminder set for {t}.", { t: view.leaveBy }), 'clock')}>
          <span className="wg-chip lavender xs">
            <Icon name="clock" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Remind me when to leave')}</span>
        </button>
        <button className="wg-set" onClick={() => navigate('places')}>
          <span className="wg-chip sand xs">
            <Icon name="home" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Change destination')}</span>
          <IconChevronR size={18} className="chev" />
        </button>
      </div>

      <button
        className="wg-mod__ask wg-btn full wa"
        onClick={() => openWhatsApp(t('Is there a better route to {dest}?', { dest: route.dest }))}
      >
        <IconWhatsapp size={18} /> {t('Ask Wingman')}
      </button>
    </SubScreen>
  )
}
