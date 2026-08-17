import { useCallback, useEffect, useRef, useState } from 'react'


const ms = (name: string, fallback: number) => {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  const v = parseFloat(raw)
  if (!Number.isFinite(v)) return fallback
  if (raw.endsWith('ms')) return v
  if (raw.endsWith('s')) return v * 1000
  return v
}

export const revealHold = () => new Promise<void>((res) => window.setTimeout(res, ms('--skel-hold', 1500)))

export const useFeedLoad = () => {
  const [revealed, setRevealed] = useState(false)
  const [showSkeleton, setShowSkeleton] = useState(true)
  const [nonce, setNonce] = useState(0)
  const resolveReload = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (nonce > 0) {
      setRevealed(false)
      setShowSkeleton(true)
    }
    let settle: number | undefined
    const load = window.setTimeout(
      () => {
        setRevealed(true)
        resolveReload.current?.()
        resolveReload.current = null
        settle = window.setTimeout(() => setShowSkeleton(false), ms('--reveal-dur', 400))
      },
      ms('--skel-hold', 1500),
    )
    return () => {
      window.clearTimeout(load)
      window.clearTimeout(settle)
    }
  }, [nonce])

  const reload = useCallback(
    () =>
      new Promise<void>((res) => {
        resolveReload.current = res
        setNonce((n) => n + 1)
      }),
    [],
  )

  return { revealed, showSkeleton, reload }
}
