
import { tapsOn } from './prefs'

type WebkitWindow = Window & { webkitAudioContext?: typeof AudioContext }

let ctx: AudioContext | null = null

const getCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as WebkitWindow).webkitAudioContext
  if (!AC) return null
  if (!ctx) ctx = new AC()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

const tone = (from: number, to: number, dur: number, peak: number) => {
  const ac = getCtx()
  if (!ac) return
  const now = ac.currentTime
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, now)
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, now + dur)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(peak, now + 0.004)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + dur)
  osc.connect(gain).connect(ac.destination)
  osc.start(now)
  osc.stop(now + dur + 0.02)
}

const primaryTick = () => tone(1500, 1500, 0.028, 0.016)
const backTick = () => tone(1820, 1820, 0.024, 0.014)

export const haptic = (ms = 10) => {
  if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(ms)
    } catch {
    }
  }
}

export type FeedbackTier = 'primary' | 'back' | 'header' | 'quiet' | 'none'

const fire = (tier: FeedbackTier) => {
  if (tier === 'none') return
  if (!tapsOn()) return
  haptic()
  if (tier === 'primary') primaryTick()
  else if (tier === 'back') backTick()
}

export const tapPrimary = () => fire('primary')
export const tapBack = () => fire('back')
export const tapHeader = () => fire('header')
export const tapQuiet = () => fire('quiet')

let installed = false

const onDocClick: EventListener = (e) => {
  const btn = (e.target as Element | null)?.closest?.('button') as HTMLButtonElement | null
  if (!btn || btn.disabled) return
  const marked = btn.closest('[data-feedback]')
  if (marked) fire((marked.getAttribute('data-feedback') as FeedbackTier) || 'quiet')
}

export const installTapFeedback = () => {
  if (installed || typeof document === 'undefined') return
  installed = true
  document.addEventListener('click', onDocClick, { capture: true })
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (typeof document !== 'undefined') document.removeEventListener('click', onDocClick, { capture: true })
    installed = false
  })
}

installTapFeedback()
