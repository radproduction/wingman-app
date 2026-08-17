import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconWhatsapp, IconCheck } from './icons'
import { meetingById } from '../data/meetings'
import { t } from '../i18n'
import { goBack } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import './app.css'
import './business.css'

export const MeetingBrief = ({ id }: { id: string }) => {
  const m = meetingById(id)
  if (!m) {
    goBack('meetings')
    return null
  }
  const brief = m.brief

  if (!brief) {
    return (
      <SubScreen title="Meeting brief" back={`meetings/${id}`} className="wg-mod" feedback="header">
        <div className="wg-bc__summary wg-card-line">
          <IconSpark size={18} />
          <p>{t("I haven't prepared this brief yet. When you're ready, I'll review everything below and write it up.")}</p>
        </div>
        <div className="wg-panel-head">
          <h2>{t("What I'll review")}</h2>
        </div>
        <ul className="wg-mcontext wg-card-line">
          {m.context.map((c) => (
            <li key={c}>
              <IconCheck size={16} />
              {t(c)}
            </li>
          ))}
        </ul>
        <button
          className="wg-btn full"
          style={{ marginTop: 'var(--space-8)' }}
          onClick={() => toast(t("I'm preparing your brief. I'll message you the moment it's ready."), 'spark')}
        >
          {t('Prepare the brief')}
        </button>
      </SubScreen>
    )
  }

  return (
    <SubScreen
      title="Meeting brief"
      back={`meetings/${id}`}
      className="wg-mod"
      feedback="header"
      action={
        <button className="wg-subbar__act" onClick={() => toast(t('Brief opened for editing.'), 'spark')}>
          {t('Edit')}
        </button>
      }
      footer={
        <div style={{ display: 'flex', gap: 'var(--space-12)' }}>
          <button className="wg-btn full outline" onClick={() => toast(t('Brief marked ready.'), 'check')}>
            {t('Mark ready')}
          </button>
          <button
            className="wg-btn full wa"
            onClick={() => openWhatsApp(t('Send me the brief for: {title}', { title: m.title }))}
          >
            <IconWhatsapp size={18} /> {t('To WhatsApp')}
          </button>
        </div>
      }
    >
      <div className="wg-brief-obj">
        <span className="cap">
          <IconSpark size={13} /> {t('Objective')}
        </span>
        <p>{t(brief.objective)}</p>
      </div>

      {brief.sections.map((s) => (
        <div className="wg-brief-sec wg-card-line" key={s.key}>
          <div className="wg-brief-sec__head">
            <h3>{t(s.title)}</h3>
            <button
              className="wg-brief-sec__expand"
              onClick={() => toast(t('Expanding {section}.', { section: s.title }), 'spark')}
            >
              {t('Expand')}
            </button>
          </div>
          {s.body && <p>{t(s.body)}</p>}
          {s.items && (
            <ul>
              {s.items.map((it) => (
                <li key={it}>{t(it)}</li>
              ))}
            </ul>
          )}
        </div>
      ))}

      {brief.files && brief.files.length > 0 && (
        <>
          <div className="wg-panel-head">
            <h2>{t('Files and references')}</h2>
          </div>
          <div className="wg-brief-files">
            {brief.files.map((f) => (
              <div className="wg-brief-file wg-card-line" key={f.name}>
                <Icon name="receipt" size={18} variant="duotone" />
                {f.name}
                <small>{t(f.from)}</small>
              </div>
            ))}
          </div>
        </>
      )}
    </SubScreen>
  )
}
