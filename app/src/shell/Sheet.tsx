import { useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useSheetDrag } from './useSheetDrag'

export const Sheet = ({
  open,
  onClose,
  dismissable = true,
  labelledBy,
  children,
}: {
  open: boolean
  onClose: () => void
  dismissable?: boolean
  labelledBy?: string
  children: ReactNode
}) => {
  const [mounted, setMounted] = useState(false)
  const [visible, setVisible] = useState(false)
  const layerRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const host = useRef<Element | null>(null)

  const { handle, springOut } = useSheetDrag({
    sheetRef,
    layerRef,
    enabled: dismissable,
    onDismiss: onClose,
  })

  const shown = useRef<ReactNode>(children)
  if (open) shown.current = children

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
  }, [open, mounted, springOut])

  useEffect(() => {
    if (!mounted || !open) return
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [mounted, open])

  useEffect(() => {
    if (!open || !dismissable) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, dismissable, onClose])

  if (!mounted) return null
  if (!host.current) host.current = document.querySelector('.wm-app-viewport')
  if (!host.current) return null

  return createPortal(
    <div className="wm-chrome gh">
      <div ref={layerRef} className={`wm-sheet-layer ${visible ? 'in' : ''}`}>
        <div className="wm-sheet__scrim" onClick={dismissable ? onClose : undefined} />
        <div ref={sheetRef} className="wm-sheet" role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
          {dismissable && (
            <button className="wm-sheet__grab" aria-label="Close" onClick={onClose} {...handle}>
              <i />
            </button>
          )}
          <div className="wm-sheet__body">{shown.current}</div>
        </div>
      </div>
    </div>,
    host.current,
  )
}
