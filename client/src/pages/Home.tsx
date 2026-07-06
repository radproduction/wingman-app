import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAsync } from '../lib/useAsync';
import { fmtTime, fmtMoney, greeting, relativeDays } from '../lib/format';
import Tappable from '../components/Tappable';
import PullToRefresh from '../components/PullToRefresh';
import { Loading, DemoBadge } from '../components/ui';
import {
  CalendarIcon, MailIcon, CheckIcon, BillIcon, BoxIcon, PlaneIcon, HeartIcon, ChevronRight, BellIcon,
} from '../components/icons';
import type { DashboardSummary } from '../types';

export default function Home() {
  const navigate = useNavigate();
  const { data, loading, refresh } = useAsync<DashboardSummary>(() => api.dashboard(), []);
  const { data: me } = useAsync(() => api.me(), []);

  if (loading || !data) return <Loading />;

  const isMock = me?.mock ?? true;
  const waNumber = (me?.wingman_number || '').replace(/[^0-9]/g, '');
  const waLink = waNumber
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent('Hi Wingman 👋')}`
    : null;

  return (
    <PullToRefresh onRefresh={refresh}>
      <div className="px-4 pt-safe">
        <header className="pt-5 pb-4 flex items-start justify-between">
          <div>
            <p className="text-caption text-gray">{greeting()},</p>
            <h1 className="text-title text-white">{data.user.name} 👋</h1>
            <div className="mt-1"><DemoBadge show={isMock} /></div>
          </div>
          <Tappable
            className="w-11 h-11 rounded-full bg-card flex items-center justify-center text-accent"
            onTap={() => navigate('/settings')}
          >
            <BellIcon className="w-5 h-5" />
          </Tappable>
        </header>

        {/* Briefing banner */}
        <div className="rounded-card bg-gradient-to-br from-accent/25 to-accent/5 border border-accent/20 p-4 mb-3">
          <p className="text-caption text-accent font-semibold mb-1">MORNING BRIEFING</p>
          <p className="text-body text-white leading-relaxed">
            You have <b>{data.calendar.count} meetings</b> today and <b>{data.email.urgent} urgent</b> email
            {data.email.urgent === 1 ? '' : 's'}. {data.bills.next && (
              <>Your <b>{data.bills.next.name}</b> bill is {relativeDays(data.bills.next.due_date)}.</>
            )}
          </p>
        </div>

        {/* Connect on WhatsApp — the one place users find Wingman's number */}
        {waLink && (
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-card flex items-center gap-3 p-4 mb-3 bg-[#25D366]/15 border border-[#25D366]/35 active:opacity-80 transition-opacity"
          >
            <div className="w-11 h-11 rounded-xl bg-[#25D366] flex items-center justify-center shrink-0 text-white text-xl">
              💬
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body text-white font-semibold">Chat with Wingman on WhatsApp</p>
              <p className="text-caption text-gray-light truncate">Tap to open · +{waNumber}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray shrink-0" />
          </a>
        )}

        <div className="flex flex-col gap-3">
          {/* Calendar */}
          <DashCard icon={<CalendarIcon className="w-5 h-5" />} title="CALENDAR" onTap={() => navigate('/calendar')}
            count={data.calendar.count}>
            {data.calendar.next
              ? <p className="text-body text-gray-light">{fmtTime(data.calendar.next.start_time)} — {data.calendar.next.title}</p>
              : <p className="text-body text-gray">No meetings today</p>}
          </DashCard>

          {/* Email */}
          <DashCard icon={<MailIcon className="w-5 h-5" />} title="EMAIL" onTap={() => navigate('/email')}
            badge={data.email.urgent > 0 ? `${data.email.urgent} urgent` : undefined} badgeTone="urgent">
            <p className="text-body text-gray-light">
              {data.email.need_reply} need reply · {data.email.total_unread} unread
            </p>
          </DashCard>

          {/* Tasks */}
          <DashCard icon={<CheckIcon className="w-5 h-5" />} title="TASKS" onTap={() => navigate('/tasks')}
            count={data.tasks.due}>
            <p className="text-body text-gray-light">{data.tasks.done} done · {data.tasks.due} pending</p>
          </DashCard>

          {/* Bills */}
          <DashCard icon={<BillIcon className="w-5 h-5" />} title="BILLS" onTap={() => navigate('/bills')}>
            {data.bills.next
              ? <p className="text-body text-gray-light">
                  {data.bills.next.name} {fmtMoney(data.bills.next.amount, data.bills.next.currency)} — {relativeDays(data.bills.next.due_date)}
                </p>
              : <p className="text-body text-gray">All settled</p>}
          </DashCard>

          {/* Deliveries */}
          <DashCard icon={<BoxIcon className="w-5 h-5" />} title="DELIVERIES" onTap={() => navigate('/deliveries')}
            count={data.deliveries.count}>
            {data.deliveries.next
              ? <p className="text-body text-gray-light">{data.deliveries.next.item_name} — {data.deliveries.next.status.replace(/_/g, ' ')}</p>
              : <p className="text-body text-gray">Nothing in transit</p>}
          </DashCard>

          {/* Travel */}
          <DashCard icon={<PlaneIcon className="w-5 h-5" />} title="TRAVEL" onTap={() => navigate('/travel')}>
            {data.travel.next
              ? <p className="text-body text-gray-light">{data.travel.next.destination} {relativeDays(data.travel.next.depart_time)}</p>
              : <p className="text-body text-gray">No upcoming trips</p>}
          </DashCard>

          {/* Health */}
          <DashCard icon={<HeartIcon className="w-5 h-5" />} title="HEALTH" onTap={() => navigate('/health')}>
            <p className="text-body text-gray-light">
              Sleep {data.health.sleep_hours}h · HRV {data.health.hrv} · {(data.health.steps / 1000).toFixed(1)}K steps
            </p>
          </DashCard>
        </div>
        <div className="h-4" />
      </div>
    </PullToRefresh>
  );
}

function DashCard({
  icon, title, children, onTap, count, badge, badgeTone,
}: {
  icon: React.ReactNode; title: string; children: React.ReactNode; onTap: () => void;
  count?: number; badge?: string; badgeTone?: string;
}) {
  return (
    <Tappable className="card min-h-[76px] flex items-center gap-3" onTap={onTap}>
      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-caption font-semibold tracking-wide text-gray">{title}</span>
          {count != null && count > 0 && (
            <span className="text-caption font-bold text-accent bg-accent/15 rounded-full px-1.5">{count}</span>
          )}
          {badge && (
            <span className={`text-caption font-medium rounded-full px-2 ${badgeTone === 'urgent' ? 'bg-danger/15 text-danger' : 'bg-white/10 text-gray-light'}`}>{badge}</span>
          )}
        </div>
        <div className="mt-0.5 truncate">{children}</div>
      </div>
      <ChevronRight className="w-4 h-4 text-gray shrink-0" />
    </Tappable>
  );
}
