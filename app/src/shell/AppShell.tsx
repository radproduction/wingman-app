import type { ReactNode } from 'react'
import './global.css'
import './app-shell.css'

// The faux iOS status bar / dynamic island / home indicator (DeviceChrome) was a
// desktop-preview mock only — on a real phone the OS draws its own. Removed so
// the app never paints a fake status bar; the real device's chrome shows through.

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="wm-app-frame">
    <div className="wm-app-viewport">{children}</div>
  </div>
)
