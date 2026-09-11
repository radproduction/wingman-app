import { SubScreen } from './SubScreen'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import './app.css'

// Store health (orders, AOV, refunds, low stock, abandoned carts) and the
// "decisions waiting on you" cards were all fabricated seed data. With no store
// connected there is nothing real to show, so we render an honest empty state.
export const Commerce = () => {
  return (
    <SubScreen title="Commerce" back="business" className="wg-mod" feedback="header">
      <div className="wg-nc">
        <strong>{t('No store connected yet')}</strong>
        <p>
          {t(
            "Connect your store to see its health. Once it's linked I'll track orders, stock and refunds, and surface the decisions worth your time — until then I have nothing real to show.",
          )}
        </p>
        <button className="wg-btn full" onClick={() => navigate('business/integrations')}>
          {t('Connect your store')}
        </button>
      </div>
    </SubScreen>
  )
}
