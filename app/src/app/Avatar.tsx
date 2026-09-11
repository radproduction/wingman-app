import './app.css'

/**
 * A person/company avatar. Shows a REAL profile photo only when one is actually
 * provided (`src`); otherwise it renders the person's initials in the toned chip
 * it sits in. It never invents a face — no stock photos, no generated cartoons —
 * so a sender or user without a real picture shows a clean initial, not a
 * stranger's portrait.
 */

const initialsOf = (v?: string): string => {
  const parts = String(v || '').trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

export const Avatar = ({ id, src, className = '' }: { id: string; src?: string | null; className?: string }) => {
  if (src) return <img className={`wg-face wg-face--photo ${className}`} src={src} alt="" referrerPolicy="no-referrer" />
  return (
    <span className={`wg-face wg-face--initials ${className}`} aria-hidden="true">
      {initialsOf(id)}
    </span>
  )
}
