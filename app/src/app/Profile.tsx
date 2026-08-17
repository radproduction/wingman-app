import { SetRow, SubScreen } from './SubScreen'
import { Icon, IconCheckCircle, IconSpark } from './icons'
import { useAgent } from '../data/agentSettings'
import { useProfile } from '../data/store'
import { t } from '../i18n'
import { confirmSignOut } from './SignIn'
import avatarUrl from '../assets/avatar.jpg'
import './app.css'

export const Profile = () => {
  const profile = useProfile()
  const agent = useAgent()
  return (
  <SubScreen title="Account settings" back="more" className="wg-profile">
    <div className="wg-prof">
      <span className="wg-prof__ava">
        <img src={avatarUrl} alt="" />
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
