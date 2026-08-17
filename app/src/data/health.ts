import type { ChipTone } from './mock'
import type { IconName } from '../app/icons'


export type HealthMetric = {
  key: string
  name: string
  icon: IconName
  tone: ChipTone
  value: string
  unit: string
  trend: string
  read: string
  series: number[]
  good?: boolean
}

export type HealthAdjustment = {
  icon: IconName
  tone: ChipTone
  title: string
  body: string
}

export const healthLive = {
  hero: {
    value: 'Recovered, steady',
    sub: '7h 10m sleep, HRV back to normal',
  },
  brief:
    "You're in good shape today. I've kept the morning gentle and I'll only bring up anything that would push against how you're recovering.",

  metrics: [
    {
      key: 'sleep',
      name: 'Sleep',
      icon: 'moon',
      tone: 'lavender',
      value: '7h 10m',
      unit: 'last night',
      trend: '20 min under your week, but a steadier bedtime',
      read: "Enough to run a normal day on. Your bedtime held within half an hour all week, which matters more than the total.",
      series: [0.62, 0.55, 0.7, 0.48, 0.66, 0.6, 0.72],
      good: true,
    },
    {
      key: 'recovery',
      name: 'Recovery',
      icon: 'heart',
      tone: 'rose',
      value: '58 ms',
      unit: 'HRV overnight',
      trend: 'Back to your normal after two low days',
      read: "Your HRV recovered, so I'm treating today as a full-strength one. No reason to hold anything back.",
      series: [0.7, 0.5, 0.34, 0.4, 0.52, 0.66, 0.78],
      good: true,
    },
    {
      key: 'movement',
      name: 'Movement',
      icon: 'activity',
      tone: 'peach',
      value: '2,140',
      unit: 'steps by 2pm',
      trend: 'Behind your usual - a long desk stretch since the 9:30',
      read: "You've been at the desk a while. I've left a gap at 3:30 in case you want to walk the Clifton call.",
      series: [0.8, 0.72, 0.9, 0.6, 0.4, 0.5, 0.3],
    },
  ] as HealthMetric[],

  adjustments: [
    {
      icon: 'sun',
      tone: 'peach',
      title: 'Kept your morning light',
      body: 'You slept a little short, so I held the two low-stakes emails for the afternoon and left the 9:30 as your only hard start.',
    },
    {
      icon: 'activity',
      tone: 'mint',
      title: 'Left room to walk the 3:30',
      body: "You've been sitting since the 9:30. The Clifton call can be a walking one - I kept the half hour before it clear.",
    },
    {
      icon: 'moon',
      tone: 'lavender',
      title: 'A gentle wind-down tonight',
      body: 'To hold your bedtime steady, I’ll nudge you off email around 9:30 PM. Say the word and I’ll drop it.',
    },
  ] as HealthAdjustment[],

  week: {
    label: 'Sleep this week',
    days: [
      { day: 'W', hours: 6.4 },
      { day: 'T', hours: 7.8 },
      { day: 'F', hours: 5.9 },
      { day: 'S', hours: 8.1 },
      { day: 'S', hours: 7.2 },
      { day: 'M', hours: 6.8 },
      { day: 'T', hours: 7.1 },
    ],
    goal: 7.5,
    note: 'Four of seven nights near your target. The steadiness is the win.',
  },

  promise: 'I read this to shape your day, never to grade it. It stays out of anything I send for you, and you can disconnect it in one tap.',
}
