import { useState } from 'react'
import { Icon } from '../../app/icons'
import { Note, Sub, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, PropsTable, Stage, TokensUsed } from './docParts'

const TONES = ['primary', 'quiet', 'outline', 'soft', 'whatsapp', 'danger', 'warn'] as const
type Tone = (typeof TONES)[number]

const TONE_CLASS: Record<Tone, string> = {
  primary: '',
  quiet: 'quiet',
  outline: 'outline',
  soft: 'soft',
  whatsapp: 'wa',
  danger: 'danger',
  warn: 'warn',
}

const CONTRACT = `// wg/Button.tsx - implement to match. Every colour, size and radius reads
// from the theme object generated out of app.css; nothing is hardcoded here.

type ButtonTone =
  | 'primary'   // accent fill, on-accent label; press flips fill to accent-deep
  | 'quiet'     // card-tonal fill, ink label; press fills with track
  | 'outline'   // transparent, accent-deep label, inset 1.5 accent ring
  | 'soft'      // accent-tonal fill, accent-deep label; press dips scale 0.99
  | 'whatsapp'  // ok-tonal fill, ok label; press dips scale 0.99
  | 'danger'    // chip-rose fill, alert label; press dips scale 0.99
  | 'warn'      // chip-sand fill, warn label; press dips scale 0.99

interface ButtonProps {
  label: string
  tone?: ButtonTone            // default 'primary'
  small?: boolean              // the ONE small size: 13 type, tighter padding
  full?: boolean               // stretch; label + optional icon flex-centred, gap 8
  leadingIcon?: ReactNode      // presence shows it - no showLeadingIcon flag
  disabled?: boolean           // maps the web :disabled
  onPress?: () => void         // maps the web onClick
  accessibilityLabel?: string  // maps the web aria-label
}

// Geometry, from the theme:
//   radius: theme.radius.pill
//   default padding: [16 + nudge, 24, 16 - nudge]; full: sides 16; small: [8 +/- nudge, 16]
//   nudge = fontSize * 0.055 (the optical-centre sink; zero for ar/ur/hi)
//   type: 15/500 (13/500 small), lineHeight = fontSize * 1.3,
//   includeFontPadding: false on Android
//   leadingIcon: 18 (14 when small), on a flex-centred row with the label,
//   gap 8. Native layout is flex, so the web's baseline-misalignment trap
//   (an inline icon in a non-flex button) cannot exist here - centre and go.
//
// Press, on Pressable's pressed state - never while disabled:
//   primary -> fill theme.accentDeep      quiet -> fill theme.track
//   warn    -> fill theme.warnTonal       soft / whatsapp / danger -> scale 0.99
//   (scale is a transform - the one thing here that animates; 150ms, smooth-out)
//
// Disabled paints theme.cardTonal / theme.textMuted WHATEVER the tone, so
// "you cannot press this yet" reads the same on every tone.`

const Playground = () => {
  const [tone, setTone] = useState<Tone>('primary')
  const [small, setSmall] = useState(false)
  const [full, setFull] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [leading, setLeading] = useState(false)
  const [label, setLabel] = useState('Continue')

  const cls = ['wg-btn', small && 'sm', full && 'full', TONE_CLASS[tone]].filter(Boolean).join(' ')
  const iconFlex =
    leading && !full
      ? { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--space-8)' }
      : undefined

  return (
    <>
      <div className="wgd-playbar" role="group" aria-label="tone">
        {TONES.map((t) => (
          <button key={t} type="button" className="wgd-play" aria-pressed={tone === t} onClick={() => setTone(t)}>
            {t}
          </button>
        ))}
      </div>
      <div className="wgd-playbar">
        {(
          [
            ['small', small, setSmall],
            ['full', full, setFull],
            ['disabled', disabled, setDisabled],
            ['leadingIcon', leading, setLeading],
          ] as const
        ).map(([name, on, set]) => (
          <button key={name} type="button" className="wgd-play" aria-pressed={on} onClick={() => set(!on)}>
            {name}
          </button>
        ))}
        <input
          className="wgd-input"
          type="text"
          value={label}
          aria-label="label"
          onChange={(e) => setLabel(e.target.value)}
        />
      </div>
      <Stage ground="panel">
        <button type="button" className={cls} style={iconFlex} disabled={disabled}>
          {leading ? <Icon name="check" size={small ? 14 : 18} variant="duotone" /> : null}
          {label || 'Continue'}
        </button>
      </Stage>
      <Note>
        Press it: the primary flips to the deep fill, the tonal tones keep their fill and dip, and quiet
        fills with the track grey. A leading icon always sits on a flex-centred row with the label, gap 8,
        at whatever width the button has - 18 at the default size, 14 on the small pill, never larger.
      </Note>
    </>
  )
}

export const ButtonDoc = () => (
  <>
    <p className="wgd-lead">
      The app's one button. Seven tones over one shape, two sizes, and nothing else: a new kind of action is
      a tone on this pill, never a new button. Buttons say what happens ("Send my code"), never "Submit".
    </p>

    <DocSection title="Specimen">
      <Playground />
    </DocSection>

    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Shape', spec: 'Pill (--radius-pill). One height per size, held by the pill-nudge trick below.' },
          {
            part: 'Padding',
            spec: 'Default: (--space-16 + nudge) / --space-24 / (--space-16 - nudge). Full-width: sides at --space-16. Small: (--space-8 +/- nudge) / --space-16.',
          },
          {
            part: 'Label',
            spec: '15/500 (13/500 small), line box --pill-line (1.3). The top padding gains --pill-nudge and the bottom loses it, sinking the label onto its optical centre without changing the height.',
          },
          {
            part: 'Leading icon',
            spec: 'Optional, always on the flex-centred layout (an icon in a default-size button implies it), gap --space-8, tinted to the label colour. 18 at the default size, 14 on the small pill. Presence shows it.',
          },
          { part: 'Tones', spec: 'primary, quiet, outline, soft, whatsapp, danger, warn. Fill and label change; shape, size and padding never do.' },
        ]}
      />
    </DocSection>

    <DocSection title="Props">
      <PropsTable
        rows={[
          { prop: 'label', type: 'string', rn: 'label: string', desc: 'Says what happens. Never "Submit".' },
          { prop: 'tone', type: 'ButtonTone', default: "'primary'", rn: "tone?: ButtonTone", desc: 'One of the seven tones.' },
          { prop: 'small', type: 'boolean', default: 'false', rn: 'small?: boolean', desc: 'The one small size ([D-022]): a 13px in-row pill. Same radius, same nudge.' },
          { prop: 'full', type: 'boolean', default: 'false', rn: 'full?: boolean', desc: 'Stretches; label and optional icon read as one flex-centred unit.' },
          { prop: 'leadingIcon', type: 'ReactNode', rn: 'leadingIcon?: ReactNode', desc: 'Presence shows it - there is no showLeadingIcon flag.' },
          { prop: 'disabled', type: 'boolean', default: 'false', rn: 'disabled?: boolean', desc: 'Same muted ground and label whatever the tone.' },
          { prop: 'onClick', type: '() => void', rn: 'onPress?: () => void', desc: 'The action.' },
          { prop: 'aria-label', type: 'string', rn: 'accessibilityLabel?: string', desc: 'Only when the label alone is not enough.' },
        ]}
      />
    </DocSection>

    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Pressed', rule: 'Primary flips its fill to accent-deep. Quiet fills with track; warn with warn-tonal. Soft, whatsapp and danger keep their fill and dip to scale 0.99. Never while disabled.' },
          { state: 'Disabled', rule: 'card-tonal ground, muted label, whatever the tone. Stated once for all tones so "not yet" reads the same everywhere.' },
          { state: 'Long label', rule: 'The pill grows; the label never wraps to two lines. If it would, the copy is too long.' },
          { state: 'RTL', rule: 'The leading icon leads in the writing direction. Nothing else changes.' },
        ]}
      />
    </DocSection>

    <DocSection title="Tokens">
      <TokensUsed
        names={[
          '--accent',
          '--on-accent',
          '--accent-deep',
          '--accent-tonal',
          '--card-tonal',
          '--track',
          '--ink',
          '--muted',
          '--ok-tonal',
          '--ok',
          '--chip-rose',
          '--alert',
          '--chip-sand',
          '--warn',
          '--warn-tonal',
          '--radius-pill',
          '--space-8',
          '--space-16',
          '--space-24',
          '--pill-line',
          '--pill-nudge',
          '--duration-quick',
          '--ease',
        ]}
      />
    </DocSection>

    <DocSection title="Text variants">
      <Sub title="Text button" note="An action styled as text (a back-bar action, an inline Resend): 15/500 accent-deep, tap padding 12/8 that collapses to zero inside running text.">
        <Stage ground="home">
          <button type="button" className="wg-btn-text">
            Resend code
          </button>
        </Stage>
      </Sub>
      <Sub title="Inline link" note="A small accent-deep action trailing a row - Manage connection, Undo, Details. 13/500, optional trailing chevron on a 4px gap; --end pushes it to the trailing edge; --danger reads in the calm rose, because a deletion is deliberate, not an alarm ([D-009]).">
        <Stage ground="home">
          <button type="button" className="wg-link">
            Details <Icon name="chevronRight" size={14} />
          </button>
          <button type="button" className="wg-link wg-link--danger">
            Delete recording
          </button>
        </Stage>
      </Sub>
      <Note>
        Natively these are two small sibling components, TextButton and InlineLink, not tones of Button:
        they share its voice but none of its geometry.
      </Note>
    </DocSection>

    <DocSection title="React Native">
      <Trap>
        Build on <code>Pressable</code>, never TouchableOpacity. The press fills are instant style swaps off
        the pressed state; the tonal dip is the one animated part, a transform to scale 0.99 over the quick
        duration - transform and opacity are the only properties that animate. Android needs{' '}
        <code>includeFontPadding: false</code> or the nudge fights the font's own padding. Hit area: the
        small pill is under 44 tall, so it carries <code>hitSlop</code> up to the 44 target.
      </Trap>
      <Contract label="wg/Button.tsx" code={CONTRACT} />
    </DocSection>
  </>
)
