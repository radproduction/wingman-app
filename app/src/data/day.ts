import { NOW, TODAY, calendarDays, type CalEvent } from './mock'
import { plural, t } from '../i18n'

const MS_DAY = 86_400_000

const parse = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return Date.UTC(y, m - 1, d)
}

const format = (ms: number) => {
  const d = new Date(ms)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`
}


export const addDays = (iso: string, n: number) => format(parse(iso) + n * MS_DAY)

export const addMonths = (iso: string, n: number) => {
  const d = new Date(parse(iso))
  const y = d.getUTCFullYear()
  const m = d.getUTCMonth() + n
  const lastDay = new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
  return format(Date.UTC(y, m, Math.min(d.getUTCDate(), lastDay)))
}

export const startOfWeek = (iso: string) => addDays(iso, -weekdayIndex(iso))

export const weekOf = (iso: string) => {
  const start = startOfWeek(iso)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

export const monthGrid = (iso: string) => {
  const d = new Date(parse(iso))
  const first = format(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
  const start = startOfWeek(first)
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}


export const WEEKDAYS_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const weekdayIndex = (iso: string) => (new Date(parse(iso)).getUTCDay() + 6) % 7

export const dayNumber = (iso: string) => new Date(parse(iso)).getUTCDate()

export const initialOf = (dayShort: string) => {
  const answer = t(dayShort, undefined, 'initial')
  return answer === dayShort ? dayShort[0] : answer
}

export const weekdayInitial = (iso: string) => initialOf(WEEKDAYS_SHORT[weekdayIndex(iso)])

export const monthLabel = (iso: string) => t(MONTHS[new Date(parse(iso)).getUTCMonth()])
export const yearLabel = (iso: string) => String(new Date(parse(iso)).getUTCFullYear())

export const inSameMonth = (a: string, b: string) => a.slice(0, 7) === b.slice(0, 7)

export const isToday = (iso: string) => iso === TODAY

export const dayLabel = (iso: string) => {
  if (iso === TODAY) return t('Today')
  if (iso === addDays(TODAY, 1)) return t('Tomorrow')
  if (iso === addDays(TODAY, -1)) return t('Yesterday')
  return t('{weekday} {day} {month}', {
    weekday: t(WEEKDAYS_SHORT[weekdayIndex(iso)]),
    day: dayNumber(iso),
    month: t(MONTHS_SHORT[new Date(parse(iso)).getUTCMonth()]),
  })
}


export const eventsFor = (iso: string): CalEvent[] =>
  [...(calendarDays[iso]?.events ?? [])].sort((a, b) => a.time.localeCompare(b.time))

export const briefFor = (iso: string) => calendarDays[iso]?.brief

export const dotsFor = (iso: string) => Math.min(3, eventsFor(iso).length)

export type AgendaEvent = CalEvent & { state?: 'past' | 'next' }

export const agendaFor = (iso: string): { events: AgendaEvent[]; nowAt: number } => {
  const list = eventsFor(iso)

  if (iso < TODAY) return { events: list.map((e) => ({ ...e, state: 'past' })), nowAt: -1 }
  if (iso > TODAY) return { events: list, nowAt: -1 }

  const upcoming = list.findIndex((e) => e.time >= NOW)
  return {
    events: list.map((e, i) => ({
      ...e,
      state: e.time < NOW ? 'past' : i === upcoming ? 'next' : undefined,
    })),
    nowAt: list.length === 0 ? -1 : upcoming === -1 ? list.length : upcoming,
  }
}

export const summaryFor = (iso: string) => {
  const list = eventsFor(iso)
  const events = (n: number) => plural(n, { one: '{n} event', other: '{n} events' })
  if (list.length === 0) return t('Nothing scheduled')
  if (iso !== TODAY) return events(list.length)

  const done = list.filter((e) => e.time < NOW).length
  const ahead = list.length - done
  if (done === 0) return t('{events} ahead', { events: events(ahead) })
  if (ahead === 0) return t('All done')
  return t('{done} done · {ahead} ahead', { done, ahead })
}

export const emptyLineFor = (iso: string) =>
  iso < TODAY
    ? { title: t('Nothing was on'), body: t('A clear day. Nothing needed you.') }
    : { title: t('Nothing on yet'), body: t("I'll keep it clear unless something lands that needs you.") }

export const peekFor = (iso: string) => {
  for (let i = 1; i <= 60; i++) {
    const date = addDays(iso, i)
    const list = eventsFor(date)
    if (list.length > 0) {
      return {
        date,
        title: dayLabel(date),
        sub: t('{events} · first at {time}', {
          events: plural(list.length, { one: '{n} event', other: '{n} events' }),
          time: list[0].time,
        }),
      }
    }
  }
  return null
}
