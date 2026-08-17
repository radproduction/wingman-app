import { useRef, useState } from 'react'
import { SubScreen } from './SubScreen'
import { Sheet } from '../shell/Sheet'
import { Icon, IconChevronR, IconSpark, type IconName } from './icons'
import { Switch } from '../shell/Switch'
import { ModeIcon } from './icons'
import {
  usePlaces,
  placeByKey,
  savePlace,
  removePlace,
  MODE_LABEL,
  TRAVEL_MODES,
  type TravelMode,
} from '../data/mobility'
import type { ChipTone } from '../data/mock'
import { t } from '../i18n'
import { navigate, goBack } from '../shell/nav'
import { confirmAction } from '../shell/confirm'
import { toast } from '../shell/toast'
import './app.css'
import './mobility.css'

export const SavedPlaces = () => {
  const places = usePlaces()

  return (
    <SubScreen title="Saved places" back="more" className="wg-mod" feedback="header">
      <div className="wg-bc__summary wg-card-line">
        <IconSpark size={18} />
        <p>{t('These are the places I plan your routes and leave-by reminders around. Add the ones you go to often.')}</p>
      </div>

      {places.length === 0 ? (
        <div className="wg-bc__summary wg-card-line">
          <Icon name="home" size={18} variant="duotone" />
          <p>{t('No places saved yet. Add Home and Office and I can watch your commute for you.')}</p>
        </div>
      ) : (
        <div className="wg-msteps">
          {places.map((p) => (
            <button className="wg-place wg-card-line" key={p.key} onClick={() => navigate(`places/${p.key}`)}>
              <span className={`wg-chip ${p.tone} sm`}>
                <Icon name={p.icon} size={19} variant="duotone" />
              </span>
              <span className="wg-place__tx">
                <span className="wg-place__name">{t(p.name)}</span>
                <span className="wg-place__addr">{t(p.address)}</span>
                <span className="wg-place__meta">
                  {t(MODE_LABEL[p.mode])} · {t('leaves {time}', { time: p.departure })}
                  {p.notify ? ` · ${t('reminders on')}` : ''}
                </span>
              </span>
              <IconChevronR size={18} className="chev" />
            </button>
          ))}
        </div>
      )}

      <button className="wg-btn full" onClick={() => navigate('places/new')}>
        <Icon name="addCircle" size={20} variant="duotone" />
        {t('Add a place')}
      </button>

      <div className="wg-panel-head">
        <h2>{t('Commute')}</h2>
      </div>
      <div className="wg-set-list wg-card-line">
        <button className="wg-set" onClick={() => navigate('commute')}>
          <span className="wg-chip blue xs">
            <Icon name="clock" size={17} variant="duotone" />
          </span>
          <span className="wg-set__name">{t('Commute preferences')}</span>
          <span className="wg-set__val">{t('Workdays, times, route')}</span>
          <IconChevronR size={18} className="chev" />
        </button>
      </div>
    </SubScreen>
  )
}

const PLACE_ICONS: IconName[] = [
  'pin', 'home', 'office', 'hotel', 'heart', 'gym', 'users',
  'plane', 'car', 'box', 'receipt', 'card', 'globe', 'sun',
]
const ICON_LABEL: Partial<Record<IconName, string>> = {
  pin: 'Other',
  home: 'Home',
  office: 'Office',
  hotel: 'Hotel',
  heart: 'Health',
  gym: 'Gym',
  users: 'Family',
  plane: 'Airport',
  car: 'Parking',
  box: 'Storage',
  receipt: 'Shop',
  card: 'Bank',
  globe: 'Travel',
  sun: 'Outdoors',
}
const PLACE_TONES: ChipTone[] = ['blue', 'lavender', 'mint', 'peach', 'sand', 'rose']

export const PlaceEdit = ({ placeKey }: { placeKey: string }) => {
  const isNew = placeKey === 'new'
  const existing = isNew ? undefined : placeByKey(placeKey)
  const [name, setName] = useState(existing ? existing.name : '')
  const [address, setAddress] = useState(existing?.address ?? '')
  const [mode, setMode] = useState<TravelMode>(existing?.mode ?? 'drive')
  const [departure, setDeparture] = useState(existing?.departure ?? '8:30 AM')
  const [notify, setNotify] = useState(existing?.notify ?? true)
  const [icon, setIcon] = useState<IconName>(existing?.icon ?? 'pin')
  const [tone, setTone] = useState<ChipTone>(existing?.tone ?? 'blue')
  const [pickerOpen, setPickerOpen] = useState(false)
  const snapshot = useRef<{ icon: IconName; tone: ChipTone }>({ icon, tone })
  const iconOptions = PLACE_ICONS.includes(icon) ? PLACE_ICONS : [icon, ...PLACE_ICONS]

  if (!isNew && !existing) {
    goBack('places')
    return null
  }

  const save = () => {
    const key = existing?.key ?? `p-${name.trim().toLowerCase().replace(/\s+/g, '-') || 'place'}`
    savePlace({
      key,
      name: name.trim() || t('Untitled place'),
      address: address.trim(),
      mode,
      departure,
      notify,
      icon,
      tone,
      builtin: existing?.builtin,
    })
    toast(t('Place saved.'), 'check')
    goBack('places')
  }

  const remove = async () => {
    if (!existing) return
    const ok = await confirmAction({
      title: t('Remove {name}?', { name: existing.name }),
      body: t('I will stop planning routes and reminders around it. You can add it again any time.'),
      confirmLabel: t('Remove it'),
      cancelLabel: t('Keep it'),
      destructive: true,
    })
    if (!ok) return
    removePlace(existing.key)
    toast(t('{name} removed.', { name: existing.name }), 'check')
    goBack('places')
  }

  const openPicker = () => {
    snapshot.current = { icon, tone }
    setPickerOpen(true)
  }
  const cancelPicker = () => {
    setIcon(snapshot.current.icon)
    setTone(snapshot.current.tone)
    setPickerOpen(false)
  }
  const donePicker = () => setPickerOpen(false)

  return (
    <SubScreen
      title={isNew ? 'Add a place' : 'Edit place'}
      back="places"
      className="wg-mod"
      feedback="header"
      footer={
        <div className="wg-foot-stack">
          <button className="wg-btn full" onClick={save}>
            {t('Save place')}
          </button>
          {existing && (
            <button className="wg-btn full danger" onClick={remove}>
              <Icon name="trash" size={18} variant="duotone" />
              {t('Remove place')}
            </button>
          )}
        </div>
      }
    >
      <div className="wg-place-name">
        <div className="wg-field">
          <label>{t('Name')}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('Home, Office, Gym…')} />
        </div>
        <button className="wg-place-name__chip" aria-label={t('Change icon and color')} onClick={openPicker}>
          <span className={`wg-chip lg ${tone}`}>
            <Icon name={icon} size={26} variant="duotone" />
          </span>
        </button>
      </div>

      <Sheet open={pickerOpen} onClose={cancelPicker} labelledBy="wg-pick-title">
        <h2 id="wg-pick-title" className="wm-sheet__title">
          {t('Icon and color')}
        </h2>
        <div className="wg-pick__colors">
          {PLACE_TONES.map((tn) => (
            <button
              key={tn}
              className={`wg-pick__color ${tone === tn ? 'on' : ''}`}
              aria-pressed={tone === tn}
              aria-label={tn}
              onClick={() => setTone(tn)}
              style={{ background: `var(--tone-${tn})` }}
            />
          ))}
        </div>
        <hr className="wg-pick__sep" />
        <div className="wg-pick__icons">
          {iconOptions.map((ic) => (
            <button
              key={ic}
              className={`wg-pick__icon ${icon === ic ? 'on' : ''}`}
              aria-pressed={icon === ic}
              aria-label={t(ICON_LABEL[ic] ?? ic)}
              onClick={() => setIcon(ic)}
            >
              <Icon name={ic} size={22} variant="duotone" />
            </button>
          ))}
        </div>
        <div className="wg-pick__cta">
          <button className="wg-btn quiet" onClick={cancelPicker}>
            {t('Cancel')}
          </button>
          <button className="wg-btn" onClick={donePicker}>
            {t('Done')}
          </button>
        </div>
      </Sheet>
      <div className="wg-field">
        <label>{t('Address')}</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder={t('Street, area')} />
      </div>

      <div className="wg-field">
        <label>{t('Leaves at')}</label>
        <input value={departure} onChange={(e) => setDeparture(e.target.value)} placeholder={t('8:30 AM')} />
      </div>

      <div className="wg-panel-head">
        <h2>{t('Default travel mode')}</h2>
      </div>
      <div className="wg-seg">
        {TRAVEL_MODES.map((m) => (
          <button key={m} className={mode === m ? 'on' : ''} aria-label={t(MODE_LABEL[m])} onClick={() => setMode(m)}>
            <span className="m">
              <ModeIcon mode={m} size={22} />
            </span>
          </button>
        ))}
      </div>

      <div className="wg-options">
        <button className={`wg-option wg-card-line wg-option--switch ${notify ? 'on' : ''}`} onClick={() => setNotify((v) => !v)}>
          <span className="tx">
            <strong>{t('Leave-by reminders')}</strong>
            <span>{t('I tell you when to go, based on live traffic')}</span>
          </span>
          <Switch on={notify} />
        </button>
      </div>
    </SubScreen>
  )
}
