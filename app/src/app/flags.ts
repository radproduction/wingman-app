import us from '../assets/flags/us.svg'
import ae from '../assets/flags/ae.svg'
import pk from '../assets/flags/pk.svg'
import ind from '../assets/flags/in.svg'
import type { LanguageCode } from '../data/agentSettings'

const FLAGS: Record<LanguageCode, string> = { en: us, ar: ae, ur: pk, hi: ind }

export const flagFor = (code: LanguageCode) => FLAGS[code]
