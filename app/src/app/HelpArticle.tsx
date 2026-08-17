import { SubScreen } from './SubScreen'
import { Icon, IconChat } from './icons'
import { helpArticle as helpArticleSeed } from '../data/mock'
import { localize, t } from '../i18n'
import { openWhatsApp } from '../shell/whatsapp'
import './app.css'

export const HelpArticle = ({ id }: { id: string }) => {
  const seed = helpArticleSeed(id)
  if (!seed) return null
  const a = localize(seed)

  return (
    <SubScreen title="Help" back="settings/help" className="wg-settings">
      <div className="wg-article wg-card-line">
        <span className={`wg-chip ${a.tone} sm`}>
          <Icon name={a.icon} size={20} variant="duotone" />
        </span>
        <h2>{a.q}</h2>
        {a.body.map((p) => (
          <p key={p.slice(0, 24)}>{p}</p>
        ))}
      </div>

      {a.list && (
        <div className="wg-set-list wg-card-line wg-article__list">
          {a.list.map((l) => (
            <div className="wg-artrow" key={l.name}>
              <strong>{l.name}</strong>
              <span>{l.desc}</span>
            </div>
          ))}
        </div>
      )}

      <button className="wg-mod__ask wg-btn full wa" onClick={() => openWhatsApp(a.ask)}>
        <IconChat size={18} /> {t('Still need me? Ask on WhatsApp')}
      </button>
    </SubScreen>
  )
}
