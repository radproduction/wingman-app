import { SetRow, SubScreen } from './SubScreen'
import { Icon, IconSpark } from './icons'
import { privacy as privacySeed } from '../data/mock'
import { useAgent, toggleAccess } from '../data/agentSettings'
import { forgetAll, useNoteCount } from '../data/memory'
import { localize, t, tx } from '../i18n'
import { confirmAction } from '../shell/confirm'
import { toast } from '../shell/toast'
import { tapQuiet } from '../shell/feedback'
import { Switch } from '../shell/Switch'
import './app.css'

export const SettingsPrivacy = () => {
  const { access: on, autonomy } = useAgent()
  const notes = useNoteCount()
  const privacy = localize(privacySeed)

  const toggle = (key: string) => {
    tapQuiet()
    toggleAccess(key)
  }

  const clearMemory = async () => {
    tapQuiet()
    const ok = await confirmAction({
      title: t('Clear everything I remember?'),
      body: t(
        "All {n} notes go, including how you like things written and when you want me quiet. I'll keep working, I'll just be starting from nothing again.",
        { n: notes },
      ),
      confirmLabel: t('Clear it all'),
      destructive: true,
    })
    if (!ok) return
    forgetAll()
    toast(t("Cleared. I'll learn you again from here."), 'check')
  }

  return (
    <SubScreen title="Permissions & privacy" back="more" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {tx('You decide what I can see and what I can do. {on} of {total} data sources are on, and I never act without asking beyond what you set.', {
            on: <b>{on.length}</b>,
            total: privacy.access.length,
          })}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('What I can do')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <SetRow icon="checkCircle" tone="blue" name="Permissions" value={t(autonomy)} to="settings/permissions" />
      </div>

      <div className="wg-panel-head">
        <h2>{t('What I can see')}</h2>
      </div>
      <div className="wg-options">
        {privacy.access.map((p) => (
          <button
            key={p.key}
            className={`wg-option wg-card-line wg-option--switch ${on.includes(p.key) ? 'on' : ''}`}
            onClick={() => toggle(p.key)}
          >
            <span className={`ic ${p.tone}`}>
              <Icon name={p.icon} size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>{p.name}</strong>
              <span>{p.desc}</span>
            </span>
            <Switch on={on.includes(p.key)} />
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Memory')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        {}
        <SetRow
          icon="spark"
          tone="lavender"
          name="What I remember"
          value={t('{n} notes', { n: notes })}
          to="settings/memory"
        />
        <SetRow icon="trash" tone="rose" name="Clear my memory" onTap={clearMemory} inPlace warn />
      </div>

      <div className="wg-panel-head">
        <h2>{t('Your data')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <SetRow icon="download" tone="blue" name="Download a copy" />
        <SetRow icon="shield" tone="mint" name="Privacy policy" />
        <SetRow icon="trash" tone="rose" name="Delete my account" warn />
      </div>

      <p className="wg-footnote">
        {t('Your data is used to run Wingman for you, nothing else. It is never sold, and never used to train models.')}
      </p>
    </SubScreen>
  )
}
