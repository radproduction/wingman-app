import { useEffect, useState } from 'react'
import './device-chrome.css'

const readClock = () => {
  const now = new Date()
  const hour = now.getHours() % 12 || 12
  const minute = String(now.getMinutes()).padStart(2, '0')
  return `${hour}:${minute}`
}

const StatusIcons = () => (
  <span className="ios-statusbar__icons">
    <svg width="18" height="12" viewBox="0 0 18 12" fill="currentColor" aria-hidden="true">
      <rect x="0" y="8" width="3" height="4" rx="1" />
      <rect x="5" y="5.5" width="3" height="6.5" rx="1" />
      <rect x="10" y="3" width="3" height="9" rx="1" />
      <rect x="15" y="0" width="3" height="12" rx="1" />
    </svg>
    <svg width="18" height="13" viewBox="0 0 18 13" fill="currentColor" aria-hidden="true">
      <path d="M9 2.4C5.9 2.4 3.05 3.53.9 5.42a.6.6 0 0 0-.03.86l.9.94c.22.23.58.24.82.03A10.5 10.5 0 0 1 9 4.6c2.42 0 4.64.86 6.4 2.29.24.2.6.19.82-.03l.9-.94a.6.6 0 0 0-.03-.86A12.98 12.98 0 0 0 9 2.4Z" />
      <path d="M9 6.6c-1.77 0-3.4.63-4.67 1.68a.6.6 0 0 0-.05.87l.94.98c.21.22.55.24.79.05A5.1 5.1 0 0 1 9 8.9c1.16 0 2.22.38 3.06 1.02.24.18.58.16.79-.06l.94-.98a.6.6 0 0 0-.05-.87A7.28 7.28 0 0 0 9 6.6Z" />
      <path d="M9 10.4c-.86 0-1.63.35-2.19.92a.55.55 0 0 0 .02.79l1.76 1.7c.23.22.6.22.83 0l1.76-1.7a.55.55 0 0 0 .02-.79A3.06 3.06 0 0 0 9 10.4Z" />
    </svg>
    <svg width="26" height="13" viewBox="0 0 26 13" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="22" height="12" rx="3.6" stroke="currentColor" strokeOpacity="0.35" />
      <rect x="2" y="2" width="16.5" height="9" rx="1.8" fill="currentColor" />
      <path d="M24 4.3v4.4c.95-.4.95-4 0-4.4Z" fill="currentColor" fillOpacity="0.45" />
    </svg>
  </span>
)

export const DeviceChrome = () => {
  const [clock, setClock] = useState(readClock)

  useEffect(() => {
    const id = window.setInterval(() => setClock(readClock()), 15000)
    return () => window.clearInterval(id)
  }, [])

  return (
    <div className="ios-chrome" aria-hidden="true">
      <div className="ios-statusbar">
        <span className="ios-statusbar__time">{clock}</span>
        <StatusIcons />
      </div>
      <div className="ios-island" />
      <div className="ios-home-indicator" />
    </div>
  )
}
