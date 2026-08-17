import type { ReactNode } from 'react'
import { openConnect } from './ConnectSheet'
import { useConnections } from '../data/connections'
import { t } from '../i18n'
import './app.css'


const lit = (i: number) => ({ className: 'wg-nc__cell is-lit', style: { ['--i' as string]: i } })

const CalendarArt = () => (
  <svg className="wg-nc__art" viewBox="30 8 140 132" aria-hidden="true">
    {}
    <rect x="63" y="8" width="7" height="20" rx="3.5" fill="var(--track)" />
    <rect x="130" y="8" width="7" height="20" rx="3.5" fill="var(--track)" />

    {}
    <rect x="30" y="18" width="140" height="122" rx="18" fill="var(--art-paper)" />
    <path d="M30 36a18 18 0 0 1 18-18h104a18 18 0 0 1 18 18v10H30z" fill="var(--accent)" />

    {}
    {Array.from({ length: 15 }).map((_, i) => {
      const col = i % 5
      const row = Math.floor(i / 5)
      const order = [6, 9, 12].indexOf(i)
      return (
        <rect
          key={i}
          {...(order >= 0 ? lit(order) : { className: 'wg-nc__cell' })}
          x={46 + col * 22}
          y={62 + row * 22}
          width="14"
          height="14"
          rx="5"
        />
      )
    })}
  </svg>
)

const MailArt = () => (
  <svg className="wg-nc__art" viewBox="0.6 27 167.3 156.3" fill="none" aria-hidden="true">
    {}

    {}
    <path
      d="M167.919 166.144V84.6286L96.2437 30.9725C89.1384 25.6535 79.3776 25.6535 72.2723 30.9725L0.597351 84.6286V166.144C0.597351 175.622 8.28066 183.305 17.7585 183.305H150.757C160.235 183.305 167.919 175.622 167.919 166.144Z"
      fill="var(--accent-tonal)"
    />

    {}
    <g className="wg-nc__paper">
      <path
        d="M130.379 50.1931H38.1374C32.8061 50.1931 28.4842 54.515 28.4842 59.8463V169.91C28.4842 175.242 32.8061 179.563 38.1374 179.563H130.379C135.71 179.563 140.032 175.242 140.032 169.91V59.8463C140.032 54.515 135.71 50.1931 130.379 50.1931Z"
        fill="var(--art-paper)"
      />
      <path
        d="M101.955 68.7737H45.1091C43.0358 68.7737 41.3551 70.4544 41.3551 72.5277C41.3551 74.601 43.0358 76.2817 45.1091 76.2817H101.955C104.029 76.2817 105.709 74.601 105.709 72.5277C105.709 70.4544 104.029 68.7737 101.955 68.7737Z"
        fill="var(--art-ink)"
      />
      <path
        d="M119.117 81.6445H45.1091C43.0358 81.6445 41.3551 83.3253 41.3551 85.3985C41.3551 87.4718 43.0358 89.1525 45.1091 89.1525H119.117C121.19 89.1525 122.871 87.4718 122.871 85.3985C122.871 83.3253 121.19 81.6445 119.117 81.6445Z"
        fill="var(--art-ink)"
      />
      <path
        d="M89.0846 94.5156H45.1091C43.0358 94.5156 41.3551 96.1963 41.3551 98.2696C41.3551 100.343 43.0358 102.024 45.1091 102.024H89.0846C91.1579 102.024 92.8386 100.343 92.8386 98.2696C92.8386 96.1963 91.1579 94.5156 89.0846 94.5156Z"
        fill="var(--art-ink)"
      />
    </g>

    {}
    <path
      d="M0.597351 84.6287L84.258 128.418L167.919 84.6287V166.144C167.919 170.696 166.111 175.061 162.892 178.279C159.674 181.497 155.309 183.305 150.757 183.305H17.7585C13.2071 183.305 8.84208 181.497 5.62374 178.279C2.4054 175.061 0.597351 170.696 0.597351 166.144V84.6287Z"
      fill="var(--accent)"
    />
  </svg>
)

type Screen = { art: ReactNode; title: string; body: string }

const SCREENS: Record<string, Screen> = {
  gcal: {
    art: <CalendarArt />,
    title: "Your calendar isn't here yet",
    body: "Connect {service} and I'll read your day: what's next, who is coming, and what needs prep before it starts.",
  },
  gmail: {
    art: <MailArt />,
    title: "Your inbox isn't here yet",
    body: "Connect {service} and I'll triage it every morning: what needs a personal reply, what I've already handled, and what can wait.",
  },
}

export const NotConnected = ({ connector }: { connector: keyof typeof SCREENS }) => {
  const { items } = useConnections()
  const service = items.find((c) => c.key === connector)
  const screen = SCREENS[connector]
  if (!service || !screen) return null

  return (
    <div className="wg-nc" data-feedback="header">
      {screen.art}
      <strong>{t(screen.title)}</strong>
      <p>{t(screen.body, { service: service.name })}</p>
      <button className="wg-btn full" onClick={() => openConnect(service.key)}>
        {t('Connect {service}', { service: service.name })}
      </button>
    </div>
  )
}
