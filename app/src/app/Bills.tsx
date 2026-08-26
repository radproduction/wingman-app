import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { useBills } from '../data/bills'
import { t } from '../i18n'
import './app.css'

export const Bills = () => {
  const data = useBills()

  // Until the real bills load (or if none), fall back to an honest empty state.
  const upcoming = data?.upcoming ?? []
  const paidList = data?.paidList ?? []

  const heroValue =
    !data ? t('Loading…')
    : data.needsYou > 0 ? t('{n} need you', { n: data.needsYou })
    : data.paid > 0 ? t('All paid')
    : t('Nothing due')
  const heroSub = data?.coming
    ? t('{name} · due {due}', { name: data.coming.name, due: data.coming.due })
    : t('Nothing coming up')

  return (
    <ModuleScreen k="bills" heroValue={heroValue} heroSub={heroSub}>
      <ModHead title="Coming up" note={data ? t('{amount} due', { amount: data.dueTotal }) : undefined} />
      {upcoming.length === 0 ? (
        <p className="wg-note">{t('Nothing coming up. I watch your mail for bills and add them here.')}</p>
      ) : (
        <div className="wg-row-list">
          {upcoming.map((b, i) => (
            <ModRow
              key={`${b.name}-${i}`}
              tone={b.tone}
              icon={b.icon}
              name={b.name}
              value={b.amount}
              meta={b.when}
              note={b.auto ? 'I pay this one automatically' : undefined}
            />
          ))}
        </div>
      )}

      {paidList.length > 0 && (
        <>
          <ModHead title="Paid" note={data ? t('{amount} this month', { amount: data.paidTotal }) : undefined} />
          <div className="wg-row-list">
            {paidList.map((b, i) => (
              <ModRow key={`${b.name}-${i}`} tone={b.tone} icon={b.icon} name={b.name} value={b.amount} meta={b.when} done />
            ))}
          </div>
        </>
      )}
    </ModuleScreen>
  )
}
