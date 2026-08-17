import { useId } from 'react'
import { WING_PATHS } from '../onboarding/WingGlyph'

const STAR = WING_PATHS[0]
const W = WING_PATHS[1]

export const HeaderBrand = () => {
  const id = useId()
  const fill = `url(#${id})`
  return (
    <svg viewBox="0 0 760 527" className="wg-brand" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="95" y1="-88" x2="702" y2="521" gradientUnits="userSpaceOnUse">
          <stop stopColor="#D2A7C1" />
          <stop offset="1" stopColor="#5384E5" />
        </linearGradient>
      </defs>

      <g className="wg-brand__starwrap">
        <path className="wg-brand__star" d={STAR} fill={fill} />
      </g>

      <path className="wg-brand__wfill" d={W} fill={fill} />

      <path
        className="wg-brand__wtrace"
        d={W}
        fill="none"
        stroke={fill}
        strokeWidth={24}
        strokeLinecap="round"
        strokeLinejoin="round"
        pathLength={1}
      />
    </svg>
  )
}
