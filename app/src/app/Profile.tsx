import { useEffect, useState } from 'react'
import { SetRow, SubScreen } from './SubScreen'
import { Icon, IconCheckCircle, IconSpark } from './icons'
import { Avatar } from './Avatar'
import { useAgent } from '../data/agentSettings'
import { useProfile } from '../data/store'
import { t } from '../i18n'
import { confirmSignOut } from './SignIn'
import { api } from '../data/api'
import { Switch } from '../shell/Switch'
import { tapQuiet } from '../shell/feedback'
import { toast } from '../shell/toast'
import './app.css'

// "Voice briefing": Wingman calls on WhatsApp at the briefing/wrap times (when
// calling is live on the server) and sends the briefing as a voice note too.
const VoiceBriefing = () => {
  const [on, setOn] = useState<boolean | null>(null)
  const [calls, setCalls] = useState(false)
  useEffect(() => {
    api
      .me()
      .then((me) => {
        setOn(me.briefing_call === true)
        setCalls(me.briefing_calls_available === true)
      })
      .catch(() => setOn(false))
  }, [])
  const toggle = async () => {
    if (on === null) return
    tapQuiet()
    const next = !on
    setOn(next)
    try {
      await api.updateMe({ briefing_call: next })
      toast(next ? t(calls ? "I'll call you for your briefing and wrap." : 'Voice notes on for your briefing and wrap.') : t('Voice briefing off.'))
    } catch {
      setOn(!next)
      toast(t('Could not save. Try again.'))
    }
  }
  return (
    <div className="wg-options">
      <button className={`wg-option wg-card-line wg-option--switch ${on ? 'on' : ''}`} onClick={toggle} disabled={on === null}>
        <span className="ic peach">
          <Icon name="phone" size={20} variant="duotone" />
        </span>
        <span className="tx">
          <strong>{t('Voice briefing')}</strong>
          <span>
            {calls
              ? t("I'll call you on WhatsApp at your briefing and wrap times. Miss it and you get it as a message and a voice note.")
              : t('Your briefing and wrap come with a voice note too. WhatsApp calls are coming soon.')}
          </span>
        </span>
        <Switch on={!!on} />
      </button>
    </div>
  )
}

export const Profile = () => {
  const profile = useProfile()
  const agent = useAgent()
  return (
  <SubScreen title="Account settings" back="more" className="wg-profile">
    <div className="wg-prof">
      <span className="wg-prof__ava">
        <Avatar id={profile.name} src={profile.avatarUrl} />
      </span>
      <div className="wg-prof__name">{profile.name}</div>
      <div className="wg-prof__sub">{t(profile.workspace)}</div>
      {}
      <span className="wg-prof__verified">
        <IconCheckCircle size={14} /> {t('Verified on WhatsApp')}
      </span>
    </div>

    <div className="wg-brief-line">
      <IconSpark size={16} />
      <span>{t("This is what you told me at setup. Change anything and I'll work to it from your next briefing.")}</span>
    </div>

    <div className="wg-panel-head">
      <h2>{t('Your details')}</h2>
    </div>
    <div className="wg-set-list wg-card-line">
      <SetRow icon="user" tone="lavender" name="Name" value={profile.name} to="profile/name" />
      <SetRow icon="phone" tone="mint" name="WhatsApp" value={profile.phone} to="profile/phone" />
      <SetRow icon="mail" tone="blue" name="Email" value={profile.email} to="profile/email" />
      <SetRow icon="globe" tone="sand" name="Time zone" value={profile.timezone} to="profile/timezone" />
      <SetRow icon="clock" tone="mint" name="Workday" value={profile.workday} to="profile/workday" />
      <SetRow icon="sun" tone="peach" name="Morning briefing" value={profile.briefing} to="profile/briefing" />
      <SetRow icon="moon" tone="lavender" name="Evening wrap-up" value={profile.wrap} to="profile/wrap" />
    </div>

    <VoiceBriefing />

    <div className="wg-panel-head">
      <h2>{t('How I work with you')}</h2>
    </div>
    <div className="wg-set-list wg-card-line">
      <SetRow
        icon="spark"
        tone="lavender"
        name="Personality"
        value={`${t(agent.tone)} · ${t(agent.detail)}`}
        to="settings/personality"
      />
      {}
      <SetRow icon="bell" tone="blue" name="Proactivity" value={agent.proactivity} to="settings/personality/proactivity" />
      <SetRow
        icon="grid"
        tone="mint"
        name="Skills"
        value={`${agent.skills.length} on`}
        to="settings/personality/skills"
      />
    </div>

    <p className="wg-footnote">{t(profile.since)}</p>

    <button className="wg-signout wg-btn full danger" onClick={confirmSignOut}>
      <Icon name="logout" size={18} variant="duotone" />
      {t('Sign out')}
    </button>
  </SubScreen>
  )
}
