import { useEffect } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconWhatsapp, IconCheck } from './icons'
import { storyById, topicByKey, markRead, isSaved, toggleSaved, useSaved } from '../data/news'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { toast } from '../shell/toast'
import './news.css'

export const NewsStory = ({ id }: { id: string }) => {
  const story = storyById(id)
  const saved = useSaved()

  useEffect(() => {
    if (story) markRead(story.id)
  }, [story])

  if (!story) {
    navigate('news')
    return null
  }

  const topic = topicByKey(story.topic)
  const isS = !!saved[story.id] || isSaved(story.id)

  const save = (
    <button
      className="wg-subbar__act"
      data-feedback="header"
      aria-label={isS ? t('Saved') : t('Save for later')}
      onClick={() => {
        toggleSaved(story.id)
        toast(isS ? t('Removed from saved.') : t('Saved to read later.'), 'check')
      }}
    >
      <Icon name={isS ? 'checkCircle' : 'download'} size={18} variant={isS ? 'solid' : 'duotone'} />
    </button>
  )

  return (
    <SubScreen title={topic ? t(topic.name) : t('Story')} back="news" action={save} className="wg-news">
      <div className="wg-story__head">
        <span className={`wg-tchip ${topic?.tone ?? 'blue'}`}>
          <Icon name={topic?.icon ?? 'globe'} size={13} variant="duotone" />
          {topic ? t(topic.name) : t('News')}
        </span>
        <h1>{t(story.headline)}</h1>
        <div className="wg-story__meta">
          {t(story.source)} &middot; {t(story.time)}
        </div>
      </div>

      {story.forYou && (
        <div className="wg-brief-line">
          <IconSpark size={16} />
          <span>{t(story.forYou)}</span>
        </div>
      )}

      <div className="wg-panel-head">
        <h2>{t('The brief')}</h2>
      </div>
      <p className="wg-story__body">{t(story.summary)}</p>

      <div className="wg-panel-head">
        <h2>{t("Why it's in your brief")}</h2>
      </div>
      <p className="wg-story__body wg-story__why">{t(story.why)}</p>

      <div className="wg-panel-head">
        <h2>{t("What's under it")}</h2>
      </div>
      <div className="wg-story__points">
        {story.points.map((p) => (
          <div className="wg-story__point" key={p}>
            <IconCheck size={14} />
            <span>{t(p)}</span>
          </div>
        ))}
      </div>

      <button
        className="wg-mod__ask wg-btn full wa"
        data-feedback="quiet"
        onClick={() => openWhatsApp(t('Tell me more about: {headline}', { headline: story.headline }))}
      >
        <IconWhatsapp size={18} /> {t('Ask Wingman about this')}
      </button>
    </SubScreen>
  )
}
