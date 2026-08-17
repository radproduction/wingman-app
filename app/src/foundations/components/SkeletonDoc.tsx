import { useRef, useState, type CSSProperties } from 'react'
import { Icon, type IconName } from '../../app/icons'
import { PanelSkeleton } from '../../app/Skeleton'
import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'

const rowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 'var(--row-gap)',
  background: 'var(--home-surface)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--row-pad-y) var(--space-16)',
}

const ContentRow = ({ icon, tone, title, sub }: { icon: IconName; tone: string; title: string; sub: string }) => (
  <div className="wg-card-line" style={rowStyle}>
    <span
      style={{
        width: 'var(--row-chip)',
        height: 'var(--row-chip)',
        borderRadius: 'var(--radius-pill)',
        background: `var(--chip-${tone})`,
        color: `var(--tone-${tone})`,
        display: 'grid',
        placeItems: 'center',
        flex: 'none',
      }}
    >
      <Icon name={icon} size={22} variant="duotone" />
    </span>
    <span style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <span style={{ fontSize: 'var(--fs-row)', fontWeight: 500 }}>{title}</span>
      <span style={{ fontSize: 'var(--fs-sub)', color: 'var(--muted)' }}>{sub}</span>
    </span>
  </div>
)

const CONTRACT = `// wg/Skeleton.tsx - implement to match.
interface SkeletonHostProps {
  loaded: boolean
  skeleton: ReactNode      // the placeholder, in the CONTENT'S OWN shape
  children: ReactNode      // the content it resolves into
}
// Two layers in one cell (grid-area 1/1 on web; position absolute + a sized
// container natively). Skeleton above until loaded, then:
//   skeleton: opacity 1 -> 0, blur 0 -> revealBlur
//   content:  opacity 0 -> 1, blur revealBlur -> 0, untouchable until readable
// both over revealDur with the reveal ease (motion.named.pulse group).
//
// The pulse rides the BARS, not the layer (the layer's opacity belongs to the
// cross-fade; animating both fights): each bar loops opacity 1 -> pulseMin ->
// 1. The feed skeleton dips to 0.5 and breathes exactly twice - two beats
// that fill the hold, so content arrives on a full-opacity beat instead of
// catching the pulse mid-dim.
//
// Shapes are built from the same row tokens as the content (row rhythm, chip
// rungs), so the placeholder sits exactly where the row will and density/text
// settings move both together. And the skeleton never knows the real counts -
// a skeleton that knew how many mails you had would be claiming to have
// loaded them. One screenful is the honest amount.`

export const SkeletonDoc = () => {
  const [revealed, setRevealed] = useState(false)
  const [resetting, setResetting] = useState(false)
  const raf = useRef(0)

  const replay = () => {
    setResetting(true)
    setRevealed(false)
    cancelAnimationFrame(raf.current)
    raf.current = requestAnimationFrame(() => {
      setResetting(false)
      raf.current = requestAnimationFrame(() => setRevealed(true))
    })
  }

  return (
    <>
      <p className="wgd-lead">
        A feed, drawn before it has anything to say. The placeholder is built from the same row tokens as
        the rows it stands in for, pulses while the wait lasts, and resolves through a cross-fade with a
        cross-blur - content arriving, not a curtain lifting.
      </p>

      <DocSection title="Specimen">
        <div className="wgd-playbar">
          <button type="button" className="wgd-play" onClick={replay}>
            Play the reveal
          </button>
          <button type="button" className="wgd-play" onClick={() => { setResetting(false); setRevealed(false) }}>
            Back to loading
          </button>
        </div>
        <Stage ground="panel">
          <div
            className={`wg-skel${revealed ? ' is-revealed' : ''}${resetting ? ' is-resetting' : ''}`}
            style={{ width: 340 }}
          >
            <PanelSkeleton groups={[2]} />
            <div className="wg-skel__content">
              {}
              <p style={{ margin: 'var(--space-4)', fontSize: 15, lineHeight: '15px' }}>
                Two meetings moved while you slept.
              </p>
              {}
              <p style={{ margin: '0 var(--space-4)', fontSize: 16, fontWeight: 500, lineHeight: '19px' }}>Today</p>
              {}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--list-gap)' }}>
                <ContentRow icon="plane" tone="blue" title="Flight to Dubai" sub="Checked in, gate at 6:40" />
                <ContentRow icon="check" tone="mint" title="Visa photos sent" sub="Handled this morning" />
              </div>
            </div>
          </div>
        </Stage>
        <Note>
          The real machinery: the placeholder blurs out as the content blurs in, and nothing under the
          content is tappable until it is readable.
        </Note>
      </DocSection>

      <DocSection title="Anatomy">
        <Anatomy
          rows={[
            { part: 'Two layers, one cell', spec: 'Skeleton and content share the cell; the cross-fade swaps them over --reveal-dur with --reveal-ease and --reveal-blur.' },
            { part: 'Pulse', spec: 'Rides the bars, not the layer. Dips to 0.5 and breathes exactly twice - the beats fill --skel-hold, so content lands on a full-opacity beat.' },
            { part: 'Shapes', spec: 'Built from the row tokens (row rhythm, chip rungs), so density and text-size settings move placeholder and content together.' },
            { part: 'Honesty', spec: 'The skeleton never mirrors real counts. One screenful, always.' },
          ]}
        />
      </DocSection>

      <DocSection title="Behaviour">
        <Behaviour
          rows={[
            { state: 'While loading', rule: 'Content is present but invisible and untouchable (pointer events off) until it is readable.' },
            { state: 'Reveal', rule: 'Opacity and blur cross over together; the app reads the duration off the tokens so JS timing cannot drift from CSS.' },
            { state: 'Reduced motion', rule: 'The pulse stops; the reveal collapses to a swap.' },
          ]}
        />
      </DocSection>

      <DocSection title="React Native">
        <Trap>
          Blur on content is the expensive part natively. The contract keeps the cross-blur as intent:
          implement it where the platform gives it cheaply, and degrade to the opacity cross-fade alone
          where it does not - the fade is the load-bearing half of the motion.
        </Trap>
        <Contract label="wg/Skeleton.tsx" code={CONTRACT} />
      </DocSection>
    </>
  )
}
