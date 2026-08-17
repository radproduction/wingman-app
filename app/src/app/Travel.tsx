import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { Icon } from './icons'
import { travel as travelSeed } from '../data/mock'
import { localize } from '../i18n'
import './app.css'

export const Travel = () => {
  const travel = localize(travelSeed)
  const { trip } = travel

  return (
    <ModuleScreen k="travel">
      <ModHead title="Next trip" />
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

      <ModHead title="What I'm watching" />
      <div className="wg-row-list">
        {travel.watching.map((t) => (
          <ModRow key={t.name} tone={t.tone} icon={t.icon} name={t.name} value={t.value} note={t.note} />
        ))}
      </div>

      <ModHead title="Before you go" />
      <div className="wg-row-list">
        {travel.before.map((t) => (
          <ModRow key={t.name} tone={t.tone} icon={t.icon} name={t.name} meta={t.value} approval={t.approval} />
        ))}
      </div>
    </ModuleScreen>
  )
}
