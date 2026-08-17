import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'
import { Icon, type IconName } from '../app/icons'
import { t } from '../i18n'

export type ToastAction = { label: string; onAct: () => void }
export type Toast = { id: number; text: string; icon: IconName; action?: ToastAction }

let current: Toast | null = null
let closing = false
let seq = 0
let hideTimer: number | undefined
let dropTimer: number | undefined
const listeners = new Set<() => void>()

const emit = () => listeners.forEach((fn) => fn())

const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => void listeners.delete(fn)
}

const closeMs = () =>
  parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--toast-close')) || 250

const dismiss = () => {
  window.clearTimeout(hideTimer)
  if (!current || closing) return
  closing = true
  emit()
  dropTimer = window.setTimeout(() => {
    current = null
    closing = false
    emit()
  }, closeMs())
}

export const toast = (text: string, icon: IconName = 'check', ms = 2600, action?: ToastAction) => {
  window.clearTimeout(hideTimer)
  window.clearTimeout(dropTimer)
  closing = false
  current = { id: ++seq, text, icon, action }
  emit()
  hideTimer = window.setTimeout(dismiss, ms)
}

export const Toaster = ({ hasTabBar = false }: { hasTabBar?: boolean }) => {
  const active = useSyncExternalStore(subscribe, () => current)
  const leaving = useSyncExternalStore(subscribe, () => closing)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!active || leaving) {
      setOpen(false)
      return
    }
    const frame = requestAnimationFrame(() => setOpen(true))
    return () => cancelAnimationFrame(frame)
  }, [active, leaving])

  const host = document.querySelector('.wm-app-viewport')
  if (!host) return null

  return createPortal(
    <div className="wm-chrome gh">
      <div className={`wm-toast-layer${hasTabBar ? '' : ' is-tabless'}`} aria-live="polite">
        {active && (
          <div className={`wm-toast${open ? ' is-open' : ''}`}>
            <Icon name={active.icon} size={16} />
            <span>{t(active.text)}</span>
            {active.action && (
              <button
                className="wm-toast__act"
                onClick={() => {
                  active.action!.onAct()
                  dismiss()
                }}
              >
                {t(active.action.label)}
              </button>
            )}
          </div>
        )}
      </div>
    </div>,
    host,
  )
}
