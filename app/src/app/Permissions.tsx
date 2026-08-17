import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconCheck, IconClock, IconSun } from './icons'
import { Switch } from '../shell/Switch'
import { agentActions, AUTONOMY_LEVELS } from '../data/mock'
import { useAgent, setAutonomy, toggleAction, setQuiet } from '../data/agentSettings'
import { localize, t, tx } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import './app.css'

export const Permissions = () => {
  const { autonomy, actions, quiet } = useAgent()
  const acts = localize(agentActions)

  const onAuto = (value: string) => {
    tapQuiet()
    setAutonomy(value)
  }
  const onAct = (key: string) => {
    tapQuiet()
    toggleAction(key)
  }

  return (
    <SubScreen title="Permissions" back="settings/privacy" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {tx('This is what I can do without checking first. {n} of {total} handovers are on, and money or people always ask.', {
            n: <b>{actions.length}</b>,
            total: agentActions.length,
          })}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('How much I act on my own')}</h2>
      </div>
      <div className="wg-options">
        {AUTONOMY_LEVELS.map((a) => (
          <button
            key={a.value}
            className={`wg-option wg-card-line ${autonomy === a.value ? 'on' : ''}`}
            onClick={() => onAuto(a.value)}
          >
            <span className="tx">
              <strong>{t(a.value)}</strong>
              <span>{t(a.blurb)}</span>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Act without asking')}</h2>
      </div>
      <div className="wg-options">
        {acts.map((a) => (
          <button
            key={a.key}
            className={`wg-option wg-card-line wg-option--switch ${actions.includes(a.key) ? 'on' : ''}`}
            onClick={() => onAct(a.key)}
          >
            <span className={`ic ${a.tone}`}>
              <Icon name={a.icon} size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>{a.name}</strong>
              <span>{a.desc}</span>
            </span>
            <Switch on={actions.includes(a.key)} />
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Quiet hours')}</h2>
      </div>
      <div className="wg-group wg-card-line">
        <label className="wg-row">
          <span className="wg-glyph lavender" style={{ width: 38, height: 38, margin: 0 }}>
            <IconClock size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>{t('Quiet from')}</strong>
            <span>{t('I hold anything that is not urgent')}</span>
          </span>
          <input type="time" value={quiet.from} onChange={(e) => setQuiet({ from: e.target.value })} />
        </label>
        <label className="wg-row">
          <span className="wg-glyph mint" style={{ width: 38, height: 38, margin: 0 }}>
            <IconSun size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>{t('Back on at')}</strong>
            <span>{t('Mornings pick up as normal')}</span>
          </span>
          <input type="time" value={quiet.to} onChange={(e) => setQuiet({ to: e.target.value })} />
        </label>
      </div>

      <p className="wg-footnote">
        {t('Anything that spends money, messages a person, or cannot be undone always shows you a card first, whatever these say. You can change all of this anytime.')}
      </p>
    </SubScreen>
  )
}
