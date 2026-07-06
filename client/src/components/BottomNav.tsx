import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  HomeIcon, CalendarIcon, MailIcon, CheckIcon, MoreIcon,
  BillIcon, BoxIcon, PlaneIcon, HeartIcon, PeopleIcon, SettingsIcon, ChevronRight,
} from './icons';
import BottomSheet from './BottomSheet';
import Tappable from './Tappable';

const TABS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/email', label: 'Email', Icon: MailIcon },
  { to: '/tasks', label: 'Tasks', Icon: CheckIcon },
];

const MORE_ITEMS = [
  { to: '/bills', label: 'Bills', Icon: BillIcon },
  { to: '/deliveries', label: 'Deliveries', Icon: BoxIcon },
  { to: '/travel', label: 'Travel', Icon: PlaneIcon },
  { to: '/health', label: 'Health', Icon: HeartIcon },
  { to: '/people', label: 'People', Icon: PeopleIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function BottomNav() {
  const [moreOpen, setMoreOpen] = useState(false);
  const navigate = useNavigate();

  const tabClass = ({ isActive }: { isActive: boolean }) =>
    `flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] ${
      isActive ? 'text-accent' : 'text-gray'
    }`;

  return (
    <>
      <nav
        className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-card/95 backdrop-blur border-t border-white/10 bottom-safe"
        style={{ height: 'calc(56px + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex h-14 max-w-mobile mx-auto">
          {TABS.map(({ to, label, Icon }) => (
            <NavLink key={to} to={to} className={tabClass} end={to === '/'}>
              <Icon className="w-6 h-6" />
              <span className="text-[10px] leading-none">{label}</span>
            </NavLink>
          ))}
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 h-full min-h-[44px] text-gray"
          >
            <MoreIcon className="w-6 h-6" />
            <span className="text-[10px] leading-none">More</span>
          </button>
        </div>
      </nav>

      <BottomSheet open={moreOpen} onClose={() => setMoreOpen(false)} title="More">
        <div className="grid grid-cols-1 gap-2 mt-1">
          {MORE_ITEMS.map(({ to, label, Icon }) => (
            <Tappable
              key={to}
              className="flex items-center gap-3 rounded-card bg-white/5 px-4 py-3 min-h-[48px]"
              onTap={() => { setMoreOpen(false); navigate(to); }}
            >
              <span className="text-accent"><Icon className="w-5 h-5" /></span>
              <span className="text-body text-white flex-1">{label}</span>
              <ChevronRight className="w-4 h-4 text-gray" />
            </Tappable>
          ))}
        </div>
      </BottomSheet>
    </>
  );
}
