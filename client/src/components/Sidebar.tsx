import { NavLink } from 'react-router-dom';
import {
  HomeIcon, CalendarIcon, MailIcon, CheckIcon,
  BillIcon, BoxIcon, PlaneIcon, HeartIcon, PeopleIcon, SettingsIcon,
} from './icons';
import { useAuth } from '../lib/auth';

const ITEMS = [
  { to: '/', label: 'Home', Icon: HomeIcon },
  { to: '/calendar', label: 'Calendar', Icon: CalendarIcon },
  { to: '/email', label: 'Email', Icon: MailIcon },
  { to: '/tasks', label: 'Tasks', Icon: CheckIcon },
  { to: '/bills', label: 'Bills', Icon: BillIcon },
  { to: '/deliveries', label: 'Deliveries', Icon: BoxIcon },
  { to: '/travel', label: 'Travel', Icon: PlaneIcon },
  { to: '/health', label: 'Health', Icon: HeartIcon },
  { to: '/people', label: 'People', Icon: PeopleIcon },
  { to: '/settings', label: 'Settings', Icon: SettingsIcon },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 h-screen sticky top-0 border-r border-white/10 bg-card/40 px-3 py-5">
      <div className="flex items-center gap-2 px-3 mb-6">
        <img src="/wingman.png" alt="Wingman" className="w-8 h-8 rounded-lg" />
        <span className="text-cardtitle text-white font-bold">Wingman</span>
      </div>
      <nav className="flex flex-col gap-1">
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-body transition-colors ${
                isActive ? 'bg-accent/15 text-accent' : 'text-gray hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            {label}
          </NavLink>
        ))}
      </nav>
      <SidebarFooter />
    </aside>
  );
}

function SidebarFooter() {
  const { user, signOut } = useAuth();
  const first = (user?.name || '').trim().split(/\s+/)[0] || 'there';
  return (
    <div className="mt-auto px-3">
      <p className="text-caption text-gray mb-2">Signed in as {first}</p>
      <button
        onClick={() => signOut()}
        className="text-caption text-gray hover:text-white transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}
