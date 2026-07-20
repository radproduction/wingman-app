import type { ReactNode } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { PageHeader, Loading, DemoBadge } from '../components/ui';
import { HeartIcon, MoonIcon, FootprintsIcon } from '../components/icons';
import PullToRefresh from '../components/PullToRefresh';
import { HealthSetupGuide } from '../components/HealthSetupGuide';

export default function HealthPage() {
  const { data, loading, refresh } = useAsync(() => api.health(), []);
  if (loading || !data) return <Loading />;

  const h = data.health;
  const cards = [
    h.sleep_hours != null ? { label: 'Sleep', value: `${h.sleep_hours}h`, sub: 'from Apple Health / Android sync', icon: <MoonIcon className="w-5 h-5" /> } : null,
    h.steps != null ? { label: 'Steps', value: Number(h.steps).toLocaleString('en-US'), sub: 'latest total', icon: <FootprintsIcon className="w-5 h-5" /> } : null,
    h.hrv != null ? { label: 'HRV', value: `${h.hrv} ms`, sub: 'heart-rate variability', icon: <HeartIcon className="w-5 h-5" /> } : null,
    h.resting_hr != null ? { label: 'Resting HR', value: `${h.resting_hr} bpm`, sub: 'latest resting heart rate', icon: <HeartIcon className="w-5 h-5" /> } : null,
    h.heart_rate != null ? { label: 'Heart Rate', value: `${h.heart_rate} bpm`, sub: 'latest reading', icon: <HeartIcon className="w-5 h-5" /> } : null,
    h.calories != null ? { label: 'Calories', value: `${h.calories} kcal`, sub: 'active calories', icon: <FootprintsIcon className="w-5 h-5" /> } : null,
    h.weight != null ? { label: 'Weight', value: `${h.weight} kg`, sub: 'latest weight', icon: <HeartIcon className="w-5 h-5" /> } : null,
    h.blood_oxygen != null ? { label: 'Blood Oxygen', value: `${h.blood_oxygen}%`, sub: 'latest SpO2', icon: <HeartIcon className="w-5 h-5" /> } : null,
  ].filter(Boolean) as { label: string; value: string; sub: string; icon: ReactNode }[];

  const connected = cards.length > 0;

  if (!connected) {
    return (
      <PullToRefresh onRefresh={refresh}>
        <PageHeader title="Health" subtitle="Connect your phone once" />
        <div className="px-4 space-y-3">
          <div className="card text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
              <HeartIcon className="w-6 h-6" />
            </div>
            <p className="text-body text-white">Health tracking is not connected yet</p>
            <p className="text-caption text-gray mt-1">
              iPhone users can connect Apple Health. Android users can connect through Google Health / Health Connect.
            </p>
          </div>
          <HealthSetupGuide initialOpen />
        </div>
        <div className="h-4" />
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Health" subtitle="Latest readings" right={<DemoBadge show={data.mock} />} />
      <div className="px-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
              <HeartIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <p className="text-body text-white">Receiving health updates</p>
              <p className="text-caption text-gray mt-0.5">
                Wingman will use these readings in your briefings and health alerts.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          {cards.map((card) => (
            <Stat key={card.label} icon={card.icon} label={card.label} value={card.value} sub={card.sub} />
          ))}
        </div>

        <div className="mt-3">
          <HealthSetupGuide collapsible initialOpen={false} />
        </div>
      </div>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function Stat({ icon, label, value, sub }: { icon: ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-2">{icon}</div>
      <p className="text-caption text-gray">{label}</p>
      <p className="text-title text-white leading-tight">{value}</p>
      <p className="text-caption text-gray mt-0.5">{sub}</p>
    </div>
  );
}
