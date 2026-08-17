import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { bills } from '../data/mock'
import { t } from '../i18n'
import './app.css'

export const Bills = () => (
  <ModuleScreen k="bills">
    <ModHead title="Coming up" note={t('{amount} due', { amount: bills.dueThisMonth })} />
    <div className="wg-row-list">
      {bills.upcoming.map((b) => (
        <ModRow
          key={b.name}
          tone={b.tone}
          icon={b.icon}
          name={b.name}
          value={b.amount}
          meta={b.when}
          note={b.auto ? 'I pay this one automatically' : undefined}
          approval={b.approval}
        />
      ))}
    </div>

    <ModHead title="Paid" note={t('{amount} this month', { amount: bills.paidThisMonth })} />
    <div className="wg-row-list">
      {bills.paid.map((b) => (
        <ModRow key={b.name} tone={b.tone} icon={b.icon} name={b.name} value={b.amount} meta={b.when} done />
      ))}
    </div>
  </ModuleScreen>
)
