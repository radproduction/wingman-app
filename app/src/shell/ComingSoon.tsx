import type { ReactNode } from 'react'
import { IconCalendar, IconMail, IconTask, IconGrid } from '../app/icons'
import { t } from '../i18n'

const META: Record<string, { title: string; icon: ReactNode; blurb: string }> = {
  calendar: { title: 'Calendar', icon: <IconCalendar size={26} />, blurb: "Your meetings and what's coming up. Coming soon." },
  email: { title: 'Email', icon: <IconMail size={26} />, blurb: 'The emails that actually need a reply. Coming soon.' },
  tasks: { title: 'Tasks', icon: <IconTask size={26} />, blurb: 'Everything on your plate in one list. Coming soon.' },
  more: { title: 'More', icon: <IconGrid size={26} />, blurb: 'Settings, connectors and the rest. Coming soon.' },
}

export const ComingSoon = ({ route }: { route: string }) => {
  const m = META[route] ?? { title: 'Coming soon', icon: <IconGrid size={26} />, blurb: "This part isn't ready yet." }
  return (
    <div className="gh">
      <div className="wg-screen wm-coming">
        <span className="wm-coming-glyph">{m.icon}</span>
        <h1>{t(m.title)}</h1>
        <p>{t(m.blurb)}</p>
      </div>
    </div>
  )
}
