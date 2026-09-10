import { useEffect, useRef, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon } from './icons'
import {
  api,
  ApiError,
  type AssistantCard,
  type AssistantMessage,
  type LiveSession,
  type LiveAgentCard,
  type AgentStep,
} from '../data/api'
import { t } from '../i18n'
import './AssistantChat.css'

type AgentRun = { sessionId: string; liveViewUrl: string; goal: string; steps: AgentStep[]; result: string | null; status: string; done: boolean }

const ACTION_LABEL: Record<string, string> = {
  click: 'Clicking',
  type: 'Typing',
  scroll: 'Scrolling',
  navigate: 'Opening',
  done: 'Done',
  ask: 'Needs you',
}

type Msg = AssistantMessage & { cards?: AssistantCard[]; pending?: boolean; failed?: boolean }

const domainOf = (url: string) => {
  try {
    return new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

const LiveAgentCardView = ({ card, onWatch }: { card: LiveAgentCard; onWatch: (c: LiveAgentCard) => void }) => (
  <div className="wg-chat__card">
    <div className="wg-chat__card-head">
      <span className="wg-chat__card-globe live">
        <Icon name="globe" size={14} variant="duotone" />
      </span>
      <div className="wg-chat__card-tx">
        <div className="wg-chat__card-title">{t('Wingman is working on it…')}</div>
        <div className="wg-chat__card-url">{card.goal}</div>
      </div>
    </div>
    <div className="wg-chat__card-acts">
      <button className="wg-chat__card-live" onClick={() => onWatch(card)}>
        {t('Watch it work')}
      </button>
    </div>
  </div>
)

const BrowserCardView = ({ card, onWatchLive }: { card: Exclude<AssistantCard, LiveAgentCard>; onWatchLive: (url: string) => void }) => (
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
    <div className="wg-chat__card-acts">
      <button className="wg-chat__card-live" onClick={() => onWatchLive(card.url)}>
        {t('Watch live')}
      </button>
      <a href={card.url} target="_blank" rel="noreferrer" className="wg-chat__card-open">
        {t('Open in browser')}
      </a>
    </div>
  </div>
)

export const AssistantChat = () => {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [live, setLive] = useState<LiveSession | null>(null)
  const [liveBusy, setLiveBusy] = useState(false)
  const [liveErr, setLiveErr] = useState<string | null>(null)
  const [agent, setAgent] = useState<AgentRun | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  const watchAgent = (c: LiveAgentCard) =>
    setAgent({ sessionId: c.sessionId, liveViewUrl: c.liveViewUrl, goal: c.goal, steps: [], result: null, status: 'running', done: false })

  const stopAgent = () => {
    const a = agent
    setAgent(null)
    if (a) void api.browseStop(a.sessionId).catch(() => {})
  }

  const watchLive = async (url: string) => {
    if (liveBusy) return
    setLiveErr(null)
    setLiveBusy(true)
    try {
      const s = await api.browseLive(url)
      setLive(s)
    } catch (e) {
      const notConfigured = e instanceof ApiError && /NOT_CONFIGURED/.test(e.message)
      setLiveErr(
        notConfigured
          ? t('The live browser isn\'t switched on for this server yet.')
          : t('Could not start the live browser. Please try again.'),
      )
    } finally {
      setLiveBusy(false)
    }
  }

  const stopLive = () => {
    const s = live
    setLive(null)
    setLiveErr(null)
    if (s) void api.browseStop(s.sessionId).catch(() => {})
  }

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

  // Poll the live agent's progress while it works.
  useEffect(() => {
    if (!agent || agent.done) return
    const sid = agent.sessionId
    let alive = true
    const id = window.setInterval(async () => {
      try {
        const s = await api.browseAgentStatus(sid)
        if (!alive || !s.found) return
        setAgent((prev) =>
          prev && prev.sessionId === sid
            ? { ...prev, steps: s.steps || prev.steps, result: s.result ?? prev.result, status: s.status || prev.status, done: !!s.done }
            : prev,
        )
      } catch {
        /* keep polling */
      }
    }, 1500)
    return () => {
      alive = false
      window.clearInterval(id)
    }
  }, [agent?.sessionId, agent?.done])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    setMsgs((m) => [...m, { role: 'user', text }])
    setSending(true)
    try {
      const r = await api.assistantChat(text)
      setMsgs((m) => [...m, { role: 'assistant', text: r.reply || t('Done ✅'), cards: r.cards }])
      // If the agent kicked off a live task, open the watch-it-work view.
      const la = (r.cards || []).find((c) => c.type === 'live_agent') as LiveAgentCard | undefined
      if (la) watchAgent(la)
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
            {m.cards?.map((c, k) =>
              c.type === 'live_agent' ? (
                <LiveAgentCardView card={c} key={k} onWatch={watchAgent} />
              ) : (
                <BrowserCardView card={c} key={k} onWatchLive={watchLive} />
              ),
            )}
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

      {(live || liveBusy || liveErr) && (
        <div className="wg-lvb" role="dialog" aria-modal="true">
          <div className="wg-lvb__bar">
            <div className="wg-lvb__tx">
              <span className="wg-lvb__dot" />
              {live ? t('Live — you can take control') : liveErr ? t('Live browser') : t('Starting live browser…')}
            </div>
            <button className="wg-lvb__close" onClick={stopLive}>
              {t('Stop')}
            </button>
          </div>
          <div className="wg-lvb__body">
            {live ? (
              <iframe
                title="Live browser"
                src={live.liveViewUrl}
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                allow="clipboard-read; clipboard-write"
              />
            ) : liveErr ? (
              <div className="wg-lvb__msg">{liveErr}</div>
            ) : (
              <div className="wg-lvb__msg wg-chat__typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>
        </div>
      )}

      {agent && (
        <div className="wg-lvb" role="dialog" aria-modal="true">
          <div className="wg-lvb__bar">
            <div className="wg-lvb__tx">
              <span className="wg-lvb__dot" />
              {agent.done ? t('Finished — you can take control') : t('Wingman is working — take over anytime')}
            </div>
            <button className="wg-lvb__close" onClick={stopAgent}>
              {t('Stop')}
            </button>
          </div>
          <div className="wg-lvb__body">
            <iframe
              title="Live agent"
              src={agent.liveViewUrl}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
              allow="clipboard-read; clipboard-write"
            />
          </div>
          <div className="wg-lvb__log">
            {agent.result && <div className="wg-lvb__result">{agent.result}</div>}
            {[...agent.steps].reverse().slice(0, 4).map((s) => (
              <div className="wg-lvb__step" key={s.n}>
                <b>{t(ACTION_LABEL[s.action] || s.action)}</b>
                {s.detail ? ` — ${s.detail}` : ''}
              </div>
            ))}
            {!agent.done && agent.steps.length === 0 && <div className="wg-lvb__step">{t('Starting…')}</div>}
          </div>
        </div>
      )}
    </SubScreen>
  )
}
