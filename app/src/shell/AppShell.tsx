import type { ReactNode } from 'react'
import './global.css'
import './app-shell.css'
import { DeviceChrome } from './DeviceChrome'

export const AppShell = ({ children }: { children: ReactNode }) => (
  <div className="wm-app-frame">
    <div className="wm-app-viewport">
      {children}
      <DeviceChrome />
    </div>
  </div>
)
