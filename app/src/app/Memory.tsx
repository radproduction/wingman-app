import { Fragment, useEffect, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Icon, IconSpark, type IconName } from './icons'
import { Sheet } from '../shell/Sheet'
import { confirmAction } from '../shell/confirm'
import { toast } from '../shell/toast'
import { tapQuiet } from '../shell/feedback'
import { forget, setFact, useBrainFacts, useNotes } from '../data/memory'
import { brain as brainSeed, memory as memorySeed, type ChipTone } from '../data/mock'
import { localize, t, tx } from '../i18n'
import './app.css'

const MemRow = ({
  icon,
  tone,
  text,
  source,
  value,
  action,
  onTap,
}: {
  icon?: IconName
  tone?: ChipTone
  text: string
  source: string
  value?: string
  action: IconName
  onTap: () => void
}) => (
  <button className="wg-mem wg-card-line" onClick={onTap}>
    {icon && (
      <span className={`wg-chip ${tone} xs`}>
        <Icon name={icon} size={17} variant="duotone" />
      </span>
    )}
    <span className="wg-mem__tx">
      <span className="wg-mem__top">
        <span className="wg-mem__text">{text}</span>
        {value && <span className="wg-mem__val">{value}</span>}
      </span>
      <span className="wg-mem__source">{source}</span>
    </span>
    <Icon name={action} size={17} className="wg-mem__act" />
  </button>
)


export const Memory = () => {
  const notes = localize(useNotes())
  const memory = localize(memorySeed)

  const askForget = async (id: string, text: string) => {
    tapQuiet()
    const ok = await confirmAction({
      title: t('Forget this?'),
      body: t(
        `"{note}" I'll stop using it from the next thing I do. It won't undo anything I've already done for you.`,
        { note: text },
      ),
      confirmLabel: t('Forget it'),
      destructive: true,
    })
    if (!ok) return
    forget(id)
    toast(t('Forgotten.'), 'check')
  }

  return (
    <SubScreen title="What I remember" back="settings/privacy" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>
          {notes.length === 1
            ? tx(
                '{count} note. Every one of them came from something you did or said, and you can take any of it back.',
                { count: <b>{notes.length}</b> },
              )
            : tx(
                '{count} notes. Every one of them came from something you did or said, and you can take any of it back.',
                { count: <b>{notes.length}</b> },
              )}
        </span>
      </div>

      {notes.length === 0 ? (
        <div className="wg-empty wg-card-line">
          <span className="wg-chip lavender md">
            <Icon name="spark" size={22} variant="duotone" />
          </span>
          <strong>{t('Nothing on file')}</strong>
          <p>{t("I've forgotten all of it. I'll start again from whatever you tell me next.")}</p>
        </div>
      ) : (
        memory.groups.map((group) => {
          const inGroup = notes.filter((n) => n.group === group)
          if (!inGroup.length) return null
          return (
            <Fragment key={group}>
              <div className="wg-panel-head">
                <h2>{group}</h2>
              </div>
              <div className="wg-row-list">
                {inGroup.map((n) => (
                  <MemRow
                    key={n.id}
                    text={n.text}
                    source={n.source}
                    action="trash"
                    onTap={() => askForget(n.id, n.text)}
                  />
                ))}
              </div>
            </Fragment>
          )
        })
      )}

      <p className="wg-footnote">
        {t('I keep what helps me act for you and nothing else. This is never sold, and never used to train models.')}
      </p>
    </SubScreen>
  )
}


export const BusinessBrain = () => {
  const facts = localize(useBrainFacts())
  const brain = localize(brainSeed)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const fact = facts.find((f) => f.id === editing)

  useEffect(() => {
    if (fact) setDraft(fact.value)
  }, [editing, fact])

  const save = () => {
    if (!fact || !draft.trim()) return
    setFact(fact.id, draft.trim())
    setEditing(null)
    toast(t('{rule} is {value} from now on.', { rule: fact.name, value: draft.trim() }), 'check')
  }

  return (
    <SubScreen title="Business Brain" back="business" className="wg-settings">
      <div className="wg-brief-line">
        <IconSpark size={16} />
        <span>{brain.brief}</span>
      </div>

      <div className="wg-panel-head">
        <h2>{t('What I hold you to')}</h2>
      </div>
      <div className="wg-row-list">
        {facts.map((f) => (
          <MemRow
            key={f.id}
            icon={f.icon}
            tone={f.tone}
            text={f.name}
            value={f.value}
            source={f.yours ? t('You changed this') : f.source}
            action="chevronRight"
            onTap={() => {
              tapQuiet()
              setEditing(f.id)
            }}
          />
        ))}
      </div>

      <p className="wg-footnote">
        {t('I never act on these alone. They decide what I recommend and what I refuse to recommend.')}
      </p>

      <Sheet open={!!fact} onClose={() => setEditing(null)} labelledBy="wm-fact-title">
        <h2 className="wm-sheet__title" id="wm-fact-title">
          {fact?.name}
        </h2>
        <p className="wm-sheet__body-tx">{fact?.hint ?? fact?.source}</p>
        <div className="wg-field">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} autoFocus />
        </div>
        <div className="wm-sheet__acts">
          <button className="wg-btn full" onClick={save} disabled={!draft.trim()}>
            {t('Use this from now on')}
          </button>
          <button className="wg-btn full quiet" onClick={() => setEditing(null)}>
            {t('Cancel')}
          </button>
        </div>
      </Sheet>
    </SubScreen>
  )
}
