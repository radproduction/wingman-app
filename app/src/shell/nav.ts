import { useEffect, useState } from 'react'
import { hasThemeRestarted } from './prefs'
import { rememberScroll } from './scroll'


export type NavDir = 'push' | 'pop' | 'none'

const KEY = 'wgIdx'
let seq = 0
let lastIdx = 0

let intent: NavDir | null = null

const stamp = (idx: number) => {
  window.history.replaceState({ ...window.history.state, [KEY]: idx }, '')
}

const booted: number = typeof window.history.state?.[KEY] === 'number' ? window.history.state[KEY] : 0
seq = booted
lastIdx = booted
stamp(booted)

const bootIdx = booted

export const getIdx = () => lastIdx

const routeOf = () => window.location.hash.replace(/^#\/?/, '')

let here = routeOf()

const readDir = (): NavDir => {
  const idx = window.history.state?.[KEY]
  let dir: NavDir
  if (typeof idx !== 'number') {
    seq += 1
    stamp(seq)
    lastIdx = seq
    dir = 'push'
  } else {
    dir = idx > lastIdx ? 'push' : idx < lastIdx ? 'pop' : 'none'
    lastIdx = idx
  }
  if (intent) {
    dir = intent
    intent = null
  }
  return dir
}

export const navigate = (route: string) => {
  window.location.hash = `#/${route}`
  seq += 1
  stamp(seq)
}

export const replaceRoute = (route: string, dir: NavDir = 'none') => {
  intent = dir
  window.location.replace(`#/${route}`)
  stamp(lastIdx)
}

export const goBack = (fallback: string) => {
  if (hasThemeRestarted() && lastIdx <= bootIdx) {
    replaceRoute(fallback, 'pop')
    return
  }
  if (window.history.length > 1) {
    window.history.back()
    return
  }
  intent = 'pop'
  navigate(fallback)
}

export const useNavRoute = () => {
  const [state, setState] = useState<{ route: string; dir: NavDir }>({ route: here, dir: 'none' })
  useEffect(() => {
    const onChange = () => {
      rememberScroll(lastIdx, here)
      const dir = readDir()
      here = routeOf()
      setState({ route: here, dir })
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return state
}
