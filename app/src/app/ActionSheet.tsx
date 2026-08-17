import { useEffect, useState } from 'react'
import { Sheet } from '../shell/Sheet'
import {
  ASSIGNEES,
  DUE_PRESETS,
  NO_DUE,
  PRIORITIES,
  addActionItem,
  updateActionItem,
  type ActionItem,
  type ActionPriority,
} from '../data/actionItems'
import { t } from '../i18n'
import { toast } from '../shell/toast'
import './app.css'
import './dashboard.css'

export const ActionSheet = ({
  open,
  onClose,
  edit,
  meetingId,
  meeting,
  project,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  edit?: ActionItem
  meetingId?: string
  meeting?: string
  project?: string
  onSaved?: (id: string) => void
}) => {
  const [title, setTitle] = useState('')
  const [owner, setOwner] = useState('')
  const [dueIn, setDueIn] = useState(NO_DUE)
  const [priority, setPriority] = useState<ActionPriority>('Medium')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (!open) return
    setTitle(edit?.title ?? '')
    setOwner(edit?.owner ?? '')
    setDueIn(edit?.dueIn ?? NO_DUE)
    setPriority(edit?.priority ?? 'Medium')
    setNote(edit?.note ?? '')
  }, [open, edit])

  const save = () => {
    const clean = title.trim()
    if (!clean) return
    if (edit) {
      updateActionItem(edit.id, { title: clean, owner, dueIn, priority, note: note.trim() || undefined })
      toast(t('Action item updated.'), 'checkCircle')
      onSaved?.(edit.id)
    } else {
      const id = addActionItem({ title: clean, owner, dueIn, priority, note, meetingId, meeting, project })
      toast(
        owner ? t('Assigned to {name}.', { name: owner }) : t('Added. Nobody is assigned yet.'),
        'checkCircle',
      )
      onSaved?.(id)
    }
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="wg-action-title">
      <h2 className="wm-sheet__title" id="wg-action-title">
        {edit ? t('Edit action item') : t('New action item')}
      </h2>
      {meeting && !edit && <p className="wm-sheet__body-tx">{t('From {name}', { name: t(meeting) })}</p>}

      <div className="wg-asheet">
        <label className="wg-field wg-asheet__field">
          <input
            value={title}
            autoFocus
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && save()}
            placeholder={t('What needs to happen?')}
            aria-label={t('What needs to happen?')}
          />
        </label>

        <div className="wg-asheet__group">
          <span className="wg-asheet__cap">{t('Assign to')}</span>
          <div className="wg-asheet__opts">
            <button className={`wg-gal__size ${owner === '' ? 'on' : ''}`} onClick={() => setOwner('')}>
              {t('Unassigned')}
            </button>
            {ASSIGNEES.map((name) => (
              <button
                className={`wg-gal__size ${owner === name ? 'on' : ''}`}
                key={name}
                onClick={() => setOwner(name)}
              >
                {t(name)}
              </button>
            ))}
          </div>
        </div>

        <div className="wg-asheet__group">
          <span className="wg-asheet__cap">{t('Due')}</span>
          <div className="wg-asheet__opts">
            {DUE_PRESETS.map((p) => (
              <button
                className={`wg-gal__size ${dueIn === p.dueIn ? 'on' : ''}`}
                key={p.label}
                onClick={() => setDueIn(p.dueIn)}
              >
                {t(p.label)}
              </button>
            ))}
          </div>
        </div>

        <div className="wg-asheet__group">
          <span className="wg-asheet__cap">{t('Priority')}</span>
          <div className="wg-asheet__opts">
            {PRIORITIES.map((p) => (
              <button className={`wg-gal__size ${priority === p ? 'on' : ''}`} key={p} onClick={() => setPriority(p)}>
                {t(p)}
              </button>
            ))}
          </div>
        </div>

        <div className="wg-asheet__group">
          <span className="wg-asheet__cap">{t('Context')}</span>
          <label className="wg-field wg-asheet__field">
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('Why it matters, or what was agreed')}
              aria-label={t('Context')}
            />
          </label>
        </div>
      </div>

      <div className="wm-sheet__acts">
        <button className="wg-btn full" disabled={!title.trim()} onClick={save}>
          {edit ? t('Save changes') : t('Add action item')}
        </button>
        <button className="wg-btn full quiet" onClick={onClose}>
          {t('Cancel')}
        </button>
      </div>
    </Sheet>
  )
}
