import { useEffect } from 'react'
import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { Icon } from './icons'
import { useTravel, hydrateTravel } from '../data/travel'
import { t } from '../i18n'
import './app.css'

// Hydrate once across mounts (App.tsx is owned elsewhere, so we trigger it here).
let hydrated = false

export const Travel = () => {
  const data = useTravel()

  useEffect(() => {
    if (hydrated) return
    hydrated = true
    void hydrateTravel()
  }, [])

  const trip = data?.next ?? null
  const more = data?.more ?? []

  const heroValue =
    !data ? t('Loading…')
    : trip ? t('{to} {away}', { to: trip.to, away: trip.away.toLowerCase() })
    : t('No upcoming trips')
  const heroSub =
    !data ? t('Checking your trips…')
    : trip ? t('{city} · {dates}', { city: trip.city, dates: trip.dates })
    : t('I watch your mail for flights and hotels')

  return (
    <ModuleScreen k="travel" heroValue={heroValue} heroSub={heroSub}>
      <ModHead title="Next trip" />
      {trip ? (
        <div className="wg-trip wg-card-line">
          <div className="wg-trip__route">
            <span className="wg-trip__code">{trip.from}</span>
            <span className="wg-trip__line" aria-hidden="true">
              <Icon name="plane" size={17} />
            </span>
            <span className="wg-trip__code">{trip.to}</span>
          </div>
          <div className="wg-trip__meta">
            {trip.city} · {trip.dates}
          </div>
          <div className="wg-trip__foot">
            <span className="wg-trip__away">{trip.away}</span>
            <span className="wg-trip__state">{trip.state}</span>
          </div>
        </div>
      ) : (
        <p className="wg-note">
          {t('No upcoming trips. I watch your mail for flights and hotels and line them up here.')}
        </p>
      )}

      {more.length > 0 && (
        <>
          <ModHead title="Also coming up" />
          <div className="wg-row-list">
            {more.map((m, i) => (
              <ModRow key={`${m.name}-${i}`} tone={m.tone} icon={m.icon} name={m.name} value={m.value} note={m.note} />
            ))}
          </div>
        </>
      )}
    </ModuleScreen>
  )
}
