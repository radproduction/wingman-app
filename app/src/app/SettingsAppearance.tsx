import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { ModRow } from './ModuleScreen'
import { Icon, IconCheck, IconSpark } from './icons'
import { moduleHeads } from '../data/mock'
import { t } from '../i18n'
import { tapHeader } from '../shell/feedback'
import { getPrefs, motionReduced, setPref, TEXT_SIZES, type Density, type TextSize, type Theme } from '../shell/prefs'
import { APP_ICONS, appIconUri, type AppIconKey } from '../shell/appIcon'
import { Switch } from '../shell/Switch'
import './app.css'

const TEXT_LABELS: Record<TextSize, string> = {
  small: 'Small',
  default: 'Default',
  large: 'Large',
}

const THEMES: { value: Theme; name: string }[] = [
  { value: 'system', name: 'System' },
  { value: 'light', name: 'Light' },
  { value: 'dark', name: 'Dark' },
]

const HomeMock = () => (
  <svg className="wg-theme__mock" viewBox="0 0 100 160" preserveAspectRatio="none" aria-hidden="true">
    <rect width="100" height="160" fill="var(--m-bg)" />

    {}
    <circle cx="12" cy="13" r="4.5" fill="var(--m-block)" />
    <rect x="45" y="11" width="10" height="4" rx="2" fill="var(--m-block)" />
    <circle cx="80" cy="13" r="4.5" fill="var(--m-block)" />
    <circle cx="91" cy="13" r="4.5" fill="var(--m-block)" />

    {}
    <circle cx="29" cy="62" r="14" fill="none" stroke="var(--m-track)" strokeWidth="6" />
    <circle
      cx="29"
      cy="62"
      r="14"
      fill="none"
      stroke="var(--m-accent)"
      strokeWidth="6"
      strokeLinecap="round"
      strokeDasharray="88"
      strokeDashoffset="31"
      transform="rotate(-90 29 62)"
    />

    {}
    {[47, 58, 69].map((y) => (
      <g key={y}>
        <rect x="51" y={y} width="40" height="9" rx="4.5" fill="var(--m-block)" />
        <rect x="51" y={y} width="15" height="9" rx="4.5" fill="var(--m-accent-soft)" />
      </g>
    ))}

    {}
    <rect x="0" y="88" width="100" height="80" rx="9" fill="var(--m-panel)" />
    <rect x="7" y="95" width="86" height="32" rx="7" fill="var(--m-card)" />
    <rect x="13" y="101" width="20" height="5" rx="2.5" fill="var(--m-accent-soft)" />
    <rect x="13" y="110" width="58" height="4" rx="2" fill="var(--m-strong)" />
    <rect x="13" y="117" width="42" height="3" rx="1.5" fill="var(--m-block)" />

    <rect x="8" y="133" width="26" height="4" rx="2" fill="var(--m-strong)" />
    {[7, 52].map((x) => (
      <g key={x}>
        <rect x={x} y="141" width="41" height="24" rx="7" fill="var(--m-card)" />
        <circle cx={x + 9} cy="150" r="4" fill="var(--m-accent-soft)" />
        <rect x={x + 5} y="158" width="22" height="3" rx="1.5" fill="var(--m-block)" />
      </g>
    ))}
  </svg>
)

const SAMPLE = moduleHeads.slice(0, 2)

export const SettingsAppearance = () => {
  const saved = getPrefs()
  const [theme, setTheme] = useState<Theme>(saved.theme)
  const [text, setText] = useState<TextSize>(saved.text)
  const [density, setDensity] = useState<Density>(saved.density)
  const [taps, setTaps] = useState(saved.taps)
  const [motion, setMotion] = useState(motionReduced())
  const [icon, setIcon] = useState<AppIconKey>(saved.icon)
  const step = Math.max(0, TEXT_SIZES.indexOf(text))

  const pickTheme = (value: Theme) => () => {
    setPref('theme', value)
    setTheme(value)
  }

  const pickIcon = (value: AppIconKey) => () => {
    setPref('icon', value)
    setIcon(value)
  }

  const pickText = (value: TextSize) => {
    setPref('text', value)
    setText(value)
    tapHeader()
  }

  const pickDensity = (value: Density) => () => {
    setPref('density', value)
    setDensity(value)
  }

  const toggleTaps = () => {
    const next = !taps
    setPref('taps', next)
    setTaps(next)
    if (next) tapHeader()
  }

  const toggleMotion = () => {
    setPref('motion', motion ? 'full' : 'reduced')
    setMotion(!motion)
  }

  return (
    <SubScreen title="Theme & appearance" back="more" className="wg-settings" feedback="header">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>{t('How the app looks on this phone. None of this changes what I do for you.')}</span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Theme')}</h2>
      </div>
      {}
      <div className="wg-themes">
        {THEMES.map((th) => (
          <button key={th.value} className={`wg-theme ${theme === th.value ? 'on' : ''}`} onClick={pickTheme(th.value)}>
            <span className="wg-theme__frame">
              <span className={`wg-theme__face ${th.value === 'dark' ? 'dark' : ''}`}>
                <HomeMock />
              </span>
              {th.value === 'system' && (
                <span className="wg-theme__face dark half">
                  <HomeMock />
                </span>
              )}
            </span>
            <span className="mark">
              <IconCheck size={13} />
            </span>
            <span className="wg-theme__name">{t(th.name)}</span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('App icon')}</h2>
      </div>
      {}
      <div className="wg-icons">
        {APP_ICONS.map((face) => (
          <button
            key={face.key}
            className={`wg-icon ${icon === face.key ? 'on' : ''}`}
            onClick={pickIcon(face.key)}
            aria-pressed={icon === face.key}
          >
            <img className="wg-icon__art" src={appIconUri(face.key)} alt="" />
            <span className="mark">
              <IconCheck size={13} />
            </span>
            <span className="wg-icon__name">{t(face.name)}</span>
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Lists')}</h2>
        <span>{t('Email, Tasks and more')}</span>
      </div>

      <div className="wg-cap">{t('Text size')}</div>
      {}
      <div className="wg-slider">
        <span className="wg-slider__a">A</span>
        <span className="wg-slider__rail">
          <span className="wg-slider__bar" style={{ ['--pos' as string]: step / (TEXT_SIZES.length - 1) }} />
          <input
            type="range"
            min={0}
            max={TEXT_SIZES.length - 1}
            step={1}
            value={step}
            onChange={(e) => pickText(TEXT_SIZES[Number(e.target.value)])}
            aria-label={t('Text size')}
            aria-valuetext={t(TEXT_LABELS[text])}
          />
          <span className="wg-slider__dots" aria-hidden="true">
            {TEXT_SIZES.map((s) => (
              <i key={s} />
            ))}
          </span>
        </span>
        <span className="wg-slider__a lg">A</span>
      </div>

      <div className="wg-cap">{t('Density')}</div>
      <div className="wg-seg">
        {(
          [
            ['comfortable', 'Comfortable'],
            ['compact', 'Compact'],
          ] as const
        ).map(([value, label]) => (
          <button key={value} className={density === value ? 'on' : ''} onClick={pickDensity(value)}>
            {t(label)}
          </button>
        ))}
      </div>

      <div className="wg-cap">{t('Preview')}</div>
      <div className="wg-row-list">
        {SAMPLE.map((m) => (
          <ModRow key={m.key} tone={m.tone} icon={m.icon} name={m.title} meta={m.sub} />
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Sound and motion')}</h2>
      </div>
      <div className="wg-options">
        <button className={`wg-option wg-card-line wg-option--switch ${taps ? 'on' : ''}`} onClick={toggleTaps}>
          <span className="ic mint">
            <Icon name="volume" size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>{t('Tap feedback')}</strong>
            <span>{t('A quiet tick and a small buzz when you tap.')}</span>
          </span>
          <Switch on={taps} />
        </button>

        <button className={`wg-option wg-card-line wg-option--switch ${motion ? 'on' : ''}`} onClick={toggleMotion}>
          <span className="ic lavender">
            <Icon name="motion" size={20} variant="duotone" />
          </span>
          <span className="tx">
            <strong>{t('Reduce motion')}</strong>
            <span>{t('Fewer slides and fades when screens change.')}</span>
          </span>
          <Switch on={motion} />
        </button>
      </div>
    </SubScreen>
  )
}
