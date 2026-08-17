function isIosStandalone(): boolean {
  if (typeof window === 'undefined') return false
  const ua = navigator.userAgent
  const isIos =
    /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  return isIos && standalone
}

export function initIosKeyboardFix(): void {
  if (!isIosStandalone()) return
  const snap = () => window.scrollTo(0, 0)
  window.addEventListener('focusout', () => window.setTimeout(snap, 100))
  window.visualViewport?.addEventListener('resize', snap)
}
