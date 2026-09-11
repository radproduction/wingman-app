import { SubScreen } from './SubScreen'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'
import './business.css'

// Store performance (visitors, orders, revenue, conversion) has no real data
// source yet — the old figures were invented. Until a store is connected we
// show an honest not-connected state rather than fabricated metrics.
export const BusinessPerformance = () => {
  return (
    <SubScreen title="Performance" back="business" className="wg-mod" feedback="header">
      <div className="wg-nc">
        <strong>{t('No store connected yet')}</strong>
        <p>
          {t(
            "Connect your store to see performance. Once it's linked I'll show your visitors, orders and revenue here — until then there's nothing to show, and I won't make numbers up.",
          )}
        </p>
        <button className="wg-btn full" onClick={() => navigate('business/integrations')}>
          {t('Connect your store')}
        </button>
      </div>
    </SubScreen>
  )
}
