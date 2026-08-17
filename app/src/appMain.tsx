import React from 'react'
import type { Root } from 'react-dom/client'
import App from './App'
import { registerServiceWorker } from './pwa/registerSW'
import { initIosKeyboardFix } from './pwa/iosKeyboardFix'
import { initKeyboardInset } from './shell/keyboard'
import { loadPrefs } from './shell/prefs'
import { applyLanguage } from './i18n'

export const mountApp = (root: Root) => {
  registerServiceWorker()
  initIosKeyboardFix()
  initKeyboardInset()
  loadPrefs()
  applyLanguage()

  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
