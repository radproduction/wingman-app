import { useEffect } from 'react'
import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { Icon } from './icons'
import { DELIVERY_STEPS, type Delivery } from '../data/mock'
import { useDeliveries, hydrateDeliveries } from '../data/deliveries'
import { t } from '../i18n'
import './app.css'

const Parcel = ({ d }: { d: Delivery }) => (
  <div className="wg-parcel wg-card-line">
    <div className="wg-parcel__top">
      <span className={`wg-chip ${d.tone} sm`}>
        <Icon name={d.icon} size={20} variant="duotone" />
      </span>
      <span className="wg-parcel__tx">
        <span className="wg-parcel__item">{d.item}</span>
        <span className="wg-parcel__from">{d.from}</span>
      </span>
    </div>

    <ol className="wg-steps">
      {DELIVERY_STEPS.map((s, i) => (
        <li key={s} className={`${i <= d.step ? 'on' : ''} ${i === d.step ? 'now' : ''}`}>
          <i aria-hidden="true" />
          <small>{t(s)}</small>
        </li>
      ))}
    </ol>

    <div className="wg-parcel__eta">{d.when}</div>
  </div>
)

// Hydrate once across mounts (App.tsx is owned elsewhere, so we trigger it here).
let hydrated = false

export const Deliveries = () => {
  const data = useDeliveries()

  useEffect(() => {
    if (hydrated) return
    hydrated = true
    void hydrateDeliveries()
  }, [])

  const transit = data?.transit ?? []
  const landed = data?.landed ?? []

  const heroValue =
    !data ? t('Loading…')
    : transit.length > 0 ? t('{n} on the way', { n: transit.length })
    : t('Nothing on the way')
  const heroSub =
    !data ? t('Checking your deliveries…')
    : transit[0] ? transit[0].when
    : t('I watch your mail for shipping updates')

  return (
    <ModuleScreen k="deliveries" heroValue={heroValue} heroSub={heroSub}>
      <ModHead title="On the way" />
      {transit.length === 0 ? (
        <p className="wg-note">
          {t('Nothing on the way right now. I watch your mail for shipping updates and track parcels here.')}
        </p>
      ) : (
        <div className="wg-row-list">
          {transit.map((d, i) => (
            <Parcel key={`${d.item}-${i}`} d={d} />
          ))}
        </div>
      )}

      {landed.length > 0 && (
        <>
          <ModHead title="Arrived" />
          <div className="wg-row-list">
            {landed.map((d, i) => (
              <ModRow
                key={`${d.item}-${i}`}
                tone={d.tone}
                icon={d.icon}
                name={d.item}
                meta={d.when}
                note={d.window}
                done={d.closed}
              />
            ))}
          </div>
        </>
      )}
    </ModuleScreen>
  )
}
