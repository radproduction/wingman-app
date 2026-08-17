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
import logoDark from '../assets/logo-dark.svg'
import './first-light.css'

type Loc = 'hero' | 'head' | 'dawn'

const SCENE: Record<string, { loc: Loc; dawn: number; sun?: string; crumb?: string }> = {
  splash: { loc: 'hero', dawn: 0 },
  intro: { loc: 'hero', dawn: 0.05 },
  phone: { loc: 'head', dawn: 0.12, sun: '12%', crumb: 'WhatsApp' },
  verify: { loc: 'head', dawn: 0.2, sun: '22%', crumb: 'Verify' },
  name: { loc: 'head', dawn: 0.3, sun: '33%', crumb: 'About you · 1 of 6' },
  tz: { loc: 'head', dawn: 0.4, sun: '44%', crumb: 'Your rhythm · 2 of 6' },
  rhythm: { loc: 'head', dawn: 0.5, sun: '55%', crumb: 'Your rhythm · 3 of 6' },
  proactivity: { loc: 'head', dawn: 0.62, sun: '66%', crumb: 'Your agent · 4 of 6' },
  skills: { loc: 'head', dawn: 0.74, sun: '77%', crumb: 'Your agent · 5 of 6' },
  personality: { loc: 'head', dawn: 0.86, sun: '88%', crumb: 'Your agent · 6 of 6' },
  ready: { loc: 'dawn', dawn: 1 },
}

export const FirstLight = () => {
  const ob = useOnboarding()
  const { state, set, go, toggleSkill, connect, fullPhone, phoneValid, codeComplete, nameValid, preview } = ob
  const { msg, show, toast } = useToast()
  const resend = useResendTimer(state.screen === 'verify')
  const codeBoxes = useCodeBoxes(state.code, (c) => set('code', c))

  useSplashAdvance(state.screen, go, 1800)

  const scene = SCENE[state.screen]
  const zones = (ZONES.includes(state.tz) ? ZONES : [state.tz, ...ZONES]).slice(0, 6)

  const Horizon = ({ back }: { back: Parameters<typeof go>[0] }) => (
    <div className="horizon">
      <div className="track"><span className="sun" style={{ left: scene.sun }} /></div>
      <div className="meta">
        <button className="back" onClick={() => go(back)}>Back</button>
        <span className="crumb">{scene.crumb}</span>
      </div>
    </div>
  )

  return (
    <div className="fl">
      <div className="stage">
        <div className="frame" data-loc={scene.loc}>
          <div className="sky" />
          <div className="sky-dawn" style={{ opacity: scene.dawn }} />
          <div className="presence"><div className="halo" /><div className="core" /></div>

          {state.screen === 'splash' && (
            <section className="screen center active">
              <div className="wordmark-row">
                <img src={logoDark} alt="wingman" style={{ height: 22, width: 'auto', opacity: 0.95 }} />
              </div>
              <p className="tagline">Quiet help for loud days.</p>
            </section>
          )}

          {state.screen === 'intro' && (
            <section className="screen active">
              <div className="grow" />
              <div className="reveal">
                <p><b>I’m Wingman.</b> Think of me as a chief of staff who never sleeps.</p>
                <p>I watch your calendar, inbox, bills, deliveries, and trips - quietly, in the background.</p>
                <p className="dim">When something needs you, I say so on WhatsApp. Otherwise, silence.</p>
              </div>
              <div className="cta-zone intro-cta">
                <button className="cta" onClick={() => go('phone')}>Let’s set you up</button>
              </div>
            </section>
          )}

          {state.screen === 'phone' && (
            <section className="screen active">
              <Horizon back="intro" />
              <h1 className="q">Where can I <b>reach you?</b></h1>
              <p className="sub">Briefings and alerts arrive on WhatsApp. I’ll send a 6-digit code there first.</p>
              <div className="u-field">
                <select value={state.cc} onChange={(e) => set('cc', e.target.value)} aria-label="Country code">
                  {COUNTRY_CODES.map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  type="tel" inputMode="tel" placeholder="300 1234567" autoComplete="tel" aria-label="Phone number"
                  value={state.phone} onChange={(e) => set('phone', e.target.value)}
                />
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <p className="fine">Continuing lets Wingman message you on WhatsApp. Your number is used for connection and verification - nothing else.</p>
                <button className="cta" disabled={!phoneValid} onClick={() => { resend.restart(); go('verify') }}>Send the code</button>
              </div>
            </section>
          )}

          {state.screen === 'verify' && (
            <section className="screen active">
              <Horizon back="phone" />
              <h1 className="q">One quick <b>check.</b></h1>
              <p className="sub">Sent to <span style={{ color: 'var(--text)' }}>{fullPhone}</span> - look for my first message.</p>
              <div className="slots" onPaste={codeBoxes.onPaste}>
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
                <button className="live" onClick={() => go('phone')}>Edit number</button>
                <button
                  className={resend.canResend ? 'live' : ''}
                  onClick={() => { if (resend.canResend) { toast('Code re-sent on WhatsApp'); resend.restart() } }}
                >
                  {resend.canResend ? 'Resend code' : `Resend in ${resend.left}s`}
                </button>
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" disabled={!codeComplete} onClick={() => go('name')}>Verify</button>
              </div>
            </section>
          )}

          {state.screen === 'name' && (
            <section className="screen active">
              <Horizon back="verify" />
              <h1 className="q">What should I <b>call you?</b></h1>
              <p className="sub">Just your first name - it’s how my messages will greet you.</p>
              <div className="u-field">
                <input
                  placeholder="Your name" autoComplete="given-name" aria-label="First name"
                  value={state.name} onChange={(e) => set('name', e.target.value)}
                />
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" disabled={!nameValid} onClick={() => go('tz')}>Continue</button>
              </div>
            </section>
          )}

          {state.screen === 'tz' && (
            <section className="screen active">
              <Horizon back="name" />
              <h1 className="q">Where do your <b>days begin?</b></h1>
              <p className="sub">So briefings land on your local time. I’ve taken a guess.</p>
              <div className="q-list">
                {zones.map((z) => (
                  <button key={z} className={`q-item ${state.tz === z ? 'selected' : ''}`} onClick={() => set('tz', z)}>
                    <span className="mark" />
                    <div>
                      <div className="t">{z.replace('_', ' ')}</div>
                      {z === state.tz && zones[0] === z && <div className="d">Detected from your device</div>}
                    </div>
                  </button>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('rhythm')}>Continue</button>
              </div>
            </section>
          )}

          {state.screen === 'rhythm' && (
            <section className="screen active">
              <Horizon back="tz" />
              <h1 className="q">When is <b>your day?</b></h1>
              <p className="sub">I keep to these hours. Outside them, I only speak up for real emergencies.</p>
              <div>
                {([
                  ['brief', 'Morning briefing', 'Your day, before it starts'],
                  ['start', 'Work starts', null],
                  ['end', 'Work ends', null],
                  ['wrap', 'Evening wrap-up', 'A soft close to the day'],
                ] as const).map(([key, lbl, hint]) => (
                  <div className="t-row" key={key}>
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
                <button className="cta" onClick={() => go('proactivity')}>Continue</button>
              </div>
            </section>
          )}

          {state.screen === 'proactivity' && (
            <section className="screen active">
              <Horizon back="rhythm" />
              <h1 className="q">How present <b>should I be?</b></h1>
              <p className="sub">Changeable any time in Settings.</p>
              <div className="q-list">
                {PROACTIVITY.map((p) => (
                  <button key={p.value} className={`q-item ${state.proactivity === p.value ? 'selected' : ''}`} onClick={() => set('proactivity', p.value)}>
                    <span className="mark" />
                    <div><div className="t">{p.value}</div><div className="d">{p.blurbB}</div></div>
                  </button>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('skills')}>Continue</button>
              </div>
            </section>
          )}

          {state.screen === 'skills' && (
            <section className="screen active">
              <Horizon back="proactivity" />
              <h1 className="q">What should <b>I watch?</b></h1>
              <p className="sub">Five skills. Leave on what matters, switch off the rest.</p>
              <div>
                {SKILLS.map((s) => (
                  <div className="s-item" key={s.name}>
                    <div><div className="t">{s.name}</div><div className="d">{s.blurb}</div></div>
                    <button
                      className={`tgl ${state.skills.includes(s.name) ? 'on' : ''}`}
                      onClick={() => toggleSkill(s.name)}
                      aria-label={`Toggle ${s.name}`}
                      aria-pressed={state.skills.includes(s.name)}
                    />
                  </div>
                ))}
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('personality')}>Continue</button>
              </div>
            </section>
          )}

          {state.screen === 'personality' && (
            <section className="screen active">
              <Horizon back="skills" />
              <h1 className="q">How should <b>I sound?</b></h1>
              <div className="q-list">
                {TONES.map((t) => (
                  <button key={t.value} className={`q-item ${state.tone === t.value ? 'selected' : ''}`} onClick={() => set('tone', t.value)}>
                    <span className="mark" />
                    <div><div className="t">{t.value}</div><div className="d">{t.blurb}</div></div>
                  </button>
                ))}
              </div>
              <div className="pair">
                <button className={state.detail === 'Concise' ? 'selected' : ''} onClick={() => set('detail', 'Concise')}>Concise - lead with the answer</button>
                <button className={state.detail === 'Detailed' ? 'selected' : ''} onClick={() => set('detail', 'Detailed')}>Detailed - full context</button>
              </div>
              <div className="whisper">
                <div className="cap">How I’ll sound</div>
                <div className="card">{preview}</div>
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta" onClick={() => go('ready')}>Continue</button>
              </div>
            </section>
          )}

          {state.screen === 'ready' && (
            <section className="screen active">
              <div className="ready-head">
                <h1 className="q">
                  {state.name ? <>The day is yours, <b>{state.name}.</b></> : <>The day is <b>yours.</b></>}
                </h1>
                <p className="sub">Your first briefing arrives tomorrow at {formatTime(state.times.brief)}.</p>
              </div>
              <div className="sum">
                {([
                  ['WhatsApp', fullPhone],
                  ['Timezone', state.tz.replace('_', ' ')],
                  ['Workday', `${formatTime(state.times.start)} to ${formatTime(state.times.end)}`],
                  ['Briefings', `${formatTime(state.times.brief)} & ${formatTime(state.times.wrap)}`],
                  ['Presence', state.proactivity],
                  ['Skills', state.skills.length === 5 ? 'All five' : state.skills.length ? `${state.skills.length} of 5` : 'None yet'],
                  ['Voice', `${state.tone} · ${state.detail}`],
                ] as const).map(([k, v]) => (
                  <div className="r" key={k}><span className="k">{k}</span><span className="v">{v}</span></div>
                ))}
              </div>
              <div className="connect">
                {([
                  ['cal', 'Google Calendar', 'Meetings in your briefing'],
                  ['mail', 'Gmail', 'Urgent email alerts'],
                ] as const).map(([id, t, d]) => (
                  <div className="c" key={id}>
                    <div><div className="t">{t}</div><div className="d">{d}</div></div>
                    <button
                      className={state.connected.includes(id) ? 'done' : ''}
                      onClick={() => { if (!state.connected.includes(id)) { connect(id); toast('Connected - context starts flowing') } }}
                    >
                      {state.connected.includes(id) ? 'Connected' : 'Connect'}
                    </button>
                  </div>
                ))}
                <div className="c">
                  <div><div className="t">Health data</div><div className="d">Sleep, HRV, steps</div></div>
                  <button className="soon">Soon</button>
                </div>
              </div>
              <div className="grow" />
              <div className="cta-zone">
                <button className="cta sun-cta" onClick={() => toast('Home comes next - this flow ends here for now')}>Go to Wingman</button>
                <button className="ghost" onClick={() => go('rhythm')}>Review my setup</button>
              </div>
            </section>
          )}

          <div className={`toast ${show ? 'show' : ''}`}>{msg}</div>
        </div>
        <div className="stage-note">Wingman onboarding · First Light concept · tap through</div>
      </div>
    </div>
  )
}
