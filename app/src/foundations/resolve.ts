
export type ThemedValue = { light: string; dark: string }

const readAll = (tokens: readonly string[]): Record<string, string> => {
  const style = getComputedStyle(document.documentElement)
  const out: Record<string, string> = {}
  for (const token of tokens) out[token] = style.getPropertyValue(token).trim()
  return out
}

export const resolveTokens = (tokens: readonly string[]): Record<string, ThemedValue> => {
  const root = document.documentElement
  const held = root.getAttribute('data-theme')

  root.setAttribute('data-theme', 'light')
  const light = readAll(tokens)
  root.setAttribute('data-theme', 'dark')
  const dark = readAll(tokens)

  if (held === null) root.removeAttribute('data-theme')
  else root.setAttribute('data-theme', held)

  const out: Record<string, ThemedValue> = {}
  for (const token of tokens) out[token] = { light: light[token], dark: dark[token] }
  return out
}

export const isUnthemed = (value: ThemedValue): boolean => value.light === value.dark

export const resolveUnder = (
  attribute: string,
  value: string | null,
  tokens: readonly string[],
): Record<string, string> => {
  const root = document.documentElement
  const held = root.getAttribute(attribute)

  if (value === null) root.removeAttribute(attribute)
  else root.setAttribute(attribute, value)
  const out = readAll(tokens)

  if (held === null) root.removeAttribute(attribute)
  else root.setAttribute(attribute, held)
  return out
}

export const pxOf = (value: string): number | null => {
  const match = /^(-?[\d.]+)px$/.exec(value.trim())
  if (!match) return null
  const n = Number.parseFloat(match[1])
  return Number.isFinite(n) ? n : null
}

export const msOf = (value: string): number | null => {
  const v = value.trim()
  const ms = /^(-?[\d.]+)ms$/.exec(v)
  if (ms) return Number.parseFloat(ms[1])
  const s = /^(-?[\d.]+)s$/.exec(v)
  if (s) return Number.parseFloat(s[1]) * 1000
  return null
}

export type ShadowLayer = { x: number; y: number; blur: number; color: string }

export const parseShadow = (value: string): ShadowLayer[] => {
  const layers: ShadowLayer[] = []
  for (const part of value.split(/,(?![^(]*\))/)) {
    const colour = /(rgba?\([^)]*\)|#[0-9a-f]{3,8})/i.exec(part)
    if (!colour) continue
    const nums = part.replace(colour[0], '').match(/-?[\d.]+(?:px)?/g)
    if (!nums || nums.length < 2) continue
    layers.push({
      x: Number.parseFloat(nums[0]),
      y: Number.parseFloat(nums[1]),
      blur: nums[2] ? Number.parseFloat(nums[2]) : 0,
      color: colour[0],
    })
  }
  return layers
}

export const iosShadowRadius = (cssBlur: number): number => Math.round((cssBlur * 0.57735 + 0.5) * 10) / 10
