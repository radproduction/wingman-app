import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { Icon } from './icons'
import { deliveries as deliveriesSeed, DELIVERY_STEPS, type Delivery } from '../data/mock'
import { localize, t } from '../i18n'
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

export const Deliveries = () => {
  const deliveries = localize(deliveriesSeed)

  return (
    <ModuleScreen k="deliveries">
      {}
      <ModHead title="On the way" />
      <div className="wg-row-list">
        {deliveries.transit.map((d) => (
          <Parcel key={d.item} d={d} />
        ))}
      </div>

      <ModHead title="Arrived" />
      <div className="wg-row-list">
        {deliveries.landed.map((d) => (
          <ModRow
            key={d.item}
            tone={d.tone}
            icon={d.icon}
            name={d.item}
            meta={d.when}
            note={d.window}
            done={d.closed}
          />
        ))}
      </div>
    </ModuleScreen>
  )
}
