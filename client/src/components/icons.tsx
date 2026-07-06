import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, ...props,
});

export const HomeIcon = (p: P) => (
  <svg {...base(p)}><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /></svg>
);
export const CalendarIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /></svg>
);
export const MailIcon = (p: P) => (
  <svg {...base(p)}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></svg>
);
export const CheckIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 6 9 17l-5-5" /></svg>
);
export const CheckCircleIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="m8.5 12 2.5 2.5 4.5-5" /></svg>
);
export const MoreIcon = (p: P) => (
  <svg {...base(p)}><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
);
export const BillIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>
);
export const BoxIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 8 12 3 3 8l9 5 9-5Z" /><path d="M3 8v8l9 5 9-5V8M12 13v8" /></svg>
);
export const PlaneIcon = (p: P) => (
  <svg {...base(p)}><path d="M2 16l20-6-8 12-3-5-5-1Z" /></svg>
);
export const HeartIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 20s-7-4.5-9.5-9C1 8 2.5 4.5 6 4.5c2 0 3 1.2 4 2.5 1-1.3 2-2.5 4-2.5 3.5 0 5 3.5 3.5 6.5C19 15.5 12 20 12 20Z" /></svg>
);
export const PeopleIcon = (p: P) => (
  <svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20c0-3 2.6-5 5.5-5s5.5 2 5.5 5" /><path d="M16 5.5a3 3 0 0 1 0 6M17.5 20c0-2.2-1-3.9-2.5-4.7" /></svg>
);
export const SettingsIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>
);
export const ChevronRight = (p: P) => (
  <svg {...base(p)}><path d="m9 6 6 6-6 6" /></svg>
);
export const ChevronLeft = (p: P) => (
  <svg {...base(p)}><path d="m15 6-6 6 6 6" /></svg>
);
export const ClockIcon = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
);
export const PinIcon = (p: P) => (
  <svg {...base(p)}><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10Z" /><circle cx="12" cy="11" r="2.2" /></svg>
);
export const BellIcon = (p: P) => (
  <svg {...base(p)}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10 19a2 2 0 0 0 4 0" /></svg>
);
export const RefreshIcon = (p: P) => (
  <svg {...base(p)}><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /></svg>
);
export const MoonIcon = (p: P) => (
  <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4 7 7 0 1 0 20 14.5Z" /></svg>
);
export const FootprintsIcon = (p: P) => (
  <svg {...base(p)}><path d="M7 4c1.5 0 2.5 1.5 2.5 3.5S8.5 12 7 12s-2.5-1-2.5-3S5.5 4 7 4Z" /><path d="M4.8 13.5c0 1.5.6 2.5 2.2 2.5s2.2-1 2.2-2.5" /><path d="M17 4c1.5 0 2.5 1.5 2.5 3.5S18.5 12 17 12s-2.5-1-2.5-3S15.5 4 17 4Z" /><path d="M14.8 13.5c0 1.5.6 2.5 2.2 2.5s2.2-1 2.2-2.5" /></svg>
);
