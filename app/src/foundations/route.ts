import { useSyncExternalStore } from 'react'
import { findComponent } from './components-catalog'

export type PageId = 'introduction' | 'changelog'
export const PAGE_IDS: readonly PageId[] = ['introduction', 'changelog']

export type DocsRoute =
  | { view: 'foundations' }
  | { view: 'components'; component: string | null }
  | { view: 'page'; page: PageId }

export const routePath = (route: DocsRoute): string =>
  route.view === 'foundations'
    ? '/foundations'
    : route.view === 'page'
      ? `/${route.page}`
      : route.component === null
        ? '/components'
        : `/components/${route.component}`

const parse = (): DocsRoute => {
  const path = window.location.pathname.replace(/\/+$/, '')
  const page = PAGE_IDS.find((id) => path === `/${id}`)
  if (page) return { view: 'page', page }
  if (path !== '/components' && !path.startsWith('/components/')) return { view: 'foundations' }
  const id = path.slice('/components'.length).replace(/^\//, '')
  if (!id) return { view: 'components', component: null }
  return { view: 'components', component: findComponent(id) ? id : null }
}

let current: DocsRoute = parse()
const listeners = new Set<() => void>()

const same = (a: DocsRoute, b: DocsRoute): boolean => routePath(a) === routePath(b)

const sync = () => {
  const next = parse()
  if (same(current, next)) return
  current = next
  listeners.forEach((fn) => fn())
}

window.addEventListener('popstate', sync)

export const navigateDocs = (route: DocsRoute) => {
  const path = routePath(route)
  if (path === window.location.pathname) return
  window.history.pushState(null, '', path)
  sync()
  window.scrollTo({ top: 0 })
}

export const useDocsRoute = (): DocsRoute =>
  useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => current,
  )
