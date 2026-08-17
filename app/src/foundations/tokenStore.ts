import { ALL_TOKENS } from './data'
import { resolveTokens, type ThemedValue } from './resolve'

let cache: Record<string, ThemedValue> | null = null

export const tokens = (): Record<string, ThemedValue> => (cache ??= resolveTokens(ALL_TOKENS))

const EMPTY: ThemedValue = { light: '', dark: '' }

export const tv = (name: string): ThemedValue => tokens()[name] ?? EMPTY

export const tvIn = (name: string, theme: 'light' | 'dark'): string => tv(name)[theme]
