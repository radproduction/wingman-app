import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconWhatsapp, type IconName } from './icons'
import { health as healthSeed, type ChipTone } from '../data/mock'
import { useVitals, fmtSleep, type Vitals } from '../data/vitals'
import { useConnections, disconnect } from '../data/connections'
import { openConnect } from './ConnectSheet'
import { confirmAction } from '../shell/confirm'
import { toast } from '../shell/toast'
import { openWhatsApp } from '../shell/whatsapp'
import { localize, t } from '../i18n'
import './app.css'
import './health.css'

export const Health = () => {
  const { items } = useConnections()
  const vitals = useVitals()
  // Connected if the connector says so OR we already have readings.
  const connected = items.find((c) => c.key === 'health')?.status === 'connected' || !!vitals?.connected
  return connected ? <HealthConnected /> : <HealthInvite />
}


const HealthInvite = () => {
  const health = localize(healthSeed)
  return (
    <ModuleScreen
      k="health"
      footer={
        <>
          <button className="wg-btn full" data-feedback="header" onClick={() => openConnect('health')}>
            {t('Connect Apple Health & Google Fit')}
          </button>
          <p className="wg-footnote">{health.promise}</p>
        </>
      }
    >
      <ModHead title="What I'd watch for you" />
      {}
      <div className="wg-row-list wg-row-list--center">
        {health.would.map((h) => (
          <ModRow key={h.name} tone={h.tone} icon={h.icon} name={h.name} meta={h.desc} />
        ))}
      </div>
    </ModuleScreen>
  )
}


const Spark = ({ series, good }: { series: number[]; good?: boolean }) => {
  if (!series.length) return null
  return (
    <span className="wg-spark" aria-hidden="true">
      {series.map((v, i) => (
        <span
          key={i}
          className={`wg-spark__bar${good && i === series.length - 1 ? ' good' : ''}`}
          style={{ height: `${Math.max(12, Math.round(v * 100))}%` }}
        />
      ))}
    </span>
  )
}

type Card = {
  key: string
  name: string
  icon: IconName
  tone: ChipTone
  value: string
  unit: string
  trend: string
  series: number[]
  good?: boolean
}

// Build the "reads" cards purely from real readings — a card only appears when
// we actually have that metric.
const buildCards = (v: Vitals): Card[] => {
  const cards: Card[] = []
  const r = (n: number) => Math.round(n)

  if (v.sleepHours != null) {
    const b = v.reads.sleep.baseline
    cards.push({
      key: 'sleep', name: 'Sleep', icon: 'moon', tone: 'lavender',
      value: fmtSleep(v.sleepHours), unit: 'last night',
      trend: b != null ? t('Your usual is {v}', { v: fmtSleep(b) }) : t('Building your baseline'),
      series: v.reads.sleep.series, good: b != null ? v.sleepHours >= b : undefined,
    })
  }

  if (v.recovery != null) {
    const b = v.reads.recovery.baseline
    cards.push({
      key: 'recovery', name: 'Recovery', icon: 'heart', tone: 'rose',
      value: `${r(v.recovery)}%`, unit: 'recovery',
      trend: b != null ? t('Your usual is {v}%', { v: r(b) }) : t('Building your baseline'),
      series: v.reads.recovery.series, good: b != null ? v.recovery >= b : undefined,
    })
  } else if (v.hrv != null) {
    const b = v.reads.hrv.baseline
    cards.push({
      key: 'hrv', name: 'Recovery', icon: 'heart', tone: 'rose',
      value: `${r(v.hrv)} ms`, unit: 'HRV overnight',
      trend: b != null ? t('Your usual is {v}ms', { v: r(b) }) : t('Building your baseline'),
      series: v.reads.hrv.series, good: b != null ? v.hrv >= b : undefined,
    })
  }

  if (v.steps != null) {
    const b = v.reads.steps.baseline
    cards.push({
      key: 'steps', name: 'Movement', icon: 'activity', tone: 'peach',
      value: r(v.steps).toLocaleString('en-US'), unit: 'steps',
      trend: b != null ? t('Your usual is {v}', { v: r(b).toLocaleString('en-US') }) : t('Building your baseline'),
      series: v.reads.steps.series, good: b != null ? v.steps >= b : undefined,
    })
  }

  if (v.restingHr != null) {
    const b = v.reads.restingHr.baseline
    cards.push({
      key: 'rhr', name: 'Resting heart rate', icon: 'heart', tone: 'blue',
      value: `${r(v.restingHr)}`, unit: 'bpm',
      trend: b != null ? t('Your usual is {v}', { v: r(b) }) : t('Building your baseline'),
      series: v.reads.restingHr.series, good: b != null ? v.restingHr <= b : undefined,
    })
  }

  return cards
}

const HealthConnected = () => {
  const vitals = useVitals()

  const unlink = async () => {
    const ok = await confirmAction({
      title: t('Disconnect Health?'),
      body: t("I'll stop reading sleep, recovery and movement, and your day goes back to being shaped by the rest. What I've learned stays until you clear my memory."),
      mark: (
        <span className="wg-chip rose lg">
          <Icon name="heart" size={30} variant="duotone" />
        </span>
      ),
      confirmLabel: t('Disconnect it'),
      cancelLabel: t('Keep it connected'),
      destructive: true,
    })
    if (!ok) return
    disconnect('health')
    toast(t('Health disconnected.'), 'check')
  }

  const heroValue =
    !vitals ? t('Loading…')
    : vitals.recovery != null ? t('{n}% recovered', { n: Math.round(vitals.recovery) })
    : vitals.sleepHours != null ? t('Slept {v}', { v: fmtSleep(vitals.sleepHours) })
    : t('Connected')
  const heroSub = vitals?.summary || (vitals && vitals.hrv != null ? `HRV ${Math.round(vitals.hrv)}ms` : t('Waiting on your first readings'))

  const cards = vitals ? buildCards(vitals) : []
  const week = vitals?.week ?? []
  const goal = vitals?.reads.sleep.baseline ?? 7.5
  const max = week.length ? Math.max(...week.map((d) => d.hours), goal) : goal

  return (
    <SubScreen title={t('Health')} back="home" className="wg-mod wg-health">
      <div className="wg-mod__hero wg-card-line">
        <span className="wg-mod__tx">
          <span className="wg-mod__val">{heroValue}</span>
          <span className="wg-mod__sub">{heroSub}</span>
        </span>
        <span className="wg-chip rose lg">
          <Icon name="heart" size={24} variant="duotone" />
        </span>
      </div>

      {vitals?.summary && (
        <div className="wg-brief-line">
          <IconSpark size={16} />
          <span>{vitals.summary}</span>
        </div>
      )}

      {cards.length === 0 ? (
        <p className="wg-note">{t("You're connected — I just don't have today's readings yet. They'll show here once your device syncs.")}</p>
      ) : (
        <>
          <ModHead title="Latest reads" />
          <div className="wg-hcards">
            {cards.map((m) => (
              <div className="wg-hcard" key={m.key}>
                <div className="wg-hcard__top">
                  <span className={`wg-chip ${m.tone} sm`}>
                    <Icon name={m.icon} size={18} variant="duotone" />
                  </span>
                  <span className="wg-hcard__id">
                    <span className="wg-hcard__name">{t(m.name)}</span>
                    <span className="wg-hcard__trend">{m.trend}</span>
                  </span>
                  <span className="wg-hcard__fig">
                    <b>{m.value}</b>
                    <small>{t(m.unit)}</small>
                  </span>
                </div>
                <Spark series={m.series} good={m.good} />
              </div>
            ))}
          </div>
        </>
      )}

      {week.length > 0 && (
        <>
          <ModHead title="Sleep this week" />
          <div className="wg-hweek">
            <div className="wg-hweek__bars" style={{ ['--goal' as string]: `${(goal / max) * 100}%` }}>
              {week.map((d, i) => (
                <div className="wg-hweek__col" key={i}>
                  <span
                    className={`wg-hweek__bar${d.hours >= goal ? ' hit' : ''}`}
                    style={{ height: `${Math.round((d.hours / max) * 100)}%` }}
                  />
                  <small>{d.day}</small>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        className="wg-mod__ask wg-btn full wa"
        data-feedback="quiet"
        onClick={() => openWhatsApp(t('How am I doing on sleep and recovery?'))}
      >
        <IconWhatsapp size={18} /> {t('Ask Wingman about your health')}
      </button>

      <button className="wg-health__unlink wg-btn full danger" data-feedback="quiet" onClick={unlink}>
        <Icon name="heart" size={18} variant="duotone" />
        {t('Disconnect Health')}
      </button>
    </SubScreen>
  )
}
