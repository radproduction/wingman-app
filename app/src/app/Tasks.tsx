import { Fragment, useEffect, useRef, useState } from 'react'
import { AppHeader } from './AppHeader'
import { Icon, IconCheck, IconPlus, IconSpark } from './icons'
import { PanelSkeleton } from './Skeleton'
import { ActionSheet } from './ActionSheet'
import { ActionRow } from './Widgets'
import { type TaskItem } from '../data/mock'
import { useFeedLoad } from '../data/loading'
import { useTasks, toggleTask } from '../data/tasks'
import { openActionItems, useActionItems } from '../data/actionItems'
import { t, tx } from '../i18n'
import { toast } from '../shell/toast'
import { tapQuiet } from '../shell/feedback'
import { usePullToRefresh } from '../shell/usePullToRefresh'
import { PullSpacer } from '../shell/PullSpacer'
import './app.css'
import './dashboard.css'

const TaskRow = ({ t: task, done }: { t: TaskItem; done: boolean }) => {
  const check = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    check.current?.querySelectorAll('path').forEach((p) => {
      p.style.setProperty('--check-len', String(Math.ceil(p.getTotalLength()) + 1))
    })
  }, [])

  const tap = () => {
    tapQuiet()
    toggleTask(task.title)
    if (!done)
      toast(t('Done. Off your plate.'), 'checkCircle', 4000, {
        label: t('Undo'),
        onAct: () => toggleTask(task.title),
      })
  }

  return (
    <button
      className={`wg-task wg-card-line ${done ? 'done' : ''}`}
      onClick={tap}
      aria-pressed={done}
      aria-label={
        done ? t('Completed: {title}', { title: t(task.title) }) : t('Complete: {title}', { title: t(task.title) })
      }
    >
      <span className="wg-task__check" ref={check} aria-hidden="true">
        <IconCheck size={14} />
      </span>
      <div className="wg-task__tx">
        <div className="wg-task__title">{t(task.title)}</div>
        {task.source && (
          <span className={`wg-task__src ${task.tone}`}>
            <Icon name={task.icon} size={12} /> {t(task.source)}
          </span>
        )}
      </div>
      <span className="wg-task__due">{t(task.due)}</span>
    </button>
  )
}

export const Tasks = () => {
  const { groups, done, openCount } = useTasks()
  const allActions = useActionItems()
  const openActions = openActionItems(allActions)
  const doneActions = allActions.filter((a) => a.status === 'done')
  const [edit, setEdit] = useState<string | null>(null)
  const { revealed, showSkeleton, reload } = useFeedLoad()
  const scrollRef = useRef<HTMLDivElement>(null)
  const screenRef = useRef<HTMLDivElement>(null)
  usePullToRefresh({ scrollerRef: scrollRef, hostRef: screenRef, onRefresh: reload })

  return (
    <div className="gh">
      <div className="wg-screen wg-tasks" ref={screenRef}>
        <AppHeader />
        <PullSpacer />

        {}
        {}
        <section className="wg-panel">
          <div className="wg-panel__scroll" ref={scrollRef}>
            <div className={`wg-skel ${revealed ? 'is-revealed' : ''}`} aria-busy={!revealed}>
              {}
              {showSkeleton && <PanelSkeleton groups={[3]} chip={24} />}

              <div className="wg-skel__content" aria-hidden={!revealed}>
                <div className="wg-brief-line">
                  <IconSpark size={16} />
                  <span>
                    {openCount + openActions.length === 0
                      ? tx("Nothing left on your plate. I've cleared {done} with you today.", {
                          done: <b>{done.length + doneActions.length}</b>,
                        })
                      : tx("{open} on your plate. I've cleared {done} in the background.", {
                          open: <b>{openCount + openActions.length}</b>,
                          done: <b>{done.length + doneActions.length}</b>,
                        })}
                  </span>
                </div>

                {}
                <div className="wg-panel-head">
                  <h2>{t('Tasks')}</h2>
                  <span>{openActions.length}</span>
                </div>
                {openActions.length === 0 ? (
                  <div className="wg-brief-line">
                    <IconCheck size={16} />
                    <span>{t('No tasks open. I create them from your meetings, and you can add one yourself.')}</span>
                  </div>
                ) : (
                  <div className="wg-set-list wg-card-line wg-att__list">
                    {openActions.map((a) => (
                      <ActionRow a={a} key={a.id} onOpen={() => setEdit(a.id)} />
                    ))}
                  </div>
                )}
                <button className="wg-btn full soft" onClick={() => setEdit('new')}>
                  <IconPlus size={16} /> {t('Add a task')}
                </button>

                {}
                {groups.map((g) =>
                  g.items.length === 0 ? null : (
                    <Fragment key={g.title}>
                      <div className="wg-panel-head">
                        <h2>{t(g.title)}</h2>
                        <span>{g.items.length}</span>
                      </div>
                      <div className="wg-task-list">
                        {g.items.map((t) => (
                          <TaskRow t={t} done={false} key={t.title} />
                        ))}
                      </div>
                    </Fragment>
                  ),
                )}

                {done.length + doneActions.length > 0 && (
                  <>
                    <div className="wg-panel-head">
                      <h2>{t('Done')}</h2>
                      <span>{done.length + doneActions.length}</span>
                    </div>
                    {doneActions.length > 0 && (
                      <div className="wg-set-list wg-card-line wg-att__list">
                        {doneActions.map((a) => (
                          <ActionRow a={a} key={a.id} onOpen={() => setEdit(a.id)} />
                        ))}
                      </div>
                    )}
                    <div className="wg-task-list">
                      {done.map((t) => (
                        <TaskRow t={t} done key={t.title} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        <ActionSheet
          open={edit !== null}
          onClose={() => setEdit(null)}
          edit={edit && edit !== 'new' ? allActions.find((a) => a.id === edit) : undefined}
        />
      </div>
    </div>
  )
}
