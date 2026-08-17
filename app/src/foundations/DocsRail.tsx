import { useEffect, useState } from 'react'
import { COMPONENTS, TIERS, TIER_TITLES } from './components-catalog'
import { DOC_PAGES } from './components/registry'
import { navigateDocs, type DocsRoute, type PageId } from './route'

export const GETTING_STARTED: readonly { id: PageId; title: string }[] = [
  { id: 'introduction', title: 'Introduction' },
  { id: 'changelog', title: 'Changelog' },
]

export type RailSection = { id: string; title: string }

export const SECTIONS: readonly RailSection[] = [
  { id: 'color', title: 'Colour' },
  { id: 'type', title: 'Typography' },
  { id: 'scale', title: 'Spacing, shape and size' },
  { id: 'elevation', title: 'Elevation' },
  { id: 'motion', title: 'Motion' },
  { id: 'icons', title: 'Iconography' },
  { id: 'axes', title: 'Runtime axes' },
]

const useScrollSpy = (ids: readonly string[], active: boolean): string => {
  const [current, setCurrent] = useState(ids[0] ?? '')

  useEffect(() => {
    if (!active) return
    const onScroll = () => {
      let found = ids[0] ?? ''
      for (const id of ids) {
        const node = document.getElementById(id)
        if (!node) continue
        if (node.getBoundingClientRect().top <= 120) found = id
      }
      setCurrent(found)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [ids, active])

  return current
}

const ComponentsNav = ({ active }: { active: string | null }) => (
  <div className="wgd-rail__tree">
    <ul className="wgd-rail__list">
      <li>
        <button
          type="button"
          className="wgd-rail__item"
          aria-current={active === null ? 'page' : undefined}
          onClick={() => navigateDocs({ view: 'components', component: null })}
        >
          Overview
        </button>
      </li>
    </ul>
    {TIERS.map((tier) => {
      const rows = COMPONENTS.filter((entry) => entry.tier === tier)
      if (!rows.length) return null
      return (
        <div key={tier}>
          <p className="wgd-rail__tierlabel">{TIER_TITLES[tier]}</p>
          <ul className="wgd-rail__list">
            {rows
              .slice()
              .sort((a, b) => b.used - a.used)
              .map((entry) => {
                const documented = Boolean(DOC_PAGES[entry.id])
                return (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className="wgd-rail__item"
                      disabled={!documented}
                      title={documented ? undefined : 'Not documented yet'}
                      aria-current={active === entry.id ? 'page' : undefined}
                      onClick={() => navigateDocs({ view: 'components', component: entry.id })}
                    >
                      {entry.name}
                    </button>
                  </li>
                )
              })}
          </ul>
        </div>
      )
    })}
  </div>
)

export const DocsRail = ({ route }: { route: DocsRoute }) => {
  const onFoundations = route.view === 'foundations'
  const current = useScrollSpy(
    SECTIONS.map((s) => s.id),
    onFoundations,
  )

  return (
    <nav className="wgd-rail" aria-label="Documentation">
      <div className="wgd-rail__group">
        <p className="wgd-rail__label">Getting started</p>
        <ul className="wgd-rail__list">
          {GETTING_STARTED.map((page) => (
            <li key={page.id}>
              <button
                type="button"
                className="wgd-rail__item"
                aria-current={route.view === 'page' && route.page === page.id ? 'page' : undefined}
                onClick={() => navigateDocs({ view: 'page', page: page.id })}
              >
                {page.title}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="wgd-rail__group">
        <button
          type="button"
          className="wgd-rail__top"
          aria-current={onFoundations ? 'page' : undefined}
          onClick={() => navigateDocs({ view: 'foundations' })}
        >
          Foundations
        </button>
        {onFoundations ? (
          <ul className="wgd-rail__list">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="wgd-rail__link"
                  aria-current={current === section.id ? 'true' : undefined}
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="wgd-rail__group">
        <button
          type="button"
          className="wgd-rail__top"
          aria-current={route.view === 'components' ? 'page' : undefined}
          onClick={() => navigateDocs({ view: 'components', component: null })}
        >
          Components
        </button>
        {route.view === 'components' ? <ComponentsNav active={route.component} /> : null}
      </div>
    </nav>
  )
}
