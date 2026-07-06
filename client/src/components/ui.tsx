import type { ReactNode } from 'react';

export function PageHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <header className="pt-safe px-4 pt-4 pb-3 flex items-start justify-between gap-3">
      <div>
        <h1 className="text-title text-white">{title}</h1>
        {subtitle && <p className="text-caption text-gray mt-0.5">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}

const CATEGORY_STYLES: Record<string, string> = {
  urgent: 'bg-danger/15 text-danger',
  needs_reply: 'bg-warning/15 text-warning',
  fyi: 'bg-white/10 text-gray-light',
  spam: 'bg-white/10 text-gray',
  paid: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  overdue: 'bg-danger/15 text-danger',
  confirmed: 'bg-success/15 text-success',
  in_transit: 'bg-accent/15 text-accent',
  out_for_delivery: 'bg-warning/15 text-warning',
  delivered: 'bg-success/15 text-success',
};

export function Badge({ label, tone }: { label: string; tone?: string }) {
  const cls = (tone && CATEGORY_STYLES[tone]) || 'bg-white/10 text-gray-light';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-caption font-medium ${cls}`}>
      {label}
    </span>
  );
}

export function Loading() {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-gray">
      <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-[spin_0.8s_linear_infinite]" />
      <p className="text-caption">Loading…</p>
    </div>
  );
}

export function EmptyState({ icon, text }: { icon?: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-gray">
      {icon}
      <p className="text-body">{text}</p>
    </div>
  );
}

export function DemoBadge({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-accent/15 text-accent text-caption font-medium">
      demo data
    </span>
  );
}

export function SectionTitle({ children, count }: { children: ReactNode; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-1 mt-5 mb-2">
      <h3 className="text-caption uppercase tracking-wide text-gray font-semibold">{children}</h3>
      {count != null && <span className="text-caption text-gray">({count})</span>}
    </div>
  );
}
