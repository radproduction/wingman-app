import { channel } from '../data/mock'


const digits = (n: string) => n.replace(/\D/g, '')

export const whatsappLink = (text?: string) => {
  const base = `https://wa.me/${digits(channel.number)}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export const openWhatsApp = (text?: string) => {
  window.open(whatsappLink(text), '_blank', 'noopener,noreferrer')
}
