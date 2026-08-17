import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconCheck } from './icons'
import { Switch } from '../shell/Switch'
import { useNewsPrefs, setNewsPref, DEPTHS, DELIVERY_TIMES } from '../data/news'
import { formatTime } from '../onboarding/shared'
import { t } from '../i18n'
import './news.css'

const COUNTS = [4, 6, 8]

export const NewsSettings = () => {
  const p = useNewsPrefs()

  return (
    <SubScreen title={t('News settings')} back="news" className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>{t('Your brief is a morning thing by default. Shape when it lands and how much it carries.')}</p>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Delivered at')}</h2>
      </div>
      <div className="wg-seg">
        {DELIVERY_TIMES.map((time) => (
          <button key={time} className={p.deliver === time ? 'on' : ''} onClick={() => setNewsPref('deliver', time)}>
            {formatTime(time)}
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('How deep')}</h2>
      </div>
      <div className="wg-options">
        {DEPTHS.map((d) => (
          <button
            key={d.value}
            className={`wg-option wg-card-line ${p.depth === d.value ? 'on' : ''}`}
            onClick={() => setNewsPref('depth', d.value)}
          >
            <span className="tx">
              <strong>{t(d.value)}</strong>
              <span>{t(d.blurb)}</span>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('How many stories')}</h2>
      </div>
      <div className="wg-seg">
        {COUNTS.map((n) => (
          <button key={n} className={p.count === n ? 'on' : ''} onClick={() => setNewsPref('count', n)}>
            {n}
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Breaking news')}</h2>
      </div>
      <div className="wg-options">
        <button
          className={`wg-option wg-card-line wg-option--switch ${p.breaking ? 'on' : ''}`}
          onClick={() => setNewsPref('breaking', !p.breaking)}
        >
          <span className="ic rose">
            <Icon name="alert" size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>{t('Break in when it matters')}</strong>
            <span>{t('Only for something that touches your day. Otherwise it waits for the brief.')}</span>
          </span>
          <Switch on={p.breaking} />
        </button>
      </div>

      <p className="wg-footnote">{t('I read public news sources. Nothing here reaches into your private accounts.')}</p>
    </SubScreen>
  )
}
