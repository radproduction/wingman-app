import { useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtDay } from '../lib/format';
import { PageHeader, Loading, DemoBadge, EmptyState } from '../components/ui';
import { PeopleIcon } from '../components/icons';
import Tappable from '../components/Tappable';
import BottomSheet from '../components/BottomSheet';
import PullToRefresh from '../components/PullToRefresh';
import type { Contact } from '../types';

const STRENGTH_COLOR: Record<string, string> = {
  close: 'bg-success', regular: 'bg-accent', occasional: 'bg-gray',
};

export default function People() {
  const { data, loading, refresh } = useAsync(() => api.contacts(), []);
  const [selected, setSelected] = useState<Contact | null>(null);
  if (loading || !data) return <Loading />;

  const sorted = [...data.contacts].sort((a, b) => b.interaction_count - a.interaction_count);

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="People" subtitle={`${data.contacts.length} contacts`} right={<DemoBadge show={data.mock} />} />
      <div className="px-4 flex flex-col gap-2.5">
        {data.contacts.length === 0 && (
          <EmptyState icon={<PeopleIcon className="w-10 h-10 text-gray/40" />} text="No contacts yet." />
        )}
        {sorted.map((c) => (
          <Tappable key={c.id} className="card flex items-center gap-3 min-h-[64px]" onTap={() => setSelected(c)}>
            <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 text-cardtitle font-semibold">
              {c.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-cardtitle text-white truncate">{c.name}</p>
              <p className="text-caption text-gray truncate">{c.company || c.email}</p>
            </div>
            <div className="text-right shrink-0">
              <span className={`inline-block w-2 h-2 rounded-full ${STRENGTH_COLOR[c.strength] ?? 'bg-gray'}`} />
              <p className="text-caption text-gray mt-1">{c.interaction_count}×</p>
            </div>
          </Tappable>
        ))}
      </div>

      <BottomSheet open={!!selected} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && (
          <div className="flex flex-col gap-3 mt-1">
            <div className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${STRENGTH_COLOR[selected.strength] ?? 'bg-gray'}`} />
              <span className="text-body text-gray-light capitalize">{selected.strength} contact</span>
              <span className="text-caption text-gray">· {selected.interaction_count} interactions</span>
            </div>
            {selected.company && <Field label="Company" value={selected.company} />}
            {selected.relationship && <Field label="Relationship" value={selected.relationship} />}
            <Field label="Email" value={selected.email} />
            {selected.last_contacted_at && <Field label="Last contacted" value={fmtDay(selected.last_contacted_at)} />}
            {selected.notes && (
              <div className="rounded-xl bg-white/5 p-3">
                <p className="text-caption text-accent font-semibold mb-1">WHAT WINGMAN KNOWS</p>
                <p className="text-body text-gray-light leading-relaxed">{selected.notes}</p>
              </div>
            )}
          </div>
        )}
      </BottomSheet>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-body text-gray">{label}</span>
      <span className="text-body text-white text-right truncate">{value}</span>
    </div>
  );
}
