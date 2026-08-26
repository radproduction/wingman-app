import { ModuleScreen, ModHead, ModRow } from './ModuleScreen'
import { usePeople } from '../data/people'
import { t } from '../i18n'
import './app.css'

export const People = () => {
  const data = usePeople()
  const waiting = data?.waiting ?? []
  const recent = data?.recent ?? []

  const heroValue =
    !data ? t('Loading…')
    : data.waitingCount > 0 ? t('{n} follow-ups', { n: data.waitingCount })
    : t('All caught up')
  const heroSub = data && data.waitingCount > 0 ? t('People waiting on something from you') : t('Nothing waiting on you')

  return (
    <ModuleScreen k="people" heroValue={heroValue} heroSub={heroSub}>
      <ModHead title="Waiting on you" />
      {waiting.length === 0 ? (
        <p className="wg-note">{t("No open promises. I track anything you said you'd do in your mail and hold it here.")}</p>
      ) : (
        <div className="wg-row-list">
          {waiting.map((p, i) => (
            <ModRow
              key={`${p.name}-${i}`}
              tone={p.tone}
              initial={p.initial}
              name={p.name}
              value={p.when}
              meta={p.context}
              note={p.note}
            />
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <>
          <ModHead title="In touch" />
          <div className="wg-row-list">
            {recent.map((p, i) => (
              <ModRow key={`${p.name}-${i}`} tone={p.tone} initial={p.initial} name={p.name} value={p.when} meta={p.context} />
            ))}
          </div>
        </>
      )}
    </ModuleScreen>
  )
}
