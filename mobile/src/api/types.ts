// Response shapes for the endpoints the app uses. These mirror the backend's
// existing /api responses (see the web client's types.ts in the repo). Kept
// intentionally light for the foundation — extend per screen as you wire them.

export type Me = {
  id: string;
  name: string | null;
  phone: string;
  timezone: string | null;
  onboarding_complete?: boolean | number;
  briefing_time?: string | null;
  [key: string]: unknown;
};

export type RequestOtpResponse = { ok: boolean; devCode?: string };
export type VerifyOtpResponse = { token: string; user: Me };

// The Home dashboard aggregate. The backend returns a rich object; the reference
// Home screen only reads a few fields, so the rest is left open.
export type DashboardSummary = {
  greeting?: string;
  emailCounts?: { urgent: number; needsReply: number };
  tasksDueToday?: number;
  events?: unknown[];
  [key: string]: unknown;
};
