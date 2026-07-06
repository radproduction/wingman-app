import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { PageHeader, Loading, DemoBadge } from '../components/ui';
import { MoonIcon, HeartIcon, FootprintsIcon } from '../components/icons';
import PullToRefresh from '../components/PullToRefresh';

export default function HealthPage() {
  const { data, loading, refresh } = useAsync(() => api.health(), []);
  if (loading || !data) return <Loading />;
  const h = data.health;

  // No live health source connected yet → show an honest empty state instead
  // of sample data.
  if (h == null || h.sleep_hours == null) {
    return (
      <PullToRefresh onRefresh={refresh}>
        <PageHeader title="Health" subtitle="Not connected" />
        <div className="px-4">
          <div className="card text-center py-12">
            <div className="w-12 h-12 rounded-2xl bg-accent/15 text-accent flex items-center justify-center mx-auto mb-3">
              <HeartIcon className="w-6 h-6" />
            </div>
            <p className="text-body text-white">Health tracking isn’t connected yet</p>
            <p className="text-caption text-gray mt-1">Sleep, HRV and steps will show here once a health source is linked.</p>
          </div>
        </div>
      </PullToRefresh>
    );
  }

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Health" subtitle="Today's readings" right={<DemoBadge show={data.mock} />} />
      <div className="px-4">
        {/* Readiness ring */}
        <div className="card flex items-center gap-4">
          <Ring value={h.readiness} />
          <div className="flex-1">
            <p className="text-caption text-gray">Readiness</p>
            <p className="text-title text-white">{h.readiness}%</p>
            <p className="text-caption text-gray-light mt-1">{h.recommendation}</p>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 gap-3 mt-3">
          <Stat icon={<MoonIcon className="w-5 h-5" />} label="Sleep" value={`${h.sleep_hours}h`} sub={`Target ${h.sleep_target}h`} />
          <Stat icon={<HeartIcon className="w-5 h-5" />} label="HRV" value={`${h.hrv}ms`} sub={`Resting HR ${h.resting_hr}`} />
          <Stat icon={<FootprintsIcon className="w-5 h-5" />} label="Steps" value={`${(h.steps / 1000).toFixed(1)}K`} sub={`Target ${(h.steps_target / 1000).toFixed(0)}K`} />
          <Stat icon={<HeartIcon className="w-5 h-5" />} label="Calories" value={`${h.calories}`} sub="active kcal" />
        </div>

        {/* Weekly trends */}
        <div className="card mt-3">
          <p className="text-caption text-gray mb-3">Sleep · last 7 days</p>
          <MiniBars values={h.week_sleep} target={h.sleep_target} unit="h" color="bg-accent" />
        </div>
        <div className="card mt-3">
          <p className="text-caption text-gray mb-3">Steps · last 7 days</p>
          <MiniBars values={h.week_steps.map((s) => s / 1000)} target={h.steps_target / 1000} unit="K" color="bg-success" />
        </div>
      </div>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function Ring({ value }: { value: number }) {
  const r = 30, c = 2 * Math.PI * r;
  const off = c * (1 - value / 100);
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" className="shrink-0">
      <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="#8b8fff" strokeWidth="8" strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={off} transform="rotate(-90 40 40)" />
      <text x="40" y="45" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="700">{value}</text>
    </svg>
  );
}

function Stat({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="card">
      <div className="w-9 h-9 rounded-xl bg-accent/15 text-accent flex items-center justify-center mb-2">{icon}</div>
      <p className="text-caption text-gray">{label}</p>
      <p className="text-title text-white leading-tight">{value}</p>
      <p className="text-caption text-gray mt-0.5">{sub}</p>
    </div>
  );
}

function MiniBars({ values, target, unit, color }: { values: number[]; target: number; unit: string; color: string }) {
  const max = Math.max(...values, target) * 1.15;
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  return (
    <div className="flex items-end justify-between gap-2 h-24">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[10px] text-gray-light">{v.toFixed(unit === 'h' ? 1 : 1)}</span>
          <div className="w-full bg-white/5 rounded-md flex items-end" style={{ height: 64 }}>
            <div className={`w-full ${color} rounded-md`} style={{ height: `${Math.max(6, (v / max) * 64)}px` }} />
          </div>
          <span className="text-[10px] text-gray">{days[i]}</span>
        </div>
      ))}
    </div>
  );
}
