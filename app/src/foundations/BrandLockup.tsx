import { useId } from 'react'
import { WING_PATHS } from '../onboarding/WingGlyph'
import { WORDMARK_PATHS } from '../splash/wordmark'

const STAR = WING_PATHS[0]
const W = WING_PATHS[1]

export const BrandLockup = ({ className }: { className?: string }) => {
  const id = useId()
  const gradW = `${id}-w`
  const gradStar = `${id}-star`

  return (
    <svg className={className} viewBox="0 0 2125 526" role="img" aria-label="Wingman">
      <defs>
        {}
        <linearGradient id={gradW} x1="94.6659" y1="-87.9091" x2="702.186" y2="521.28" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D2A7C1" />
          <stop offset="1" stopColor="#5384E5" />
        </linearGradient>
        <linearGradient id={gradStar} x1="176.974" y1="-260.166" x2="869.579" y2="434.342" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D2A7C1" />
          <stop offset="1" stopColor="#5384E5" />
        </linearGradient>
      </defs>

      <path d={W} fill={`url(#${gradW})`} />
      <path d={STAR} fill={`url(#${gradStar})`} />
      {WORDMARK_PATHS.map((d, i) => (
        <path key={i} d={d} fill="var(--ink)" />
      ))}
    </svg>
  )
}
