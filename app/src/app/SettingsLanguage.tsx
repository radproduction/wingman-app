import { SubScreen } from './SubScreen'
import { IconCheck, IconSpark } from './icons'
import { flagFor } from './flags'
import { LANGUAGES, useAgent, type LanguageCode } from '../data/agentSettings'
import { setLanguage, t } from '../i18n'
import { tapQuiet } from '../shell/feedback'
import './app.css'

export const SettingsLanguage = () => {
  const { language } = useAgent()

  const pick = (code: LanguageCode) => () => {
    tapQuiet()
    setLanguage(code)
  }

  return (
    <SubScreen title="Language" back="more" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {t(
            'The language I write to you in, here and on WhatsApp. Change it and the app follows straight away.',
          )}
        </span>
      </div>

      <div className="wg-options">
        {LANGUAGES.map((l) => (
          <button key={l.code} className={`wg-option wg-card-line ${language === l.code ? 'on' : ''}`} onClick={pick(l.code)}>
            <span className="wg-flag">
              <img src={flagFor(l.code)} alt="" />
            </span>
            <span className="tx">
              <strong className="wg-lang" lang={l.code}>
                {l.native}
              </strong>
              <span>{t(l.name)}</span>
            </span>
            <span className="mark">
              <IconCheck size={14} />
            </span>
          </button>
        ))}
      </div>
    </SubScreen>
  )
}
