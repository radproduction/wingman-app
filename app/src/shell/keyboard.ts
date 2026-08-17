export const initKeyboardInset = (): void => {
  const vv = window.visualViewport
  if (!vv) return

  const root = document.documentElement

  const apply = () => {
    const covered = window.innerHeight - (vv.height + vv.offsetTop)
    root.style.setProperty('--wm-kb', covered > 40 ? `${Math.round(covered)}px` : '0px')
  }

  vv.addEventListener('resize', apply)
  vv.addEventListener('scroll', apply)
  apply()
}
