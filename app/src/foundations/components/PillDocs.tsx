import { Note, Trap } from '../parts'
import { Anatomy, Behaviour, Contract, DocSection, Stage } from './docParts'


const TAG_CONTRACT = `// wg/Tag.tsx - implement to match.
interface TagProps { label: string; tone?: 'lavender' | 'sand' }
// 12/500, lineHeight 12 * pillLine, radius pill, padding [4, 12].
// Ground/ink: chipLavender/toneLavender by default; the sand pair exists so
// two tags stacked in one feed do not echo each other (Wingman's Day).`

export const TagDoc = () => (
  <>
    <p className="wgd-lead">
      The badge on a card's head naming the feature that produced it - "Focus", "Wingman's Day". Lavender
      by default; sand exists only so two tags in one feed do not echo each other.
    </p>
    <DocSection title="Specimen">
      <Stage ground="home">
        <span className="wg-tag">Focus</span>
        <span className="wg-tag" style={{ background: 'var(--chip-sand)', color: 'var(--tone-sand-text)' }}>
          Wingman's Day
        </span>
      </Stage>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Pill', spec: 'Radius pill, padding --space-4 block / --space-12 inline, 12/500, line box --pill-line.' },
          { part: 'Tones', spec: 'Lavender (default) and sand (the de-echo pair). Not the six-tone palette: a tag names a feature, not an identity.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour rows={[{ state: 'Static', rule: 'Never pressable, never a filter. A pill that filters is a chip rail; a pill that reports state is a State or Status pill.' }]} />
    </DocSection>
    <DocSection title="React Native">
      <Contract label="wg/Tag.tsx" code={TAG_CONTRACT} />
    </DocSection>
  </>
)


const FLAG_CONTRACT = `// wg/TonePill.tsx - implement to match.
type ChipTone = 'blue' | 'lavender' | 'mint' | 'peach' | 'sand' | 'rose'
interface TonePillProps { label: string; tone: ChipTone; icon?: ReactNode }
// 11/500, lineHeight 11 * pillLine, radius pill, padding [4, 8], icon gap 4.
// Ground: theme.palette.*.chip<Tone>. Ink: the -text variant where one exists
// (lavender/peach/sand), else the tone itself - small text needs the deeper
// step the glyph does not.`

export const TonePillDoc = () => (
  <>
    <p className="wgd-lead">
      A label that carries an identity in a chip tone: "overdue" in rose, "blocked" in sand. The chip
      palette rather than a new one, because these are identities and identity is what chip tones are
      for; the alert red stays reserved for the header's unread dot.
    </p>
    <DocSection title="Specimen">
      <Stage ground="home">
        {(
          [
            ['rose', 'Overdue'],
            ['sand', 'Blocked'],
            ['peach', 'Waiting on you'],
            ['blue', 'Scheduled'],
            ['lavender', 'Delegated'],
            ['mint', 'On track'],
          ] as const
        ).map(([tone, label]) => (
          <span key={tone} className={`wg-flag ${tone}`}>
            {label}
          </span>
        ))}
      </Stage>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Pill', spec: 'Radius pill, padding --space-4 block / --space-8 inline, 11/500, optional leading glyph on a --space-4 gap.' },
          { part: 'Ink rule', spec: 'The -text variant of the tone where one exists (lavender, peach, sand): small text on a pale pill runs a step deeper than the glyph beside it.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Never colour alone', rule: 'The tone accompanies the word; it never replaces it. A tone-only dot is not this component.' },
          { state: 'Alert red', rule: 'Not in this palette. Overdue is the calm rose; the bright alert stays reserved.' },
        ]}
      />
    </DocSection>
    <DocSection title="React Native">
      <Contract label="wg/TonePill.tsx" code={FLAG_CONTRACT} />
    </DocSection>
  </>
)


const STATE_CONTRACT = `// wg/StatePill.tsx - implement to match.
type IntelState = 'auto' | 'approved' | 'recommended' | 'waiting' | 'insight' | 'notDone'
interface StatePillProps { state: IntelState; label: string }
// 11/600, radius pill, padding [4, 8], nowrap, flex: none.
// Pairs (ink on ground): auto ok/okTonal; approved accentDeep/accentTonal;
// recommended toneLavender/chipLavender; waiting warn/warnTonal;
// insight tonePeach/chipPeach; notDone muted/cardTonal.`

export const StatePillDoc = () => (
  <>
    <p className="wgd-lead">
      Where a Daily Intelligence item stands: handled automatically, approved by you, recommended,
      waiting, an insight, or not done. One closed vocabulary, so the same state always wears the same
      colour everywhere it appears.
    </p>
    <DocSection title="Specimen">
      <Stage ground="home">
        {(
          [
            ['auto', 'Handled'],
            ['approved', 'Approved'],
            ['recommended', 'Recommended'],
            ['waiting', 'Waiting'],
            ['insight', 'Insight'],
            ['not-done', 'Not done'],
          ] as const
        ).map(([state, label]) => (
          <span key={state} className={`wg-state ${state}`}>
            {label}
          </span>
        ))}
      </Stage>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Pill', spec: 'Radius pill, padding --space-4/--space-8, 11 at weight 600 (one of the few 600s in the app), nowrap.' },
          { part: 'Vocabulary', spec: 'Six states, closed. A new state is a design decision, not a new colour pair at a call site.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour rows={[{ state: 'Consistency', rule: 'The same state wears the same pair on every screen. The pill is the vocabulary; screens only speak it.' }]} />
    </DocSection>
    <DocSection title="React Native">
      <Contract label="wg/StatePill.tsx" code={STATE_CONTRACT} />
    </DocSection>
  </>
)


const MSTATUS_CONTRACT = `// wg/StatusPill.tsx - implement to match.
type MeetingStatus = 'go' | 'wait' | 'live' | 'done' | 'off'
interface StatusPillProps { status: MeetingStatus; label: string }
// 11.5/600, radius pill, padding [4, 8], icon/dot gap 4.
// Pairs: go ok/okTonal; wait warn/warnTonal; live toneRose/chipRose;
// done muted/cardTonal; off muted on transparent with a 1 line-strong ring
// (a border natively, with a transparent twin on the filled states).
// live carries the breathing dot: the app's ONE "happening right now"
// indicator, riding the shared pulse tokens - reduced motion stops it.`

export const StatusPillDoc = () => (
  <>
    <p className="wgd-lead">
      Where a meeting stands: ready to go, waiting, live, done, or off. The live state carries the app's
      one "happening right now" indicator - a breathing dot on the shared pulse beat.
    </p>
    <DocSection title="Specimen">
      <Stage ground="home">
        {(
          [
            ['go', 'Ready'],
            ['wait', 'Needs consent'],
            ['live', 'Live'],
            ['done', 'Summarised'],
            ['off', 'Not recorded'],
          ] as const
        ).map(([status, label]) => (
          <span key={status} className={`wg-mstatus ${status}`}>
            {status === 'live' ? <i className="dot" /> : null}
            {label}
          </span>
        ))}
      </Stage>
      <Note>The off state is the one outlined pill in the app: transparent ground, hairline ring.</Note>
    </DocSection>
    <DocSection title="Anatomy">
      <Anatomy
        rows={[
          { part: 'Pill', spec: 'Radius pill, padding --space-4/--space-8, 11.5 at weight 600, leading dot on a --space-4 gap.' },
          { part: 'Live dot', spec: "Breathes on :root's own pulse tokens - the same beat as the in-flight approval dot, not a number of its own. Both reduced-motion layers stop it." },
          { part: 'Off ring', spec: 'Inset 1px --line-strong ring on transparent. Natively a border, with a transparent twin on the filled states so the geometry holds.' },
        ]}
      />
    </DocSection>
    <DocSection title="Behaviour">
      <Behaviour
        rows={[
          { state: 'Live', rule: 'The only state with motion. It means happening right now, and nothing else in the app is allowed to breathe.' },
          { state: 'Vs State pill', rule: 'This is the meeting vocabulary; the intelligence vocabulary is the State pill. They are not interchangeable.' },
        ]}
      />
    </DocSection>
    <DocSection title="React Native">
      <Trap>
        The live dot's breathing is a looped opacity animation on the pulse duration - Reanimated
        <code> withRepeat(withTiming(...))</code>, opacity only, killed under reduced motion. The off
        state's ring is a border; give the filled states a transparent border of the same width or the
        pill grows when it switches.
      </Trap>
      <Contract label="wg/StatusPill.tsx" code={MSTATUS_CONTRACT} />
    </DocSection>
  </>
)
