import { useEffect, useRef, useState } from 'react'
import { useSheetDrag } from '../shell/useSheetDrag'
import {
  getInstallMode,
  isStandalone,
  markDismissed,
  promptInstall,
  subscribe,
  wasDismissed,
} from './installState'
import type { InstallMode } from './installState'
import { ShareGlyph } from '../app/icons'
import { t, tx } from '../i18n'
import './install-prompt.css'

const INSTALL_DELAY_MS = 1200

export const InstallPrompt = () => {
  const [mode, setMode] = useState<InstallMode>('none')
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isStandalone() || wasDismissed()) return
    let timer = 0
    let armed = false
    const arm = (m: InstallMode) => {
      if (armed) return
      armed = true
      setMode(m)
      timer = window.setTimeout(() => setOpen(true), INSTALL_DELAY_MS)
    }

    const initial = getInstallMode()
    if (initial === 'ios' || initial === 'android') arm(initial)

    const unsub = subscribe(() => {
      const m = getInstallMode()
      if (m === 'android' || m === 'ios') arm(m)
    })

    return () => {
      window.clearTimeout(timer)
      unsub()
    }
  }, [])

  const dismiss = () => {
    markDismissed()
    setOpen(false)
  }
  const install = async () => {
    await promptInstall()
    dismiss()
  }

  return (
    <InstallSheet
      open={open}
      mounted={mounted}
      setMounted={setMounted}
      visible={visible}
      setVisible={setVisible}
      layerRef={layerRef}
      sheetRef={sheetRef}
      dismiss={dismiss}
      install={install}
      mode={mode}
    />
  )
}

const InstallSheet = ({
  open,
  mounted,
  setMounted,
  visible,
  setVisible,
  layerRef,
  sheetRef,
  dismiss,
  install,
  mode,
}: {
  open: boolean
  mounted: boolean
  setMounted: (v: boolean) => void
  visible: boolean
  setVisible: (v: boolean) => void
  layerRef: React.RefObject<HTMLDivElement>
  sheetRef: React.RefObject<HTMLDivElement>
  dismiss: () => void
  install: () => void
  mode: InstallMode
}) => {
  const { handle, springOut } = useSheetDrag({ sheetRef, layerRef, onDismiss: dismiss })

  useEffect(() => {
    if (open) {
      setMounted(true)
      return
    }
    if (!mounted) return
    return springOut(() => {
      setVisible(false)
      setMounted(false)
    })
  }, [open, mounted, springOut, setMounted, setVisible])

  useEffect(() => {
    if (!mounted || !open) return
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [mounted, open, setVisible])

  if (!mounted) return null

  return (
    <div
      ref={layerRef}
      className={`wm-install ${visible ? 'in' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="wm-install-title"
    >
      <button className="wm-install__scrim" aria-label={t('Dismiss')} onClick={dismiss} />
      <div ref={sheetRef} className="wm-install__sheet">
        <button className="wm-sheet__grab" aria-label={t('Dismiss')} onClick={dismiss} {...handle}>
          <i />
        </button>
        <div className="wm-install__head">
          <img src="/icon.svg" alt="" className="wm-install__icon" />
          <div>
            <strong id="wm-install-title">{t('Install Wingman')}</strong>
            <span>{t('Add it to your home screen so it opens like a real app.')}</span>
          </div>
        </div>

        {mode === 'android' ? (
          <div className="wm-install__actions">
            <button className="wm-install__primary wg-btn" onClick={install}>
              {t('Install')}
            </button>
            <button className="wg-btn quiet" onClick={dismiss}>
              {t('Not now')}
            </button>
          </div>
        ) : (
          <>
            <ol className="wm-install__steps">
              <li>{tx('Tap the Share icon {share} in Safari’s toolbar', { share: <ShareGlyph className="wm-install__share" /> })}</li>
              <li>{tx('Choose {label}', { label: <b>{t('Add to Home Screen')}</b> })}</li>
            </ol>
            <div className="wm-install__actions">
              <button className="wm-install__primary wg-btn" onClick={dismiss}>
                {t('Got it')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

