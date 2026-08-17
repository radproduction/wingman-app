import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ALL_TOKENS,
  CHIP_ICON_TOKENS,
  CHIP_TOKENS,
  COLOR_GROUPS,
  RADIUS_TOKENS,
  ROW_TOKENS,
  SHADOW_TOKENS,
  SPACING_TOKENS,
  TYPE_TOKENS,
} from './data'
import { COMPONENTS } from './components-catalog'
import { GETTING_STARTED, SECTIONS } from './DocsRail'
import { navigateDocs, type PageId } from './route'

type Hit =
  | { kind: 'page'; id: PageId; title: string; sub: string }
  | { kind: 'component'; id: string; title: string; sub: string }
  | { kind: 'section'; id: string; title: string; sub: string }
  | { kind: 'token'; id: string; title: string; sub: string }

const tokenSection = (() => {
  const map = new Map<string, string>()
  const put = (tokens: readonly string[], section: string) => {
    for (const token of tokens) if (!map.has(token)) map.set(token, section)
  }
  put(COLOR_GROUPS.flatMap((g) => g.tokens), 'color')
  put(SHADOW_TOKENS, 'elevation')
  put([...SPACING_TOKENS, ...RADIUS_TOKENS, ...CHIP_TOKENS, ...CHIP_ICON_TOKENS, ...ROW_TOKENS], 'scale')
  put(TYPE_TOKENS, 'type')
  put(['--dir'], 'axes')
  return (token: string): string => map.get(token) ?? 'motion'
})()

const SECTION_TITLE = new Map(SECTIONS.map((s) => [s.id, s.title]))

const INDEX: readonly Hit[] = [
  ...GETTING_STARTED.map((page): Hit => ({ kind: 'page', id: page.id, title: page.title, sub: 'Getting started' })),
  ...COMPONENTS.map(
    (entry): Hit => ({ kind: 'component', id: entry.id, title: entry.name, sub: entry.family }),
  ),
  ...SECTIONS.map((s): Hit => ({ kind: 'section', id: s.id, title: s.title, sub: 'Foundations' })),
  ...ALL_TOKENS.map(
    (name): Hit => ({
      kind: 'token',
      id: name,
      title: name,
      sub: SECTION_TITLE.get(tokenSection(name)) ?? 'Foundations',
    }),
  ),
]

const MAX_HITS = 9

const search = (query: string): Hit[] => {
  const q = query.trim().toLowerCase()
  if (!q) return []
  const starts: Hit[] = []
  const contains: Hit[] = []
  for (const hit of INDEX) {
    const title = hit.title.toLowerCase()
    if (title.startsWith(q) || title.replace(/^--/, '').startsWith(q)) starts.push(hit)
    else if (title.includes(q)) contains.push(hit)
    if (starts.length >= MAX_HITS) break
  }
  return [...starts, ...contains].slice(0, MAX_HITS)
}

const goToSection = (id: string) => {
  navigateDocs({ view: 'foundations' })
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView())
}

export const DocsSearch = () => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => search(query), [query])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return
      e.preventDefault()
      inputRef.current?.focus()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const close = () => {
    setOpen(false)
    setActive(0)
  }

  const pick = (hit: Hit) => {
    close()
    setQuery('')
    inputRef.current?.blur()
    if (hit.kind === 'page') navigateDocs({ view: 'page', page: hit.id })
    else if (hit.kind === 'component') navigateDocs({ view: 'components', component: hit.id })
    else if (hit.kind === 'section') goToSection(hit.id)
    else goToSection(tokenSection(hit.id))
  }

  return (
    <div className="wgd-search">
      <input
        ref={inputRef}
        className="wgd-search__input"
        type="search"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-label="Search components, sections and tokens"
        placeholder="Search&hellip;  /"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setActive(0)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(close, 120)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setQuery('')
            close()
            inputRef.current?.blur()
          } else if (e.key === 'ArrowDown') {
            e.preventDefault()
            setActive((n) => Math.min(n + 1, hits.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setActive((n) => Math.max(n - 1, 0))
          } else if (e.key === 'Enter' && hits[active]) {
            e.preventDefault()
            pick(hits[active])
          }
        }}
      />
      {open && hits.length > 0 ? (
        <ul className="wgd-search__panel" role="listbox" aria-label="Results">
          {hits.map((hit, i) => (
            <li key={`${hit.kind}:${hit.id}`}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                className="wgd-search__hit"
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault()
                  pick(hit)
                }}
              >
                <span className="wgd-search__title">
                  {hit.kind === 'token' ? <code>{hit.title}</code> : hit.title}
                </span>
                <span className="wgd-search__sub">{hit.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
