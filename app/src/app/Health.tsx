import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconWhatsapp } from './icons'
import { health as healthSeed } from '../data/mock'
import { healthLive } from '../data/health'
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
  const connected = items.find((c) => c.key === 'health')?.status === 'connected'
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


const Spark = ({ series, good }: { series: number[]; good?: boolean }) => (
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

const HealthConnected = () => {
  const h = healthLive
  const max = Math.max(...h.week.days.map((d) => d.hours), h.week.goal)

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

  return (
    <SubScreen title={t('Health')} back="home" className="wg-mod wg-health">
      <div className="wg-mod__hero wg-card-line">
        <span className="wg-mod__tx">
          <span className="wg-mod__val">{t(h.hero.value)}</span>
          <span className="wg-mod__sub">{t(h.hero.sub)}</span>
        </span>
        <span className="wg-chip rose lg">
          <Icon name="heart" size={24} variant="duotone" />
        </span>
      </div>

      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>{t(h.brief)}</span>
      </div>

      <ModHead title="This morning's reads" />
      <div className="wg-hcards">
        {h.metrics.map((m) => (
          <div className="wg-hcard" key={m.key}>
            <div className="wg-hcard__top">
              <span className={`wg-chip ${m.tone} sm`}>
                <Icon name={m.icon} size={18} variant="duotone" />
              </span>
              <span className="wg-hcard__id">
                <span className="wg-hcard__name">{t(m.name)}</span>
                <span className="wg-hcard__trend">{t(m.trend)}</span>
              </span>
              <span className="wg-hcard__fig">
                <b>{m.value}</b>
                <small>{t(m.unit)}</small>
              </span>
            </div>
            <Spark series={m.series} good={m.good} />
            <p className="wg-hcard__read">{t(m.read)}</p>
          </div>
        ))}
      </div>

      <ModHead title="Sleep this week" />
      <div className="wg-hweek">
        <div className="wg-hweek__bars" style={{ ['--goal' as string]: `${(h.week.goal / max) * 100}%` }}>
          {h.week.days.map((d, i) => (
            <div className="wg-hweek__col" key={i}>
              <span
                className={`wg-hweek__bar${d.hours >= h.week.goal ? ' hit' : ''}`}
                style={{ height: `${Math.round((d.hours / max) * 100)}%` }}
              />
              <small>{t(d.day)}</small>
            </div>
          ))}
        </div>
        <p className="wg-hweek__note">{t(h.week.note)}</p>
      </div>

      <ModHead title="Today, shaped by your health" />
      <div className="wg-row-list">
        {h.adjustments.map((a) => (
          <ModRow key={a.title} tone={a.tone} icon={a.icon} name={a.title} meta={a.body} />
        ))}
      </div>

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

      <p className="wg-footnote">{t(h.promise)}</p>
    </SubScreen>
  )
}
