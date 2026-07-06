import { useMemo } from 'react';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtDay, fmtMoneyFull, relativeDays } from '../lib/format';
import { PageHeader, Loading, DemoBadge, Badge, EmptyState } from '../components/ui';
import { BillIcon } from '../components/icons';
import SwipeableRow from '../components/SwipeableRow';
import PullToRefresh from '../components/PullToRefresh';
import type { Bill } from '../types';

export default function Bills() {
  const { data, loading, refresh, setData } = useAsync(() => api.bills(), []);

  const groups = useMemo(() => {
    const bills = data?.bills ?? [];
    const now = Date.now();
    const overdue: Bill[] = [];
    const pending: Bill[] = [];
    const paid: Bill[] = [];
    for (const b of bills) {
      if (b.status === 'paid') paid.push(b);
      else if (b.status === 'overdue' || (b.due_date && new Date(b.due_date).getTime() < now)) overdue.push(b);
      else pending.push(b);
    }
    return { overdue, pending, paid };
  }, [data]);

  const upcomingTotal = useMemo(
    () => [...groups.overdue, ...groups.pending].reduce((s, b) => s + b.amount, 0),
    [groups]
  );

  async function pay(b: Bill) {
    setData((d) => d ? { ...d, bills: d.bills.map((x) => x.id === b.id ? { ...x, status: 'paid' } : x) } : d);
    try { await api.payBill(b.id); } catch { /* keep optimistic */ }
  }

  if (loading || !data) return <Loading />;

  return (
    <PullToRefresh onRefresh={refresh}>
      <PageHeader title="Bills" subtitle={`${groups.overdue.length + groups.pending.length} upcoming`} right={<DemoBadge show={data.mock} />} />

      <div className="px-4">
        {data.bills.length === 0 && (
          <EmptyState icon={<BillIcon className="w-10 h-10 text-gray/40" />} text="No bills tracked." />
        )}

        {(groups.overdue.length > 0 || groups.pending.length > 0) && (
          <div className="card mb-1 flex items-center justify-between">
            <div>
              <p className="text-caption text-gray">Due soon (PKR)</p>
              <p className="text-title text-white">{fmtMoneyFull(upcomingTotal, 'PKR')}</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-accent/15 text-accent flex items-center justify-center">
              <BillIcon className="w-5 h-5" />
            </div>
          </div>
        )}

        <Group title="Overdue" tone="text-danger" bills={groups.overdue} onPay={pay} />
        <Group title="Pending" tone="text-white" bills={groups.pending} onPay={pay} />
        <Group title="Paid" tone="text-gray" bills={groups.paid} onPay={pay} paid />
      </div>
      <p className="text-caption text-gray text-center mt-3">Swipe a bill left to mark it paid</p>
      <div className="h-4" />
    </PullToRefresh>
  );
}

function Group({ title, tone, bills, onPay, paid = false }: {
  title: string; tone: string; bills: Bill[]; onPay: (b: Bill) => void; paid?: boolean;
}) {
  if (bills.length === 0) return null;
  return (
    <div>
      <div className="flex items-center gap-2 mt-5 mb-2 px-1">
        <h3 className={`text-caption uppercase tracking-wide font-semibold ${tone}`}>{title}</h3>
        <span className="text-caption text-gray">({bills.length})</span>
      </div>
      <div className="flex flex-col gap-2.5">
        {bills.map((b) => (
          <SwipeableRow key={b.id} onSwipe={() => onPay(b)} actionLabel="Paid" actionColor="bg-success" disabled={paid}>
            <div className="card flex items-center gap-3 min-h-[64px]">
              <div className={`w-1 self-stretch rounded-full ${paid ? 'bg-success' : title === 'Overdue' ? 'bg-danger' : 'bg-warning'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-cardtitle ${paid ? 'text-gray' : 'text-white'} truncate`}>{b.name}</p>
                <p className="text-caption text-gray mt-0.5">
                  {paid ? 'Paid' : `Due ${relativeDays(b.due_date)} · ${fmtDay(b.due_date)}`}
                  {b.recurring ? ' · recurring' : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className={`text-cardtitle ${paid ? 'text-gray' : 'text-white'}`}>{fmtMoneyFull(b.amount, b.currency)}</p>
                <div className="mt-1"><Badge label={paid ? 'paid' : title.toLowerCase()} tone={paid ? 'paid' : title === 'Overdue' ? 'overdue' : 'pending'} /></div>
              </div>
            </div>
          </SwipeableRow>
        ))}
      </div>
    </div>
  );
}
