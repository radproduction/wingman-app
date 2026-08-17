import type { LanguageCode } from '../data/agentSettings'

type Currency = {
  code: string
  unit: string
  space: boolean
  rate: number
}

const CURRENCY: Record<LanguageCode, Currency> = {
  en: { code: 'USD', unit: '$', space: false, rate: 0.2723 },
  ar: { code: 'AED', unit: 'AED', space: true, rate: 1 },
  ur: { code: 'PKR', unit: 'Rs', space: true, rate: 76 },
  hi: { code: 'INR', unit: '₹', space: false, rate: 22.5 },
}

const AED_AMOUNT = /\bAED\s+(\d[\d,]*(?:\.\d+)?)/g

const group = (n: number) => n.toLocaleString('en-US')

export const convertCurrency = (s: string, lang: LanguageCode): string => {
  const cur = CURRENCY[lang]
  if (cur.rate === 1 || !s.includes('AED')) return s
  return s.replace(AED_AMOUNT, (whole, amount: string) => {
    const value = parseFloat(amount.replace(/,/g, ''))
    if (!Number.isFinite(value)) return whole
    return cur.unit + (cur.space ? ' ' : '') + group(Math.round(value * cur.rate))
  })
}
