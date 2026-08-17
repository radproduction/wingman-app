import { useCallback, useEffect, useRef, useState } from 'react'
import { AppHeader } from './AppHeader'
import { Icon, IconCheck } from './icons'
import { Dashboard } from './Dashboard'
import { DashboardSkeleton } from './Skeleton'
import { home as homeSeed } from '../data/mock'
import { useProfile } from '../data/store'
import { revealHold } from '../data/loading'
import { localize, t } from '../i18n'
import { usePullToRefresh } from '../shell/usePullToRefresh'
import { PullSpacer } from '../shell/PullSpacer'
import './app.css'
import './intelligence.css'
import './dashboard.css'


const greeting = () => {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

export const Home = () => {
  const scrollRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const refresh = useCallback(async () => {
    setLoading(true)
    await revealHold()
    setLoading(false)
  }, [])
  usePullToRefresh({ scrollerRef: scrollRef, hostRef: screenRef, onRefresh: refresh })

  const DAY = localize(homeSeed)
  const first = useProfile().name.split(' ')[0]

  useEffect(() => {
    if (!editing) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setEditing(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [editing])

  return (
    <div className="gh">
      <div className="wg-screen wg-home" ref={screenRef}>
        <AppHeader />
        <PullSpacer />

        {}
        <div className="wg-topnav">
          <h1>
            {t(greeting())}, {first}
          </h1>
          <div className="wg-topnav__btns" data-feedback="header">
            <button
              aria-label={editing ? t('Done customising') : t('Customise dashboard')}
              aria-pressed={editing}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? <IconCheck size={18} /> : <Icon name="grid" size={18} variant="duotone" />}
            </button>
          </div>
        </div>

        <section className="wg-panel">
          <div className="wg-panel__scroll" ref={scrollRef}>
            <div className={`wg-skel ${loading ? '' : 'is-revealed'}`} aria-busy={loading}>
              {loading && <DashboardSkeleton />}
              <div className="wg-skel__content" aria-hidden={loading}>
                <p className="wg-dash__date">{DAY.date}</p>
                <Dashboard editing={editing} onDone={() => setEditing(false)} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
