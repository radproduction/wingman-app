import { createElement, Fragment, type ReactNode } from 'react'
import { getAgent, setAgent, useAgent, type LanguageCode } from '../data/agentSettings'
import { convertCurrency } from './currency'
import ar from './ar'
import ur from './ur'
import hi from './hi'

export type Dictionary = Record<string, string>

const DICTIONARIES: Partial<Record<LanguageCode, Dictionary>> = { ar, ur, hi }

const RTL: LanguageCode[] = ['ar', 'ur']

export const currentLang = (): LanguageCode => getAgent().language

export const useLang = (): LanguageCode => useAgent().language

export const isRtl = (lang: LanguageCode = currentLang()) => RTL.includes(lang)

type Vars = Record<string, string | number>

const CTX = ' '

const fill = (s: string, vars?: Vars) =>
  vars ? s.replace(/\{(\w+)\}/g, (whole, k) => (k in vars ? String(vars[k]) : whole)) : s

const lookup = (en: string, ctx?: string) => {
  const dict = DICTIONARIES[currentLang()]
  if (!dict) return en
  return ((ctx ? dict[en + CTX + ctx] : undefined) ?? dict[en] ?? en) as string
}

export const t = (en: string, vars?: Vars, ctx?: string): string =>
  convertCurrency(fill(lookup(en, ctx), vars), currentLang())

export const tx = (en: string, nodes: Record<string, ReactNode>, ctx?: string): ReactNode =>
  lookup(en, ctx)
    .split(/(\{\w+\})/)
    .map((part, i) => {
      const key = /^\{(\w+)\}$/.exec(part)?.[1]
      const filled = key && key in nodes ? nodes[key] : convertCurrency(part, currentLang())
      return createElement(Fragment, { key: i }, filled)
    })

const STRUCTURAL = new Set([
  'key',
  'id',
  'route',
  'icon',
  'tone',
  'variant',
  'avatars',
  'status',
  'state',
  'initial',
])

export const localize = <T,>(value: T): T => {
  if (typeof value === 'string') return t(value) as unknown as T
  if (Array.isArray(value)) return value.map(localize) as unknown as T
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value)) out[k] = STRUCTURAL.has(k) ? v : localize(v)
    return out as T
  }
  return value
}

export type PluralForms = { one?: string; two?: string; few?: string; many?: string; other: string }

export const plural = (n: number, forms: PluralForms, vars?: Vars) => {
  const rule = new Intl.PluralRules(currentLang()).select(n)
  const dict = DICTIONARIES[currentLang()]
  const translated = dict?.[forms.other + CTX + rule] ?? dict?.[forms.other]
  const english = (forms as Record<string, string | undefined>)[rule] ?? forms.other
  return convertCurrency(fill(translated ?? english, { n, ...vars }), currentLang())
}

export const applyLanguage = (lang: LanguageCode = currentLang()) => {
  const html = document.documentElement
  html.setAttribute('lang', lang)
  html.setAttribute('dir', isRtl(lang) ? 'rtl' : 'ltr')
}

export const setLanguage = (lang: LanguageCode) => {
  setAgent({ language: lang })
  applyLanguage(lang)
}
