import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtDay, relativeDays } from '../lib/format';
import { PageHeader, Loading, DemoBadge, Badge, EmptyState } from '../components/ui';
import { BoxIcon } from '../components/icons';
import PullToRefresh from '../components/PullToRefresh';
import type { Delivery } from '../types';

const STAGES = ['ordered', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
const STAGE_LABEL: Record<string, string> = {
  ordered: 'Ordered', shipped: 'Shipped', in_transit: 'In transit',
  out_for_delivery: 'Out for delivery', delivered: 'Delivered',
};

function stageIndex(status: string) {
  const i = STAGES.indexOf(status);
  return i === -1 ? 2 : i;
}

export default function Deliveries() {
  const { data, loading, refresh } = useAsync(() => api.deliveries(), []);
  if (loading || !data) return <Loading />;

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Deliveries" subtitle={`${data.deliveries.filter((d) => d.status !== 'delivered').length} in transit`} right={<DemoBadge show={data.mock} />} />
      <div className="px-4 flex flex-col gap-3">
        {data.deliveries.length === 0 && (
          <EmptyState icon={<BoxIcon className="w-10 h-10 text-gray/40" />} text="Nothing on the way." />
        )}
        {data.deliveries.map((d) => <DeliveryCard key={d.id} d={d} />)}
      </div>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function DeliveryCard({ d }: { d: Delivery }) {
  const active = stageIndex(d.status);
  const delivered = d.status === 'delivered';
  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <BoxIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cardtitle text-white truncate">{d.item_name}</p>
          <p className="text-caption text-gray truncate">{d.merchant} · {d.carrier}</p>
        </div>
        <Badge label={STAGE_LABEL[d.status] ?? d.status} tone={d.status} />
      </div>

      {/* Horizontal progress tracker — constrained to fit within 340px */}
      <div className="mt-4 mx-auto" style={{ maxWidth: 340 }}>
        <div className="flex items-center">
          {STAGES.map((s, i) => {
            const reached = i <= active;
            return (
              <div key={s} className="flex items-center flex-1 last:flex-none">
                <div
                  className={`w-3 h-3 rounded-full shrink-0 ${reached ? 'bg-accent' : 'bg-white/15'} ${i === active && !delivered ? 'ring-4 ring-accent/25' : ''}`}
                />
                {i < STAGES.length - 1 && (
                  <div className={`h-0.5 flex-1 ${i < active ? 'bg-accent' : 'bg-white/15'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between mt-3">
        <p className="text-caption text-gray">
          {delivered
            ? `Delivered ${d.delivered_at ? fmtDay(d.delivered_at) : ''}`
            : d.estimated_delivery ? `Arriving ${relativeDays(d.estimated_delivery)}` : 'In transit'}
        </p>
        <p className="text-caption text-gray font-mono">{d.tracking_number}</p>
      </div>
      {delivered && d.return_window_ends && (
        <p className="text-caption text-warning mt-1">Return window ends {relativeDays(d.return_window_ends)}</p>
      )}
    </div>
  );
}
