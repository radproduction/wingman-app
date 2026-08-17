import { useState } from 'react'
import { createPortal } from 'react-dom'
import { isStandalone } from './installState'
import { t } from '../i18n'
import './orientation-lock.css'

export const OrientationLock = () => {
  const [standalone] = useState(isStandalone)
  if (!standalone) return null
  return createPortal(
    <div className="wm-chrome gh">
      <div className="wg-orient" role="alertdialog" aria-label={t('Turn your phone upright')}>
        <div className="wg-orient__card">
          <RotateGlyph />
          <p className="wg-orient__title">{t('Turn your phone upright')}</p>
          <p className="wg-orient__body">{t('Wingman is built for portrait.')}</p>
        </div>
      </div>
    </div>,
    document.body,
  )
}

const RotateGlyph = () => (
  <svg className="wg-orient__icon" viewBox="0 0 48 48" width="52" height="52" fill="none" aria-hidden="true">
    <rect x="18.5" y="6" width="13" height="23" rx="3.2" stroke="currentColor" strokeWidth="2.4" />
    <line x1="22.5" y1="25.5" x2="27.5" y2="25.5" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M11 34a14 14 0 0 0 26 0" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M11 34l1-5M11 34l5 1" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
)
