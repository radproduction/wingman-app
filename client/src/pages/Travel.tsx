import { useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtDateLong, fmtTime, fmtMoneyFull, relativeDays } from '../lib/format';
import { PageHeader, Loading, DemoBadge, EmptyState } from '../components/ui';
import { PlaneIcon, PinIcon, ClockIcon } from '../components/icons';
import Tappable from '../components/Tappable';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import type { Trip } from '../types';

export default function Travel() {
  const { data, loading, refresh } = useAsync(() => api.travel(), []);
  const [selected, setSelected] = useState<Trip | null>(null);
  if (loading || !data) return <Loading />;

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Travel" subtitle={`${data.trips.length} upcoming trip${data.trips.length === 1 ? '' : 's'}`} right={<DemoBadge show={data.mock} />} />
      <div className="px-4 flex flex-col gap-3">
        {data.trips.length === 0 && (
          <EmptyState icon={<PlaneIcon className="w-10 h-10 text-gray/40" />} text="No trips planned." />
        )}
        {data.trips.map((t) => (
          <Tappable key={t.id} className="card" onTap={() => setSelected(t)}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-accent"><PlaneIcon className="w-5 h-5" /></span>
              <p className="text-cardtitle text-white flex-1 truncate">{t.trip_name || `${t.origin} → ${t.destination}`}</p>
              <span className="text-caption text-accent font-semibold">{relativeDays(t.depart_time)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-title text-white leading-none">{t.origin}</p>
                <p className="text-caption text-gray mt-1">{fmtTime(t.depart_time)}</p>
              </div>
              <div className="flex-1 flex items-center gap-1">
                <div className="h-0.5 flex-1 bg-white/15" />
                <PlaneIcon className="w-4 h-4 text-accent" />
                <div className="h-0.5 flex-1 bg-white/15" />
              </div>
              <div className="text-center">
                <p className="text-title text-white leading-none">{t.destination}</p>
                <p className="text-caption text-gray mt-1">{fmtTime(t.arrive_time)}</p>
              </div>
            </div>
            <p className="text-caption text-gray mt-3">{t.provider} · {t.confirmation_code}</p>
          </Tappable>
        ))}
      </div>

      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.trip_name || 'Trip'}>
        {selected && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="rounded-xl bg-white/5 p-3">
              <p className="text-caption text-accent font-semibold mb-2">FLIGHT</p>
              <p className="text-body text-white">{selected.origin} → {selected.destination}</p>
              <p className="text-caption text-gray mt-1 flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{fmtDateLong(selected.depart_time)} · {fmtTime(selected.depart_time)}</p>
              <p className="text-caption text-gray mt-1">{selected.provider} · {selected.confirmation_code}</p>
            </div>
            {selected.hotel_name && (
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-caption text-accent font-semibold mb-2">HOTEL</p>
                <p className="text-body text-white flex items-center gap-1"><PinIcon className="w-4 h-4 text-accent" />{selected.hotel_name}</p>
                {selected.hotel_checkin && (
                  <p className="text-caption text-gray mt-1">
                    Check-in {fmtDateLong(selected.hotel_checkin)}{selected.hotel_checkout ? ` · Check-out ${fmtDateLong(selected.hotel_checkout)}` : ''}
                  </p>
                )}
              </div>
            )}
            <div className="flex items-center justify-between px-1">
              <span className="text-body text-gray">Trip cost</span>
              <span className="text-cardtitle text-white">{fmtMoneyFull(selected.price, selected.currency)}</span>
            </div>
          </div>
        )}
      </BottomSheet>
      <div className="h-4" />
    </PullToRefresh>
  );
}
