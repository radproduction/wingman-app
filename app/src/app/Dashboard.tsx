import { useCallback, useEffect, useRef, useState } from 'react'
import { Sheet } from '../shell/Sheet'
import { Icon, IconPlus } from './icons'
import { ActionSheet } from './ActionSheet'
import { BARE, WidgetBody } from './Widgets'
import {
  SIZE_LABEL,
  addWidget,
  availableWidgets,
  moveWidget,
  nextSize,
  removeWidget,
  resetDashboard,
  resizeWidget,
  useDashboard,
  useIsDefaultDashboard,
  widgetDef,
  type Widget,
  type WidgetSize,
  type WidgetType,
} from '../data/dashboard'
import { t } from '../i18n'
import { confirmAction } from '../shell/confirm'
import { toast } from '../shell/toast'
import { tapQuiet } from '../shell/feedback'
import './dashboard.css'



const DRAG_SLOP = 6
const EDGE = 72
const EDGE_SPEED = 10

type DragState = {
  id: string
  index: number
  pointerId: number
  grabX: number
  grabY: number
  startX: number
  startY: number
  moved: boolean
}

const useWidgetDrag = (items: Widget[], editing: boolean) => {
  const nodes = useRef(new Map<string, HTMLElement>())
  const drag = useRef<DragState | null>(null)
  const pointer = useRef({ x: 0, y: 0 })
  const frame = useRef(0)
  const [dragId, setDragId] = useState<string | null>(null)
  const list = useRef(items)
  list.current = items

  const register = useCallback((id: string, el: HTMLElement | null) => {
    if (el) nodes.current.set(id, el)
    else nodes.current.delete(id)
  }, [])

  const stop = useCallback(() => {
    cancelAnimationFrame(frame.current)
    frame.current = 0
    const d = drag.current
    if (d) {
      const node = nodes.current.get(d.id)
      if (node) node.style.transform = ''
    }
    drag.current = null
    setDragId(null)
  }, [])

  const tick = useCallback(() => {
    frame.current = requestAnimationFrame(tick)
    const d = drag.current
    if (!d || !d.moved) return
    const node = nodes.current.get(d.id)
    if (!node) return

    const scroller = node.closest('.wg-panel__scroll') as HTMLElement | null
    if (scroller) {
      const box = scroller.getBoundingClientRect()
      if (pointer.current.y < box.top + EDGE) scroller.scrollTop -= EDGE_SPEED
      else if (pointer.current.y > box.bottom - EDGE) scroller.scrollTop += EDGE_SPEED
    }

    node.style.transform = 'none'
    const nat = node.getBoundingClientRect()
    node.style.transform = `translate(${pointer.current.x - d.grabX - nat.left}px, ${
      pointer.current.y - d.grabY - nat.top
    }px)`

    for (const [id, el] of nodes.current) {
      if (id === d.id) continue
      const r = el.getBoundingClientRect()
      if (
        pointer.current.x >= r.left &&
        pointer.current.x <= r.right &&
        pointer.current.y >= r.top &&
        pointer.current.y <= r.bottom
      ) {
        const to = list.current.findIndex((w) => w.id === id)
        if (to >= 0 && to !== d.index) {
          moveWidget(d.index, to)
          d.index = to
        }
        break
      }
    }
  }, [])

  const onPointerDown = useCallback(
    (e: React.PointerEvent, id: string, index: number) => {
      if (!editing) return
      if ((e.target as HTMLElement).closest('.wg-wgt__ctrl')) return
      const node = nodes.current.get(id)
      if (!node) return
      e.stopPropagation()
      const r = node.getBoundingClientRect()
      drag.current = {
        id,
        index,
        pointerId: e.pointerId,
        grabX: e.clientX - r.left,
        grabY: e.clientY - r.top,
        startX: e.clientX,
        startY: e.clientY,
        moved: false,
      }
      pointer.current = { x: e.clientX, y: e.clientY }
      node.setPointerCapture?.(e.pointerId)
      if (!frame.current) frame.current = requestAnimationFrame(tick)
    },
    [editing, tick],
  )

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current
    if (!d || e.pointerId !== d.pointerId) return
    pointer.current = { x: e.clientX, y: e.clientY }
    if (!d.moved) {
      if (Math.abs(e.clientX - d.startX) < DRAG_SLOP && Math.abs(e.clientY - d.startY) < DRAG_SLOP) return
      d.moved = true
      setDragId(d.id)
    }
    e.preventDefault()
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      const d = drag.current
      if (!d || e.pointerId !== d.pointerId) return
      nodes.current.get(d.id)?.releasePointerCapture?.(e.pointerId)
      stop()
    },
    [stop],
  )

  useEffect(() => {
    if (!editing) stop()
    return () => cancelAnimationFrame(frame.current)
  }, [editing, stop])

  return { register, dragId, onPointerDown, onPointerMove, onPointerUp }
}


const GalleryRow = ({ type, onAdd }: { type: WidgetType; onAdd: (size: WidgetSize) => void }) => {
  const def = widgetDef(type)!
  const [size, setSize] = useState<WidgetSize>(def.defaultSize)
  const chosen = useRef(size)
  const pick = (s: WidgetSize) => {
    chosen.current = s
    setSize(s)
  }
  return (
    <div className="wg-gal__row">
      <span className={`wg-chip ${def.tone} sm`}>
        <Icon name={def.icon} size={20} variant="duotone" />
      </span>
      <span className="wg-gal__tx">
        <strong>{t(def.name)}</strong>
        <span>{t(def.desc)}</span>
        <span className="wg-gal__sizes" role="group" aria-label={t('Size')}>
          {def.sizes.length > 1 ? (
            def.sizes.map((s) => (
              <button
                className={`wg-gal__size ${size === s ? 'on' : ''}`}
                key={s}
                aria-pressed={size === s}
                onClick={() => pick(s)}
              >
                {t(SIZE_LABEL[s])}
              </button>
            ))
          ) : (
            <span className="wg-gal__size is-fixed">{t(SIZE_LABEL[def.defaultSize])}</span>
          )}
        </span>
      </span>
      <button
        className="wg-gal__add"
        aria-label={t('Add {name}', { name: t(def.name) })}
        onClick={() => onAdd(chosen.current)}
      >
        <IconPlus size={18} />
      </button>
    </div>
  )
}

const Gallery = ({ open, onClose, items }: { open: boolean; onClose: () => void; items: Widget[] }) => {
  const available = availableWidgets(items)
  return (
    <Sheet open={open} onClose={onClose} labelledBy="wg-gal-title">
      <h2 className="wm-sheet__title" id="wg-gal-title">
        {t('Add a widget')}
      </h2>
      <p className="wm-sheet__body-tx">
        {available.length > 0
          ? t('Pick a size, then add it. You can move and resize everything once it is on your dashboard.')
          : t('Every widget is already on your dashboard. Remove one to see it here again.')}
      </p>
      {available.length > 0 && (
        <div className="wg-gal">
          {available.map((d) => (
            <GalleryRow
              key={d.type}
              type={d.type}
              onAdd={(size) => {
                tapQuiet()
                addWidget(d.type, size)
                toast(t('{name} added to your dashboard.', { name: t(d.name) }), 'checkCircle')
              }}
            />
          ))}
        </div>
      )}
      <div className="wm-sheet__acts">
        <button className="wg-btn full quiet" onClick={onClose}>
          {t('Done')}
        </button>
      </div>
    </Sheet>
  )
}


export const Dashboard = ({ editing, onDone }: { editing: boolean; onDone: () => void }) => {
  const items = useDashboard()
  const isDefault = useIsDefaultDashboard()
  const [gallery, setGallery] = useState(false)
  const [capture, setCapture] = useState(false)
  const { register, dragId, onPointerDown, onPointerMove, onPointerUp } = useWidgetDrag(items, editing)

  const reset = async () => {
    const ok = await confirmAction({
      title: 'Restore the default dashboard?',
      body: 'Your widgets go back to the six I ship with, at their original sizes. Nothing else changes - no data is touched.',
      confirmLabel: 'Restore default',
      cancelLabel: 'Keep mine',
    })
    if (!ok) return
    resetDashboard()
    toast(t('Dashboard restored to the default.'), 'checkCircle')
  }

  const remove = (w: Widget) => {
    const def = widgetDef(w.type)!
    tapQuiet()
    removeWidget(w.id)
    toast(t('{name} removed.', { name: t(def.name) }), 'check', 5000, {
      label: t('Undo'),
      onAct: () => addWidget(w.type, w.size),
    })
  }

  const cycle = (w: Widget) => {
    const size = nextSize(w.type, w.size)
    tapQuiet()
    resizeWidget(w.id, size)
  }

  const onKeyDown = (e: React.KeyboardEvent, w: Widget, i: number) => {
    if (!editing) return
    const def = widgetDef(w.type)!
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
      e.preventDefault()
      moveWidget(i, Math.max(0, i - 1))
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
      e.preventDefault()
      moveWidget(i, Math.min(items.length - 1, i + 1))
    } else if (e.key === 'Enter' || e.key === ' ') {
      if (def.sizes.length < 2) return
      e.preventDefault()
      cycle(w)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      remove(w)
    }
  }

  return (
    <>
      {editing && (
        <div className="wg-dedit">
          <div className="wg-dedit__tx">
            <strong>{t('Customising your dashboard')}</strong>
            <span>{t('Drag a widget to move it, tap its size to change it, or remove it with the cross.')}</span>
          </div>
          {!isDefault && (
            <button className="wg-btn sm quiet" onClick={reset}>
              {t('Reset')}
            </button>
          )}
          <button className="wg-btn sm" onClick={onDone}>
            {t('Done')}
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <div className="wg-dempty">
          <span className="wg-chip blue md">
            <Icon name="grid" size={24} variant="duotone" />
          </span>
          <h2>{t('An empty dashboard')}</h2>
          <p>
            {t(
              'Nothing here yet. Add the widgets you want to glance at - what needs you, your meetings, your tasks - and arrange them however you like.',
            )}
          </p>
          <button className="wg-btn" onClick={() => setGallery(true)}>
            {t('Add a widget')}
          </button>
          {!isDefault && (
            <button className="wg-btn-text" onClick={reset}>
              {t('Restore the default')}
            </button>
          )}
        </div>
      ) : (
        <div
          className={`wg-wgrid ${editing ? 'edit' : ''}`}
          data-drag-scroll={editing ? 'off' : undefined}
          onPointerMove={editing ? onPointerMove : undefined}
          onPointerUp={editing ? onPointerUp : undefined}
          onPointerCancel={editing ? onPointerUp : undefined}
        >
          {items.map((w, i) => {
            const def = widgetDef(w.type)!
            const bare = BARE.includes(w.type)
            return (
              <div
                key={w.id}
                ref={(el) => register(w.id, el)}
                className={`wg-wgt ${w.size} ${bare ? 'bare' : ''} ${dragId === w.id ? 'dragging' : ''}`}
                onPointerDown={editing ? (e) => onPointerDown(e, w.id, i) : undefined}
                onKeyDown={(e) => onKeyDown(e, w, i)}
                tabIndex={editing ? 0 : undefined}
                role={editing ? 'listitem' : undefined}
                aria-label={
                  editing
                    ? t('{name}, {size}, position {i} of {n}. Arrow keys move it, Enter changes its size, Delete removes it.', {
                        name: t(def.name),
                        size: t(SIZE_LABEL[w.size]),
                        i: i + 1,
                        n: items.length,
                      })
                    : undefined
                }
              >
                {editing && (
                  <>
                    <button
                      className="wg-wgt__ctrl wg-wgt__rm"
                      aria-label={t('Remove {name}', { name: t(def.name) })}
                      onClick={() => remove(w)}
                    >
                      <Icon name="close" size={15} />
                    </button>
                    {def.sizes.length > 1 && (
                      <button
                        className="wg-wgt__ctrl wg-wgt__size"
                        aria-label={t('{name} size: {size}. Tap to change.', {
                          name: t(def.name),
                          size: t(SIZE_LABEL[w.size]),
                        })}
                        onClick={() => cycle(w)}
                      >
                        {t(SIZE_LABEL[w.size])}
                      </button>
                    )}
                  </>
                )}
                <WidgetBody type={w.type} size={w.size} onAdd={() => setCapture(true)} />
              </div>
            )
          })}

          {editing && (
            <button className="wg-wadd" onClick={() => setGallery(true)}>
              <IconPlus size={20} />
              {t('Add a widget')}
            </button>
          )}
        </div>
      )}

      <Gallery open={gallery} onClose={() => setGallery(false)} items={items} />
      <ActionSheet open={capture} onClose={() => setCapture(false)} />
    </>
  )
}
