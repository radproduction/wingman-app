import { useState } from 'react'
import './app.css'

/**
 * A person/company avatar. Shows a REAL profile photo when one is provided AND
 * loads; otherwise (no src, or the image 404s — e.g. Gravatar with no photo) it
 * falls back to the person's initials in the toned chip it sits in. It never
 * invents a face — no stock photos, no generated cartoons.
 */

const initialsOf = (v?: string): string => {
  const parts = String(v || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export const Avatar = ({ id, src, className = '' }: { id: string; src?: string | null; className?: string }) => {
  // Track the src that failed to load, so a different src is retried (list rows
  // reuse this component as they re-render).
  const [failedSrc, setFailedSrc] = useState<string | null>(null)

  if (src && failedSrc !== src) {
    return (
      <img
        className={`wg-face wg-face--photo ${className}`}
        src={src}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailedSrc(src)}
      />
    )
  }

  return (
    <span className={`wg-face wg-face--initials ${className}`} aria-hidden="true">
      {initialsOf(id)}
    </span>
  )
}
