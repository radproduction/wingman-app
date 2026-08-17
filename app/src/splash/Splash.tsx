import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { WING_PATHS } from '../onboarding/WingGlyph'
import { WORDMARK_PATHS } from './wordmark'
import './splash.css'

const LEAVE_MS = 350
const REDUCED_HOLD_MS = 900
const SAFETY_MS = 4000

const STAR = WING_PATHS[0]
const W = WING_PATHS[1]

const skipMotion = (): boolean => {
  if (typeof window === 'undefined') return true
  const chosen = document.documentElement.getAttribute('data-motion')
  if (chosen === 'reduced') return true
  if (chosen === 'full') return false
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}

interface SplashProps {
  onDone: () => void
}

export const Splash = ({ onDone }: SplashProps) => {
  const [leaving, setLeaving] = useState(false)
  const gradW = useId()
  const gradStar = useId()
  const reduced = skipMotion()
  const gone = useRef(false)

  const leave = useCallback(() => {
    if (gone.current) return
    gone.current = true
    setLeaving(true)
    window.setTimeout(onDone, LEAVE_MS)
  }, [onDone])

  useEffect(() => {
    const wait = window.setTimeout(leave, reduced ? REDUCED_HOLD_MS : SAFETY_MS)
    return () => window.clearTimeout(wait)
  }, [reduced, leave])

  return (
    <div className={leaving ? 'splash splash-leave' : 'splash'} aria-hidden="true">
      <svg className="splash-logo" viewBox="0 0 2125 526">
        <defs>
          {}
          <linearGradient
            id={gradW}
            x1="94.6659"
            y1="-87.9091"
            x2="702.186"
            y2="521.28"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D2A7C1" />
            <stop offset="1" stopColor="#5384E5" />
          </linearGradient>
          <linearGradient
            id={gradStar}
            x1="176.974"
            y1="-260.166"
            x2="869.579"
            y2="434.342"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#D2A7C1" />
            <stop offset="1" stopColor="#5384E5" />
          </linearGradient>
        </defs>

        {}
        <g className="wg-splash__mark">
          <path className="wg-splash__wfill" d={W} fill={`url(#${gradW})`} />
          <path
            className="wg-splash__wtrace"
            d={W}
            fill="none"
            stroke={`url(#${gradW})`}
            strokeWidth={7}
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
          />
          <path className="wg-splash__star" d={STAR} fill={`url(#${gradStar})`} />
        </g>

        <g className="wg-splash__wordmark" onAnimationEnd={reduced ? undefined : leave}>
          {WORDMARK_PATHS.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      </svg>
    </div>
  )
}
