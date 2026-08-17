import { WING_PATHS } from '../onboarding/WingGlyph'

export type AppIconKey = 'midnight' | 'paper' | 'blue' | 'aurora'

type Face = {
  key: AppIconKey
  name: string
  ground: string
  wing: 'gradient' | 'white'
}

export const APP_ICONS: Face[] = [
  { key: 'midnight', name: 'Midnight', ground: '#070a16', wing: 'gradient' },
  { key: 'paper', name: 'Paper', ground: '#fefdfb', wing: 'gradient' },
  { key: 'blue', name: 'Blue', ground: '#4a6fd4', wing: 'white' },
  { key: 'aurora', name: 'Aurora', ground: 'url(#ground)', wing: 'white' },
]

const BRAND_FROM = '#D2A7C1'
const BRAND_TO = '#5384E5'

export const appIconSvg = (key: AppIconKey) => {
  const face = APP_ICONS.find((f) => f.key === key) ?? APP_ICONS[0]
  const mark = WING_PATHS.map(
    (d) => `<path d="${d}" fill="${face.wing === 'white' ? '#fff' : 'url(#mark)'}"/>`,
  ).join('')
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">',
    '<defs>',
    `<linearGradient id="mark" x1="95" y1="-88" x2="702" y2="521" gradientUnits="userSpaceOnUse">`,
    `<stop stop-color="${BRAND_FROM}"/><stop offset="1" stop-color="${BRAND_TO}"/>`,
    '</linearGradient>',
    `<linearGradient id="ground" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">`,
    `<stop stop-color="${BRAND_FROM}"/><stop offset="1" stop-color="${BRAND_TO}"/>`,
    '</linearGradient>',
    '</defs>',
    `<rect width="512" height="512" rx="116" fill="${face.ground}"/>`,
    `<g transform="translate(76 123) scale(0.475)">${mark}</g>`,
    '</svg>',
  ].join('')
}

export const appIconUri = (key: AppIconKey) =>
  `data:image/svg+xml,${encodeURIComponent(appIconSvg(key))}`
