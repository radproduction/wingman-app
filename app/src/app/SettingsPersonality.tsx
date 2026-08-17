import { useLayoutEffect, useRef } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconCheck, IconSpark } from './icons'
import { SKILL_ICONS, SKILL_TONES } from './agent'
import { PROACTIVITY, SKILLS, TONES, VOICE_PREVIEW } from '../onboarding/shared'
import { useAgent, setAgent, toggleSkill } from '../data/agentSettings'
import { t } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import { Switch } from '../shell/Switch'
import './app.css'

export type PersonalitySection = 'proactivity' | 'skills'

export const SettingsPersonality = ({ section }: { section?: PersonalitySection }) => {
  const { tone, detail, proactivity, skills } = useAgent()

  const target = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const head = target.current
    const track = head?.closest('.wg-panel__scroll')
    if (!head || !track) return

    let placed = -1
    const snap = () => {
      if (placed >= 0 && Math.abs(track.scrollTop - placed) > 1) return
      const fade = parseFloat(getComputedStyle(track).paddingTop) || 0
      track.scrollTop += head.getBoundingClientRect().top - track.getBoundingClientRect().top - fade
      placed = track.scrollTop
    }

    snap()
    const frame = requestAnimationFrame(snap)
    document.fonts?.ready.then(snap)
    return () => cancelAnimationFrame(frame)
  }, [section])

  const pick = <K extends 'tone' | 'detail' | 'proactivity'>(key: K, value: string) => () => {
    tapQuiet()
    setAgent({ [key]: value })
  }

  const flipSkill = (name: string) => {
    tapQuiet()
    toggleSkill(name)
  }

  return (
    <SubScreen title="Agent personality" back="more" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {t("How I sound, and how often I speak up. Change any of it and I'll use it from your next message.")}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Tone')}</h2>
      </div>
      <div className="wg-options">
        {TONES.map((tn) => (
          <button
            key={tn.value}
            className={`wg-option wg-card-line ${tone === tn.value ? 'on' : ''}`}
            onClick={pick('tone', tn.value)}
          >
            <span className="tx">
              <strong>{t(tn.value)}</strong>
              <span>{t(tn.blurb)}</span>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Detail')}</h2>
      </div>
      <div className="wg-seg">
        {(['Concise', 'Detailed'] as const).map((d) => (
          <button key={d} className={detail === d ? 'on' : ''} onClick={pick('detail', d)}>
            {t(d)}
          </button>
        ))}
      </div>
      <div className="wg-preview wg-card-line">
        <div className="cap">{t("How I'll sound")}</div>
        <p>{t(VOICE_PREVIEW[`${tone}|${detail}`])}</p>
      </div>

      <div className="wg-panel-head" ref={section === 'proactivity' ? target : undefined}>
        <h2>{t('Proactivity')}</h2>
      </div>
      <div className="wg-options">
        {PROACTIVITY.map((p) => (
          <button
            key={p.value}
            className={`wg-option wg-card-line ${proactivity === p.value ? 'on' : ''}`}
            onClick={pick('proactivity', p.value)}
          >
            <span className="tx">
              <strong>{t(p.value)}</strong>
              <span>{t(p.blurbA)}</span>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head" ref={section === 'skills' ? target : undefined}>
        <h2>{t('Skills')}</h2>
        <span>{t('{on} of {total} on', { on: skills.length, total: SKILLS.length })}</span>
      </div>
      <div className="wg-options">
        {SKILLS.map((s) => (
          <button
            key={s.name}
            className={`wg-option wg-card-line wg-option--switch ${skills.includes(s.name) ? 'on' : ''}`}
            onClick={() => flipSkill(s.name)}
          >
            <span className={`ic ${SKILL_TONES[s.name]}`}>
              <Icon name={SKILL_ICONS[s.name]} size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>{t(s.name)}</strong>
              <span>{t(s.blurb)}</span>
            </span>
            <Switch on={skills.includes(s.name)} />
          </button>
        ))}
      </div>
    </SubScreen>
  )
}
