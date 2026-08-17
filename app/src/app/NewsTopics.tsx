import { useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconPlus } from './icons'
import { Switch } from '../shell/Switch'
import { useTopics, toggleTopic, addTopic } from '../data/news'
import { t } from '../i18n'
import { toast } from '../shell/toast'
import './news.css'

export const NewsTopics = () => {
  const topics = useTopics()
  const [draft, setDraft] = useState('')

  const add = () => {
    const name = draft.trim()
    if (name.length < 2) return
    addTopic(name)
    setDraft('')
    toast(t('Now following {topic}.', { topic: name }), 'check')
  }

  return (
    <SubScreen title={t('Topics')} back="news" className="wg-news" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>{t('These decide what rides your morning brief. Anything you turn off goes quiet, and I can always add one you name.')}</p>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Following')}</h2>
      </div>
      <div className="wg-options">
        {topics.map((tp) => (
          <button
            key={tp.key}
            className={`wg-option wg-card-line wg-option--switch ${tp.followed ? 'on' : ''}`}
            onClick={() => toggleTopic(tp.key)}
          >
            <span className={`ic ${tp.tone}`}>
              <Icon name={tp.icon} size={20} variant="duotone" />
            </span>
            <span className="tx">
              <strong>{t(tp.name)}</strong>
              <span>{t(tp.blurb)}</span>
            </span>
            <Switch on={tp.followed} />
          </button>
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Add a topic')}</h2>
      </div>
      <div className="wg-field wg-news-add">
        <input
          placeholder={t('A company, a team, a subject')}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <button className="wg-news-add__btn" aria-label={t('Add')} onClick={add} disabled={draft.trim().length < 2}>
          <IconPlus size={18} />
        </button>
      </div>

      <p className="wg-footnote">{t('I read public news only. I never follow anything private to you without you connecting it first.')}</p>
    </SubScreen>
  )
}
