import { useState } from 'react'
import { BLUR_TOKENS, DISTANCE_TOKENS, DURATION_TOKENS, EASING_TOKENS, NAMED_MOTION, SCALE_TOKENS } from '../data'
import { Note, Section, Sub, TokenTable, Trap } from '../parts'
import { tv } from '../tokenStore'

const DURATION_USE: Record<string, string> = {
  '--duration-stagger': 'per-item stagger offset',
  '--duration-micro': 'path delay, shake segment',
  '--duration-quick': 'press feedback, text swap',
  '--duration-fast': 'screen enter, sheet open, the tab pill',
  '--duration-medium': 'toast close, progress fill',
  '--duration-slow': 'panel open, skeleton reveal',
  '--duration-very-slow': 'emphasis moments',
}

export const MotionSection = () => {
  const [run, setRun] = useState(0)

  return (
    <Section
      id="motion"
      title="Motion"
      lead="One scale, and every animation in the app reads from it. Pick a token by what the motion does, not by which number is closest: a modal close maps to the quick duration because both are a modal close."
    >
      <div className="wgd-playbar">
        <button type="button" className="wgd-play" onClick={() => setRun((n) => n + 1)}>
          Play every demo
        </button>
        <span className="wgd-note">Each specimen below runs at its own token, read off the stylesheet.</span>
      </div>

      <Sub title="Durations">
        <div className="wgd-motion">
          {DURATION_TOKENS.map((name) => (
            <div className="wgd-motion__row" key={name}>
              <code className="wgd-motion__name">{name}</code>
              <span className="wgd-motion__val">{tv(name).light}</span>
              <span className="wgd-motion__track">
                <span
                  key={run}
                  className="wgd-motion__dot"
                  style={{ animationDuration: `var(${name})`, animationTimingFunction: 'var(--ease-smooth-out)' }}
                />
              </span>
              <span className="wgd-shape__use">{DURATION_USE[name]}</span>
            </div>
          ))}
        </div>
      </Sub>

      <Sub title="Easings" note="All six run here at the same duration, so the curve is the only variable.">
        <div className="wgd-motion">
          {EASING_TOKENS.map((name) => (
            <div className="wgd-motion__row" key={name}>
              <code className="wgd-motion__name">{name}</code>
              <span className="wgd-motion__val">{tv(name).light}</span>
              <span className="wgd-motion__track">
                <span
                  key={run}
                  className="wgd-motion__dot"
                  style={{ animationDuration: 'var(--duration-slow)', animationTimingFunction: `var(${name})` }}
                />
              </span>
            </div>
          ))}
        </div>
        <Note>
          The strong bounce overshoots past its endpoint on purpose. Its curve carries a y value above 1,
          which is deliberate and is reproduced correctly by a bezier easing natively. Do not substitute a
          spring for it casually: the app already uses real springs in two places, and the distinction is
          the point.
        </Note>
      </Sub>

      <Sub title="Distances, scales and blur">
        <div className="wgd-cols">
          <TokenTable tokens={DISTANCE_TOKENS} />
          <TokenTable tokens={SCALE_TOKENS} />
          <TokenTable tokens={BLUR_TOKENS} />
        </div>
        <Note>
          Several distances are signed, because &ldquo;deeper&rdquo; means off the trailing edge, which flips
          under right-to-left.
        </Note>
      </Sub>

      <Sub title="Named transitions" note="Each group ships literal values rather than pointing back at the scale, so one can be re-tuned without dragging the rest of the app with it.">
        {NAMED_MOTION.map((group) => (
          <div className="wgd-named" key={group.id}>
            <h4 className="wgd-h4">{group.title}</h4>
            {group.note ? <p className="wgd-note">{group.note}</p> : null}
            <TokenTable tokens={group.tokens} />
          </div>
        ))}
      </Sub>

      <Sub title="Standing decisions a native build has to carry">
        <ul className="wgd-list">
          <li>
            <strong>Screen transitions say which kind of move you made.</strong> Going a level deeper slides:
            the detail screen arrives from the trailing edge while the screen you left recedes a quarter of
            the way and blurs, and back plays it in reverse. The five tabs are not levels of each other, so
            they rise and fade instead. Sideways travel is spent only on depth.
          </li>
          <li>
            <strong>Direction is read off history, never off the two route names.</strong> Both directions
            between the same two screens are the same route change.
          </li>
          <li>
            <strong>Arriving is slower than leaving.</strong> Something you asked for should feel like it
            settled; something you dismissed should already be gone.
          </li>
          <li>
            <strong>The sheet leaves on a spring seeded with the gesture&rsquo;s own velocity</strong>, so a
            flick and a tap are the same motion at different speeds. That is why there is no close duration
            to copy.
          </li>
          <li>
            <strong>Reduced motion has two layers and the in-app choice wins.</strong> The phone&rsquo;s
            setting is honoured, but choosing to keep the motion in Settings genuinely keeps it.
          </li>
          <li>
            <strong>Three things are deliberately off the scale</strong> and stay off it: the hero fills
            animating to value once on load, the day card&rsquo;s sun turning once every 24 seconds, and the
            splash. The sun is the one piece of motion in the app that exists purely for pleasure, which is
            why both reduced-motion layers stop it outright rather than slowing it.
          </li>
        </ul>
      </Sub>

      <Trap>
        Durations convert one for one, and every easing converts to a bezier easing including the strong
        bounce. Two things do not. The sheet&rsquo;s exit is a gesture-driven spring rather than a timed
        animation and has to be built as one. And the reduced-motion clamp in the web app is a CSS
        mechanism, not a design decision: the decision is that motion stops except where it carries meaning,
        and natively that is the OS setting plus app state layered over it, or the Settings toggle will do
        nothing.
      </Trap>
    </Section>
  )
}
