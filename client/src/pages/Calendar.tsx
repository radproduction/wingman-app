import { useMemo, useState, type PointerEvent } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtTime, fmtDateLong, sameDay } from '../lib/format';
import { PageHeader, Loading, DemoBadge, EmptyState } from '../components/ui';
import { ChevronLeft, ChevronRight, PinIcon, CalendarIcon, ClockIcon } from '../components/icons';
import Tappable from '../components/Tappable';
import BottomSheet from '../components/BottomSheet';
import type { CalendarEvent } from '../types';

export default function Calendar() {
  const { data, loading } = useAsync(() => api.calendar(), []);
  const [offset, setOffset] = useState(0); // days from today
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const startX = useState<{ x: number | null }>({ x: null })[0];

  const day = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d;
  }, [offset]);

  const dayEvents = useMemo(() => {
    if (!data) return [];
    return data.events
      .filter((e) => sameDay(e.start_time, day))
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [data, day]);

  function onDown(e: PointerEvent) { startX.x = e.clientX; }
  function onUp(e: PointerEvent) {
    if (startX.x === null) return;
    const dx = e.clientX - startX.x;
    if (dx < -60) setOffset((o) => o + 1);
    else if (dx > 60) setOffset((o) => o - 1);
    startX.x = null;
  }

  if (loading || !data) return <Loading />;

  const label = offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : offset === -1 ? 'Yesterday' : fmtDateLong(day.toISOString());

  return (
    <div className="pb-4">
      <PageHeader title="Calendar" subtitle={fmtDateLong(day.toISOString())} right={<DemoBadge show={data.mock} />} />

      {/* Day switcher */}
      <div className="px-4 flex items-center justify-between mb-3">
        <Tappable className="w-11 h-11 rounded-full bg-card flex items-center justify-center text-accent" onTap={() => setOffset((o) => o - 1)}>
          <ChevronLeft className="w-5 h-5" />
        </Tappable>
        <div className="text-center">
          <p className="text-cardtitle text-white">{label}</p>
          <p className="text-caption text-gray">{dayEvents.length} event{dayEvents.length === 1 ? '' : 's'}</p>
        </div>
        <Tappable className="w-11 h-11 rounded-full bg-card flex items-center justify-center text-accent" onTap={() => setOffset((o) => o + 1)}>
          <ChevronRight className="w-5 h-5" />
        </Tappable>
      </div>

      {/* Swipeable day timeline */}
      <div className="px-4" onPointerDown={onDown} onPointerUp={onUp}>
        {dayEvents.length === 0 ? (
          <EmptyState icon={<CalendarIcon className="w-10 h-10 text-gray/40" />} text="Nothing scheduled. Enjoy the free time." />
        ) : (
          <div className="flex flex-col gap-3">
            {dayEvents.map((e) => (
              <Tappable key={e.id} className="card flex gap-3 min-h-[64px]" onTap={() => setSelected(e)}>
                <div className="flex flex-col items-center pt-0.5 w-14 shrink-0">
                  <span className="text-cardtitle text-white">{fmtTime(e.start_time)}</span>
                  <span className="text-caption text-gray">{fmtTime(e.end_time)}</span>
                </div>
                <div className={`w-1 rounded-full ${e.has_conflict ? 'bg-danger' : 'bg-accent'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-cardtitle text-white truncate">{e.title}</p>
                  {e.location && (
                    <p className="text-caption text-gray flex items-center gap-1 mt-0.5">
                      <PinIcon className="w-3.5 h-3.5" /> {e.location}
                    </p>
                  )}
                  {e.has_conflict && <p className="text-caption text-danger mt-0.5">Overlaps another event</p>}
                </div>
              </Tappable>
            ))}
          </div>
        )}
      </div>
      <p className="text-caption text-gray text-center mt-4">Swipe left / right to change day</p>

      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.title}>
        {selected && (
          <div className="flex flex-col gap-3 mt-1">
            <Row icon={<ClockIcon className="w-4 h-4" />} text={`${fmtTime(selected.start_time)} – ${fmtTime(selected.end_time)}`} />
            {selected.location && <Row icon={<PinIcon className="w-4 h-4" />} text={selected.location} />}
            {selected.attendees.length > 0 && (
              <div>
                <p className="text-caption text-gray mb-1">Attendees</p>
                <div className="flex flex-wrap gap-2">
                  {selected.attendees.map((a) => (
                    <span key={a} className="px-2.5 py-1 rounded-full bg-white/10 text-body text-gray-light">{a}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-2">
              <button className="flex-1 h-11 rounded-xl bg-accent text-bg font-semibold">Reschedule</button>
              <button className="flex-1 h-11 rounded-xl bg-white/10 text-white font-semibold">Cancel event</button>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}

function Row({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 text-gray-light text-body">
      <span className="text-accent">{icon}</span>{text}
    </div>
  );
}
