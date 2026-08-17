import { useState } from 'react'
import { WingGlyph } from './WingGlyph'
import {
  COUNTRY_CODES,
  PROACTIVITY,
  SKILLS,
  TONES,
  ZONES,
  formatTime,
  useCodeBoxes,
  useOnboarding,
  useResendTimer,
  useSplashAdvance,
  useToast,
} from './shared'
import './morning-paper.css'

const PROGRESS: Record<string, string> = {
  phone: '12%', verify: '24%', name: '36%', tz: '48%',
  rhythm: '60%', proactivity: '72%', skills: '84%', personality: '94%',
}

export const MorningPaper = () => {
  const ob = useOnboarding()
  const { state, set, go, toggleSkill, connect, fullPhone, phoneValid, codeComplete, nameValid, preview } = ob
  const { msg, show, toast } = useToast()
  const resend = useResendTimer(state.screen === 'verify')
  const codeBoxes = useCodeBoxes(state.code, (c) => set('code', c))
  const [pagerDot, setPagerDot] = useState(0)

  useSplashAdvance(state.screen, go, 1500)

  const zones = ZONES.includes(state.tz) ? ZONES : [state.tz, ...ZONES]

  const Chrome = ({ back, screen }: { back: Parameters<typeof go>[0]; screen: string }) => (
    <div className="chrome">
      <button className="back" onClick={() => go(back)} aria-label="Back">‹</button>
      <div className="bar"><i style={{ width: PROGRESS[screen] }} /></div>
    </div>
  )

  const Agent = ({ children }: { children: React.ReactNode }) => (
    <div className="agent">
      <div className="avatar"><WingGlyph /></div>
      <div className="say">{children}</div>
    </div>
  )

  return (
    <div className="mp">
      <div className="stage">
        <div className="frame">
          {state.screen === 'splash' && (
            <section className="screen wash active">
              <WingGlyph className="wing" />
              <div className="wordmark">wingman</div>
              <div className="tagline">Your AI chief of staff on WhatsApp</div>
            </section>
          )}

          {state.screen === 'intro' && (
            <section className="screen active">
              <div
                className="pager"
                onScroll={(e) => setPagerDot(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
              >
                <div className="pane">
                  <div className="glyph">🪽</div>
                  <h2>Meet Wingman.</h2>
                  <p>A chief of staff for your life - briefings in the morning, a heads-up when email, bills, deliveries, or travel need you.</p>
                </div>
                <div className="pane">
                  <div className="glyph">🌙</div>
                  <h2>It works while you don’t.</h2>
                  <p>Wingman watches your connected sources in the background and only messages when something actually needs attention.</p>
                </div>
                <div className="pane">
                  <div className="glyph">💬</div>
                  <h2>It lives in WhatsApp.</h2>
                  <p>Wingman has its own number. No new app to check - it reaches out on your schedule, and you reply like you would to anyone.</p>
                </div>
              </div>
              <div className="dots">
                {[0, 1, 2].map((i) => <i key={i} className={pagerDot === i ? 'on' : ''} />)}
              </div>
              <div className="cta-zone">
                <button className="cta" onClick={() => go('phone')}>Get started <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'phone' && (
            <section className="screen active">
              <Chrome back="intro" screen="phone" />
              <Agent>First things first - <b>which WhatsApp number is yours?</b></Agent>
              <h1 className="q">Your WhatsApp number</h1>
              <p className="sub">This is where I’ll send briefings and alerts. I’ll text you a 6-digit code to make sure it’s you.</p>
              <div className="field">
                <select className="cc" value={state.cc} onChange={(e) => set('cc', e.target.value)} aria-label="Country code">
                  {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="tel" inputMode="tel" placeholder="300 1234567" autoComplete="tel" aria-label="Phone number"
                  value={state.phone} onChange={(e) => set('phone', e.target.value)}
                />
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <div className="trust"><span className="dot">🔒</span><span>By continuing you agree to let Wingman message you on WhatsApp. Your number is used for connection and verification only.</span></div>
                <button className="cta" disabled={!phoneValid} onClick={() => { resend.restart(); go('verify') }}>
                  Send my code <span className="arr">→</span>
                </button>
              </div>
            </section>
          )}

          {state.screen === 'verify' && (
            <section className="screen active">
              <Chrome back="phone" screen="verify" />
              <Agent>Sent! Check WhatsApp for a message from <b>me</b>.</Agent>
              <h1 className="q">Enter the code</h1>
              <p className="sub">We sent a 6-digit code to <b>{fullPhone}</b>.</p>
              <div className="code-row" onPaste={codeBoxes.onPaste}>
                {state.code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { codeBoxes.refs.current[i] = el }}
                    inputMode="numeric" maxLength={1} aria-label={`Digit ${i + 1}`}
                    value={d}
                    onChange={(e) => codeBoxes.onChange(i, e.target.value)}
                    onKeyDown={(e) => codeBoxes.onKeyDown(i, e)}
                  />
                ))}
              </div>
              <div className="row-links">
                <button onClick={() => go('phone')}>Edit number</button>
                <button
                  className={resend.canResend ? '' : 'muted'}
                  onClick={() => { if (resend.canResend) { toast('Code re-sent on WhatsApp'); resend.restart() } }}
                >
                  {resend.canResend ? 'Resend code' : `Resend in ${resend.left}s`}
                </button>
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" disabled={!codeComplete} onClick={() => go('name')}>Verify <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'name' && (
            <section className="screen active">
              <Chrome back="verify" screen="name" />
              <div className="eyebrow">About you · 1 of 6</div>
              <Agent>Verified ✓ Now, <b>what should I call you?</b></Agent>
              <h1 className="q">Your first name</h1>
              <p className="sub">I’ll use it when I message you - “Morning, John” beats “Dear user”.</p>
              <div className="field">
                <input
                  placeholder="First name" autoComplete="given-name" aria-label="First name"
                  value={state.name} onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" disabled={!nameValid} onClick={() => go('tz')}>Continue <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'tz' && (
            <section className="screen active">
              <Chrome back="name" screen="tz" />
              <div className="eyebrow">Your rhythm · 2 of 6</div>
              <h1 className="q">Where do your days happen?</h1>
              <p className="sub">Briefings and reminders arrive on your local time.</p>
              <div className="detected"><span className="pulse" /><span>Detected: {state.tz}</span></div>
              <div className="chips">
                {zones.map((z) => (
                  <button key={z} className={`chip ${state.tz === z ? 'selected' : ''}`} onClick={() => set('tz', z)}>
                    {z.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('rhythm')}>Continue <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'rhythm' && (
            <section className="screen active">
              <Chrome back="tz" screen="rhythm" />
              <div className="eyebrow">Your rhythm · 3 of 6</div>
              <Agent>When are you <b>on</b> - and when should I stay quiet?</Agent>
              <h1 className="q">Shape your day</h1>
              <div className="sched">
                {([
                  ['brief', '🌅', 'Morning briefing', 'Your day, summarized before it starts'],
                  ['start', '💼', 'Work starts', null],
                  ['end', '🌆', 'Work ends', null],
                  ['wrap', '🌙', 'Evening wrap-up', 'A soft close to the day'],
                ] as const).map(([key, ic, lbl, hint]) => (
                  <div className="srow" key={key}>
                    <span className="ic">{ic}</span>
                    <div>
                      <span className="lbl">{lbl}</span>
                      {hint && <span className="hint">{hint}</span>}
                    </div>
                    <input
                      type="time"
                      value={state.times[key]}
                      onChange={(e) => set('times', { ...state.times, [key]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <div className="trust"><span className="dot">🤫</span><span>Outside these hours Wingman won’t nudge you unless it’s truly urgent.</span></div>
                <button className="cta" onClick={() => go('proactivity')}>Continue <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'proactivity' && (
            <section className="screen active">
              <Chrome back="rhythm" screen="proactivity" />
              <div className="eyebrow">Your agent · 4 of 6</div>
              <h1 className="q">How forward should I be?</h1>
              <p className="sub">You can change this any time in Settings.</p>
              <div className="opt-list">
                {PROACTIVITY.map((p) => (
                  <button key={p.value} className={`opt ${state.proactivity === p.value ? 'selected' : ''}`} onClick={() => set('proactivity', p.value)}>
                    <div><div className="t">{p.value}</div><div className="d">{p.blurbA}</div></div>
                    <span className="radio" />
                  </button>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('skills')}>Continue <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'skills' && (
            <section className="screen active">
              <Chrome back="proactivity" screen="skills" />
              <div className="eyebrow">Your agent · 5 of 6</div>
              <h1 className="q">Pick my skills</h1>
              <p className="sub">Each one is a thing I watch for you. Toggle anything off - you can change these later.</p>
              <div className="opt-list">
                {SKILLS.map((s) => (
                  <div className="skill" key={s.name}>
                    <span className="em">{s.emoji}</span>
                    <div><div className="t">{s.name}</div><div className="d">{s.blurb}</div></div>
                    <button
                      className={`switch ${state.skills.includes(s.name) ? 'on' : ''}`}
                      onClick={() => toggleSkill(s.name)}
                      aria-label={`Toggle ${s.name}`}
                      aria-pressed={state.skills.includes(s.name)}
                    />
                  </div>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('personality')}>Continue <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'personality' && (
            <section className="screen active">
              <Chrome back="skills" screen="personality" />
              <div className="eyebrow">Your agent · 6 of 6</div>
              <h1 className="q">How should I sound?</h1>
              <div className="opt-list" style={{ marginBottom: 14 }}>
                {TONES.map((t) => (
                  <button key={t.value} className={`opt ${state.tone === t.value ? 'selected' : ''}`} onClick={() => set('tone', t.value)}>
                    <div><div className="t">{t.value}</div><div className="d">{t.blurb}</div></div>
                    <span className="radio" />
                  </button>
                ))}
              </div>
              <div className="seg">
                <button className={state.detail === 'Concise' ? 'selected' : ''} onClick={() => set('detail', 'Concise')}>Concise · lead with the answer</button>
                <button className={state.detail === 'Detailed' ? 'selected' : ''} onClick={() => set('detail', 'Detailed')}>Detailed · full context</button>
              </div>
              <div className="preview">
                <div className="cap">HOW I’LL SOUND</div>
                <div className="msg">
                  <div className="avatar"><WingGlyph /></div>
                  <p>{preview}</p>
                </div>
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('ready')}>Continue <span className="arr">→</span></button>
              </div>
            </section>
          )}

          {state.screen === 'ready' && (
            <section className="screen active">
              <div className="done-hero">
                <div className="check-wing"><WingGlyph white /></div>
                <h1 className="q">{state.name ? `You’re all set, ${state.name}.` : 'You’re all set.'}</h1>
                <p className="sub">I’m watching your day from here. Connect a service or two and the briefings get much smarter.</p>
              </div>
              <div className="sum">
                {([
                  ['WhatsApp', fullPhone],
                  ['Timezone', state.tz.replace('_', ' ')],
                  ['Workday', `${formatTime(state.times.start)} to ${formatTime(state.times.end)}`],
                  ['Briefings', `${formatTime(state.times.brief)} & ${formatTime(state.times.wrap)}`],
                  ['Proactivity', state.proactivity],
                  ['Skills', state.skills.length === 5 ? 'All five on' : state.skills.length ? `${state.skills.length} on` : 'None yet'],
                  ['Voice', `${state.tone} · ${state.detail}`],
                ] as const).map(([k, v]) => (
                  <div className="r" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
                ))}
              </div>
              <div className="connect">
                {([
                  ['cal', '📅', 'Google Calendar', 'Meetings in your briefing'],
                  ['mail', '✉️', 'Gmail', 'Urgent email alerts'],
                ] as const).map(([id, em, t, d]) => (
                  <div className="c" key={id}>
                    <span className="em">{em}</span>
                    <div><div className="t">{t}</div><div className="d">{d}</div></div>
                    <button
                      className={state.connected.includes(id) ? 'done' : ''}
                      onClick={() => { if (!state.connected.includes(id)) { connect(id); toast('Connected - I’ll start reading context now') } }}
                    >
                      {state.connected.includes(id) ? 'Connected ✓' : 'Connect'}
                    </button>
                  </div>
                ))}
                <div className="c">
                  <span className="em">❤️</span>
                  <div><div className="t">Health data</div><div className="d">Sleep, HRV, steps</div></div>
                  <button className="soon">Soon</button>
                </div>
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => toast('Home comes next - this flow ends here for now 🪽')}>Go to Wingman <span className="arr">→</span></button>
                <button className="ghost" onClick={() => go('rhythm')}>Review my setup</button>
              </div>
            </section>
          )}

          <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>
        </div>
        <div className="stage-note">Wingman onboarding · Morning Paper concept · tap through</div>
      </div>
    </div>
  )
}
