import { useSyncExternalStore, type ReactNode } from 'react'
import { Sheet } from './Sheet'
import { t } from '../i18n'

export type ConfirmOpts = {
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  destructive?: boolean
  mark?: ReactNode
}

type Live = ConfirmOpts & { resolve: (ok: boolean) => void }

let current: Live | null = null
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((fn) => fn())
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

export const confirmAction = (opts: ConfirmOpts) =>
  new Promise<boolean>((resolve) => {
    current = { ...opts, resolve }
    emit()
  })

const settle = (ok: boolean) => {
  current?.resolve(ok)
  current = null
  emit()
}

export const ConfirmHost = () => {
  const c = useSyncExternalStore(subscribe, () => current)
  return (
    <Sheet open={!!c} onClose={() => settle(false)} labelledBy="wm-confirm-title">
      {}
      {c?.mark && <span className="wm-sheet__mark">{c.mark}</span>}
      {}
      <h2 className={`wm-sheet__title ${c?.mark ? 'centred' : ''}`} id="wm-confirm-title">
        {c && t(c.title)}
      </h2>
      <p className={`wm-sheet__body-tx ${c?.mark ? 'centred' : ''}`}>{c && t(c.body)}</p>
      <div className="wm-sheet__acts">
        <button
          className={`wg-btn full ${c?.destructive ? 'warn' : ''}`}
          onClick={() => settle(true)}
        >
          {c && t(c.confirmLabel)}
        </button>
        <button className="wg-btn full quiet" onClick={() => settle(false)}>
          {t(c?.cancelLabel ?? 'Keep it')}
        </button>
      </div>
    </Sheet>
  )
}
