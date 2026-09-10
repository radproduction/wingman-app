import { useEffect, useRef, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon } from './icons'
import { api, type AssistantCard, type AssistantMessage } from '../data/api'
import { t } from '../i18n'
import './AssistantChat.css'

type Msg = AssistantMessage & { cards?: AssistantCard[]; pending?: boolean; failed?: boolean }

const domainOf = (url: string) => {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const BrowserCard = ({ card }: { card: AssistantCard }) => (
  <div className="wg-chat__card">
    <div className="wg-chat__card-head">
      <span className="wg-chat__card-globe">
        <Icon name="globe" size={14} variant="duotone" />
      </span>
      <div className="wg-chat__card-tx">
        <div className="wg-chat__card-title">{card.title || domainOf(card.url)}</div>
        <div className="wg-chat__card-url">
          {domainOf(card.url)}
          {card.loggedIn ? ` · ${t('logged in')}` : ''}
        </div>
      </div>
    </div>
    {card.shot ? (
      <a href={card.url} target="_blank" rel="noreferrer" className="wg-chat__card-shot">
        <img src={card.shot} alt={card.title || domainOf(card.url)} loading="lazy" />
      </a>
    ) : null}
    <a href={card.url} target="_blank" rel="noreferrer" className="wg-chat__card-open">
      {t('Open in browser')}
    </a>
  </div>
)

export const AssistantChat = () => {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    api
      .assistantHistory()
      .then((r) => {
        if (alive) setMsgs(r.messages || [])
      })
      .catch(() => {
        /* empty history is fine */
      })
      .finally(() => {
        if (alive) setLoaded(true)
      })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, sending])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setSending(true)
    try {
      const r = await api.assistantChat(text)
      setMsgs((m) => [...m, { role: 'assistant', text: r.reply || t('Done ✅'), cards: r.cards }])
    } catch {
      setMsgs((m) => [
        ...m,
        { role: 'assistant', text: t('Sorry, I hit a snag — mind trying again?'), failed: true },
      ])
    } finally {
      setSending(false)
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <SubScreen
      title="Wingman"
      back="more"
      className="wg-chat-screen"
      footer={
        <div className="wg-chat__bar">
          <input
            className="wg-chat__input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={t('Message Wingman… e.g. "open example.com"')}
            aria-label={t('Message Wingman')}
          />
          <button
            className="wg-chat__send"
            disabled={!input.trim() || sending}
            onClick={() => void send()}
            aria-label={t('Send')}
          >
            <Icon name="chevronRight" size={20} variant="solid" />
          </button>
        </div>
      }
    >
      <div className="wg-chat">
        {loaded && msgs.length === 0 && (
          <div className="wg-chat__empty">
            <p>{t('Talk to Wingman right here — same assistant as WhatsApp.')}</p>
            <p className="wg-chat__empty-hint">
              {t('Try: "open example.com and tell me what it says", or ask about your day.')}
            </p>
          </div>
        )}

        {msgs.map((m, i) => (
          <div key={i} className={`wg-chat__row ${m.role}`}>
            <div className={`wg-chat__bubble ${m.role} ${m.failed ? 'failed' : ''}`}>
              {m.text.split('\n').map((line, j) => (
                <span key={j}>
                  {line}
                  {j < m.text.split('\n').length - 1 ? <br /> : null}
                </span>
              ))}
            </div>
            {m.cards?.map((c, k) => (
              <BrowserCard card={c} key={k} />
            ))}
          </div>
        ))}

        {sending && (
          <div className="wg-chat__row assistant">
            <div className="wg-chat__bubble assistant wg-chat__typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>
    </SubScreen>
  )
}
