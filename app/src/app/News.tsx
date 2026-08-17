import { SubScreen } from './SubScreen'
import { Icon, IconSpark, IconWhatsapp, IconChevronR } from './icons'
import {
  useBrief,
  useForYouCount,
  useFollowedTopics,
  useNewsPrefs,
  isRead,
  type Story,
} from '../data/news'
import { formatTime } from '../onboarding/shared'
import { t } from '../i18n'
import { navigate } from '../shell/nav'
import { openWhatsApp } from '../shell/whatsapp'
import { topicByKey } from '../data/news'
import './news.css'

export const NewsRow = ({ story }: { story: Story }) => {
  const topic = topicByKey(story.topic)
  const read = isRead(story.id)
  return (
    <button className={`wg-nrow ${read ? 'read' : ''}`} onClick={() => navigate(`news/${story.id}`)}>
      <span className={`wg-chip ${topic?.tone ?? 'blue'} sm`}>
        <Icon name={topic?.icon ?? 'globe'} size={18} variant="duotone" />
      </span>
      <span className="wg-nrow__tx">
        <span className="wg-nrow__head">{t(story.headline)}</span>
        <span className="wg-nrow__meta">
          {t(story.source)} &middot; {t(story.time)}
        </span>
        {story.forYou && (
          <span className="wg-nrow__tag">
            <IconSpark size={12} /> {t(story.forYou)}
          </span>
        )}
      </span>
      <IconChevronR size={18} className="chev" />
    </button>
  )
}

export const News = () => {
  const brief = useBrief()
  const forYou = useForYouCount()
  const followed = useFollowedTopics()
  const prefs = useNewsPrefs()

  const settings = (
    <button
      className="wg-subbar__act"
      data-feedback="header"
      aria-label={t('News settings')}
      onClick={() => navigate('news/settings')}
    >
      <Icon name="clock" size={18} variant="duotone" />
    </button>
  )

  return (
    <SubScreen title={t('News')} back="home" action={settings} className="wg-news">
      <div className="wg-mod__hero wg-card-line">
        <span className="wg-mod__tx">
          <span className="wg-mod__val">{t('{n} in your brief', { n: brief.length })}</span>
          <span className="wg-mod__sub">
            {forYou > 0
              ? t('{n} touch your day today', { n: forYou })
              : t('Nothing urgent, all quiet')}
          </span>
        </span>
        <span className="wg-chip blue lg">
          <Icon name="news" size={24} variant="duotone" />
        </span>
      </div>

      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {t(
            'I read the morning across your topics and kept the few that matter. Your brief lands on WhatsApp at {time}.',
            { time: formatTime(prefs.deliver) },
          )}
        </span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('Your morning brief')}</h2>
      </div>
      <div className="wg-nlist">
        {brief.map((s) => (
          <NewsRow key={s.id} story={s} />
        ))}
      </div>

      <div className="wg-panel-head">
        <h2>{t('Following')}</h2>
        <span>{t('{n} topics', { n: followed.length })}</span>
      </div>
      <button className="wg-topics" data-feedback="header" onClick={() => navigate('news/topics')}>
        <div className="wg-topics__chips">
          {followed.map((tp) => (
            <span key={tp.key} className={`wg-tchip ${tp.tone}`}>
              <Icon name={tp.icon} size={13} variant="duotone" />
              {t(tp.name)}
            </span>
          ))}
        </div>
        <div className="wg-topics__edit">
          {t('Edit topics')} <IconChevronR size={16} className="chev" />
        </div>
      </button>

      <button
        className="wg-mod__ask wg-btn full wa"
        data-feedback="quiet"
        onClick={() => openWhatsApp(t('What is in the news for me today?'))}
      >
        <IconWhatsapp size={18} /> {t('Ask Wingman about the news')}
      </button>
    </SubScreen>
  )
}

export const NewsWidget = () => {
  const brief = useBrief()
  const forYou = useForYouCount()
  if (brief.length === 0) return null
  return (
    <button className="wg-news-lead wg-card-line" data-feedback="header" onClick={() => navigate('news')}>
      <div className="wg-news-lead__top">
        <span className="wg-chip blue lg">
          <Icon name="news" size={24} variant="duotone" />
        </span>
        <span className="wg-news-lead__tx">
          <strong>{t('In the news')}</strong>
          <span>
            {forYou > 0
              ? t('{n} stories touch your day', { n: forYou })
              : t('{n} in your morning brief', { n: brief.length })}
          </span>
        </span>
        <IconChevronR size={18} className="chev" />
      </div>
      <div className="wg-news-lead__heads">
        {brief.slice(0, 2).map((s) => (
          <div className="wg-news-lead__line" key={s.id}>
            <i />
            <span>{t(s.headline)}</span>
          </div>
        ))}
      </div>
    </button>
  )
}
