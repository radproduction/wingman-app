import ownerPhoto from '../assets/avatar.jpg'
import raiPhoto from '../assets/people/rai.jpg'
import bilalPhoto from '../assets/people/bilal.jpg'
import daniyalPhoto from '../assets/people/daniyal.jpg'
import sarahPhoto from '../assets/people/sarah.jpg'
import hinaPhoto from '../assets/people/hina.jpg'
import './app.css'

const PHOTOS: Record<string, string> = {
  A: ownerPhoto,
  S: sarahPhoto,
  R: raiPhoto,
  B: bilalPhoto,
  D: daniyalPhoto,
  H: hinaPhoto,
}

const SKINS = ['#f2cead', '#e0ab80', '#c68a5e', '#9c6b47']
const HAIRS = ['#241d17', '#3d2b1e', '#5c4230']
const STYLES = ['short', 'part', 'long', 'bun', 'curls'] as const

const seed = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

const pick = <T,>(list: readonly T[], n: number) => list[(n >>> 0) % list.length]

const HEAD = { x: 20, y: 15.5, r: 9.6 }

const cap = (y: number, r = HEAD.r + 0.7) => {
  const dx = Math.sqrt(Math.max(0, r * r - (HEAD.y - y) ** 2))
  return `M ${(20 - dx).toFixed(2)} ${y} A ${r} ${r} 0 0 1 ${(20 + dx).toFixed(2)} ${y} Z`
}

export const Avatar = ({ id, className = '' }: { id: string; className?: string }) => {
  const photo = PHOTOS[id]
  if (photo) return <img className={`wg-face wg-face--photo ${className}`} src={photo} alt="" aria-hidden="true" />

  const h = seed(id)
  const skin = pick(SKINS, h)
  const hair = pick(HAIRS, h >>> 4)
  const style = pick(STYLES, h >>> 9)

  return (
    <svg className={`wg-face ${className}`} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        {}
        <clipPath id="wg-face-clip">
          <circle cx="20" cy="20" r="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#wg-face-clip)">
        {}
        <ellipse cx="20" cy="41" rx="17" ry="14" fill="currentColor" />
        {}
        <rect x="15.4" y="19" width="9.2" height="10" rx="4.6" fill="var(--face-bg)" />
        <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r + 1.3} fill="var(--face-bg)" />
        {}
        <rect x="16.7" y="19" width="6.6" height="10" rx="3.3" fill={skin} />
        <circle cx={HEAD.x} cy={HEAD.y} r={HEAD.r} fill={skin} />

        {}
        {style === 'long' && (
          <>
            <rect x="9.2" y="11" width="4" height="16" rx="2" fill={hair} />
            <rect x="26.8" y="11" width="4" height="16" rx="2" fill={hair} />
          </>
        )}
        {style === 'bun' && <circle cx="20" cy="5.4" r="4" fill={hair} />}
        {style === 'curls' &&
          [
            [12.6, 11.8],
            [16.1, 9],
            [20, 7.8],
            [23.9, 9],
            [27.4, 11.8],
          ].map(([x, y]) => <circle key={x} cx={x} cy={y} r="4" fill={hair} />)}

        <path d={cap(style === 'short' ? 13 : 14.4)} fill={hair} />
        {}
        {style === 'part' && <path d="M9.6 14.2 Q11.2 20.4 14.6 21.8 Q11.6 17.4 12.4 12.4 Z" fill={hair} />}
      </g>
    </svg>
  )
}
