import { useEffect, useRef, useState } from 'react'

export const Switch = ({ on, disabled }: { on: boolean; disabled?: boolean }) => {
  const last = useRef(on)
  const [init, setInit] = useState(false)

  useEffect(() => {
    if (last.current === on) return
    last.current = on
    setInit(true)
  }, [on])

  return (
    <span
      className={`wg-switch${init ? ' is-init' : ''}`}
      data-on={on}
      data-disabled={disabled || undefined}
      aria-hidden="true"
    >
      <i />
    </span>
  )
}
