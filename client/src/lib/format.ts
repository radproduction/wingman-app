const TZ = 'Asia/Dubai';

export function fmtTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
}

export function fmtDay(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short', timeZone: TZ });
}

export function fmtDateLong(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', timeZone: TZ });
}

/** Human "in 3 days" / "2 days ago" / "today" relative label. */
export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return '';
  const target = startOfDay(new Date(iso));
  const today = startOfDay(new Date());
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return 'today';
  if (diff === 1) return 'tomorrow';
  if (diff === -1) return 'yesterday';
  if (diff > 0) return `in ${diff} days`;
  return `${Math.abs(diff)} days ago`;
}

function startOfDay(d: Date): Date {
  const n = new Date(d);
  n.setHours(0, 0, 0, 0);
  return n;
}

export function isToday(iso: string | null | undefined): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

export function sameDay(iso: string | null | undefined, ref: Date): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
}

const CURRENCY_SYMBOL: Record<string, string> = { PKR: '₨', AED: 'AED ', USD: '$' };

export function fmtMoney(amount: number, currency = 'PKR'): string {
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  // Compact large numbers: 340000 -> 340K
  let val: string;
  if (Math.abs(amount) >= 1000) {
    val = `${(amount / 1000).toLocaleString('en-US', { maximumFractionDigits: 1 })}K`;
  } else {
    val = amount.toLocaleString('en-US');
  }
  return `${sym}${val}`;
}

export function fmtMoneyFull(amount: number, currency = 'PKR'): string {
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  return `${sym}${amount.toLocaleString('en-US')}`;
}

export function greeting(): string {
  const h = Number(new Date().toLocaleTimeString('en-US', { hour: '2-digit', hour12: false, timeZone: TZ }));
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
