import { appIconUri, type AppIconKey } from './appIcon'

export type Theme = 'system' | 'light' | 'dark'
export type TextSize = 'small' | 'default' | 'large'
export const TEXT_SIZES: TextSize[] = ['small', 'default', 'large']
export type Density = 'comfortable' | 'compact'
export type Motion = 'full' | 'reduced' | null

export type Prefs = {
  theme: Theme
  text: TextSize
  density: Density
  motion: Motion
  taps: boolean
  icon: AppIconKey
}

const DEFAULTS: Prefs = {
  theme: 'system',
  text: 'default',
  density: 'comfortable',
  motion: null,
  taps: true,
  icon: 'midnight',
}

const KEY = 'wingman.prefs'

let prefs: Prefs = { ...DEFAULTS }

export const getPrefs = (): Prefs => prefs

export const systemReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const DARK_QUERY = '(prefers-color-scheme: dark)'

export const systemDark = () => typeof window !== 'undefined' && window.matchMedia(DARK_QUERY).matches

export const resolvedTheme = (): 'light' | 'dark' =>
  prefs.theme === 'system' ? (systemDark() ? 'dark' : 'light') : prefs.theme

const syncChrome = () => {
  const root = document.documentElement
  const top = getComputedStyle(root).getPropertyValue('--home-surface').trim()
  if (!top) return
  root.style.backgroundColor = top
  const meta = document.createElement('meta')
  meta.setAttribute('name', 'theme-color')
  meta.setAttribute('content', top)
  const current = document.querySelector('meta[name="theme-color"]')
  if (current) current.replaceWith(meta)
  else document.head.appendChild(meta)
}

export const motionReduced = () =>
  prefs.motion === null ? systemReducedMotion() : prefs.motion === 'reduced'

export const tapsOn = () => prefs.taps

const apply = () => {
  const html = document.documentElement
  const set = (name: string, value: string | null) => {
    if (value) html.setAttribute(name, value)
    else html.removeAttribute(name)
  }
  set('data-theme', resolvedTheme())
  syncChrome()
  set('data-density', prefs.density === 'compact' ? 'compact' : null)
  set('data-text', prefs.text === 'default' ? null : prefs.text)
  set('data-motion', prefs.motion)

  const link = document.querySelector('link[rel="icon"]')
  if (link) link.setAttribute('href', appIconUri(prefs.icon))
}

export const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) prefs = { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Prefs>) }
  } catch {
  }
  apply()

  if (typeof window !== 'undefined') {
    window.matchMedia(DARK_QUERY).addEventListener('change', () => {
      if (prefs.theme === 'system') apply()
    })
  }
}

export const setPref = <K extends keyof Prefs>(key: K, value: Prefs[K]) => {
  const was = resolvedTheme()
  prefs = { ...prefs, [key]: value }
  apply()
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs))
  } catch {
  }
  if (resolvedTheme() !== was) restartForStatusBar()
}

const standalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true)

const RESTART_KEY = 'wingman.theme-restart'

const restartForStatusBar = () => {
  if (!standalone()) return
  try {
    sessionStorage.setItem(RESTART_KEY, '1')
  } catch {
  }
  window.location.reload()
}

let restarted: boolean | null = null

export const hasThemeRestarted = () => {
  if (restarted === null) {
    try {
      restarted = sessionStorage.getItem(RESTART_KEY) !== null
      sessionStorage.removeItem(RESTART_KEY)
    } catch {
      restarted = false
    }
  }
  return restarted
}
