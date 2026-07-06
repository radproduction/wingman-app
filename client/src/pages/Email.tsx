import { useMemo, useState } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtDay } from '../lib/format';
import { PageHeader, Loading, DemoBadge, Badge, EmptyState } from '../components/ui';
import { MailIcon, ChevronRight } from '../components/icons';
import PullToRefresh from '../components/PullToRefresh';
import type { EmailItem, EmailCategory } from '../types';

const CAT_LABEL: Record<EmailCategory, string> = {
  urgent: 'Urgent', needs_reply: 'Needs Reply', fyi: 'FYI', spam: 'Spam',
};
const CAT_ORDER: EmailCategory[] = ['urgent', 'needs_reply', 'fyi', 'spam'];
const FILTERS: (EmailCategory | 'all')[] = ['all', 'urgent', 'needs_reply', 'fyi'];

export default function Email() {
  const { data, loading, refresh } = useAsync(() => api.emails(), []);
  const [filter, setFilter] = useState<EmailCategory | 'all'>('all');
  const [expanded, setExpanded] = useState<string | null>(null);

  const grouped = useMemo(() => {
    if (!data) return {} as Record<EmailCategory, EmailItem[]>;
    const g = {} as Record<EmailCategory, EmailItem[]>;
    for (const c of CAT_ORDER) g[c] = [];
    for (const e of data.emails) (g[e.category] ??= []).push(e);
    return g;
  }, [data]);

  if (loading || !data) return <Loading />;

  const visibleCats = filter === 'all' ? CAT_ORDER : [filter];

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Email" subtitle={`${data.emails.length} messages`} right={<DemoBadge show={data.mock} />} />

      <div className="px-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`shrink-0 h-9 px-3.5 rounded-full text-body font-medium ${
              filter === f ? 'bg-accent text-bg' : 'bg-card text-gray-light'
            }`}
          >
            {f === 'all' ? 'All' : CAT_LABEL[f]}
          </button>
        ))}
      </div>

      <div className="px-4 pt-2">
        {visibleCats.every((c) => grouped[c].length === 0) && (
          <EmptyState icon={<MailIcon className="w-10 h-10 text-gray/40" />} text="Inbox zero. Nice." />
        )}
        {visibleCats.map((cat) =>
          grouped[cat].length === 0 ? null : (
            <div key={cat}>
              <div className="flex items-center gap-2 mt-4 mb-2 px-1">
                <h3 className="text-caption uppercase tracking-wide text-gray font-semibold">{CAT_LABEL[cat]}</h3>
                <span className="text-caption text-gray">({grouped[cat].length})</span>
              </div>
              <div className="flex flex-col gap-2.5">
                {grouped[cat].map((e) => (
                  <EmailCard key={e.id} email={e} open={expanded === e.id} onToggle={() => setExpanded(expanded === e.id ? null : e.id)} />
                ))}
              </div>
            </div>
          )
        )}
      </div>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function senderName(s: string) {
  const m = s.match(/^(.*?)\s*</);
  return (m ? m[1] : s).replace(/"/g, '').trim();
}

function EmailCard({ email, open, onToggle }: { email: EmailItem; open: boolean; onToggle: () => void }) {
  return (
    <div className="card !p-0 overflow-hidden">
      <button onClick={onToggle} className="w-full text-left p-4 flex gap-3 min-h-[64px]">
        <div className="w-9 h-9 rounded-full bg-accent/15 text-accent flex items-center justify-center shrink-0 text-body font-semibold">
          {senderName(email.sender).charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-body text-white font-medium truncate">{senderName(email.sender)}</p>
            <span className="text-caption text-gray shrink-0">{fmtDay(email.created_at)}</span>
          </div>
          <p className="text-body text-gray-light truncate">{email.subject}</p>
          {!open && <p className="text-caption text-gray truncate mt-0.5">{email.summary}</p>}
        </div>
        <ChevronRight className={`w-4 h-4 text-gray shrink-0 self-center transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4 -mt-1">
          <div className="flex items-center gap-2 mb-2">
            <Badge label={CAT_LABEL[email.category]} tone={email.category} />
            {email.detected_type !== 'general' && <Badge label={email.detected_type} />}
          </div>
          <p className="text-body text-gray-light leading-relaxed">{email.summary}</p>
          {email.draft_reply && (
            <div className="mt-3 rounded-xl bg-white/5 p-3">
              <p className="text-caption text-accent font-semibold mb-1">SUGGESTED REPLY</p>
              <p className="text-body text-gray-light">{email.draft_reply}</p>
            </div>
          )}
          <div className="flex gap-2 mt-3">
            <button className="flex-1 h-11 rounded-xl bg-accent text-bg font-semibold">Reply</button>
            <button className="flex-1 h-11 rounded-xl bg-white/10 text-white font-semibold">Archive</button>
          </div>
        </div>
      )}
    </div>
  );
}
