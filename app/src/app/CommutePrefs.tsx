import { SubScreen } from './SubScreen'
import { IconSpark } from './icons'
import { Switch } from '../shell/Switch'
import { ModeIcon } from './icons'
import {
  useCommutePrefs,
  setPref,
  toggleWorkday,
  MODE_LABEL,
  TRAVEL_MODES,
  WORKDAYS,
  LEAD_TIMES,
  BUFFERS,
} from '../data/mobility'
import { t } from '../i18n'
import './app.css'
import './mobility.css'

export const CommutePrefs = () => {
  const p = useCommutePrefs()

  return (
    <SubScreen title="Commute preferences" back="places" className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>{t('I use these to time your leave-by reminders and pick routes that match how you travel.')}</p>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Workdays')}</h2>
      </div>
      <div className="wg-days">
        {WORKDAYS.map((d) => (
          <button key={d} className={p.workdays.includes(d) ? 'on' : ''} onClick={() => toggleWorkday(d)}>
            {t(d)}
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Times')}</h2>
      </div>
      <div className="wg-field">
        <label>{t('Arrive by')}</label>
        <input value={p.arrival} onChange={(e) => setPref('arrival', e.target.value)} />
      </div>
      <div className="wg-field">
        <label>{t('Leave at')}</label>
        <input value={p.departure} onChange={(e) => setPref('departure', e.target.value)} />
      </div>

      <div className="wg-panel-head">
        <h2>{t('Travel mode')}</h2>
      </div>
      <div className="wg-seg">
        {TRAVEL_MODES.map((m) => (
          <button key={m} className={p.mode === m ? 'on' : ''} aria-label={t(MODE_LABEL[m])} onClick={() => setPref('mode', m)}>
            <span className="m">
              <ModeIcon mode={m} size={22} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('On the road')}</h2>
      </div>
      <div className="wg-options">
        <button className={`wg-option wg-card-line wg-option--switch ${p.avoidTolls ? 'on' : ''}`} onClick={() => setPref('avoidTolls', !p.avoidTolls)}>
          <span className="tx">
            <strong>{t('Avoid tolls')}</strong>
          </span>
          <Switch on={p.avoidTolls} />
        </button>
        <button className={`wg-option wg-card-line wg-option--switch ${p.avoidHighways ? 'on' : ''}`} onClick={() => setPref('avoidHighways', !p.avoidHighways)}>
          <span className="tx">
            <strong>{t('Avoid highways')}</strong>
          </span>
          <Switch on={p.avoidHighways} />
        </button>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Remind me')}</h2>
      </div>
      <div className="wg-seg">
        {LEAD_TIMES.map((l) => (
          <button key={l} className={p.lead === l ? 'on' : ''} onClick={() => setPref('lead', l)}>
            {t(l.replace(' minutes', 'm'))}
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Arrival buffer')}</h2>
      </div>
      <div className="wg-seg">
        {BUFFERS.map((b) => (
          <button key={b} className={p.buffer === b ? 'on' : ''} onClick={() => setPref('buffer', b)}>
            {t(b.replace(' minutes', 'm'))}
          </button>
        ))}
      </div>

      <p className="wg-footnote">
        {t('Location is only used when you ask for traffic from where you are. You can always pick a starting point instead.')}
      </p>
    </SubScreen>
  )
}
