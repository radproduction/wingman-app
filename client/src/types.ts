export type ProactivenessLevel = 'low' | 'moderate' | 'high';
export type Tone = 'professional' | 'casual' | 'friendly';
export type CommunicationStyle = 'concise' | 'detailed';
export type Skill =
  | 'travel_assistant' | 'bill_tracker' | 'delivery_tracker'
  | 'people_crm' | 'followup_tracker';

export interface Me {
  id: string;
  phone: string;
  name: string;
  timezone: string;
  work_hours_start: string;
  work_hours_end: string;
  language: string;
  onboarding_complete?: boolean;
  briefing_time?: string;
  debrief_time?: string;
  proactiveness_level?: ProactivenessLevel;
  enabled_skills?: Skill[];
  tone?: Tone;
  communication_style?: CommunicationStyle;
  health_connected: boolean;
  gmail_connected: boolean;
  calendar_connected: boolean;
  /** Wingman's own WhatsApp number users message (from WINGMAN_NUMBER env). */
  wingman_number?: string;
  /** True once the user has exchanged a message with Wingman on WhatsApp. */
  whatsapp_connected?: boolean;
  mock?: boolean;
}

export interface RequestOtpResponse {
  sent: boolean;
  delivered: boolean;
  dev_code?: string;
}

export interface VerifyOtpResponse {
  token: string;
  expires_at: string;
  user: Me;
}

export interface SettingsPatch {
  name?: string;
  timezone?: string;
  work_hours_start?: string;
  work_hours_end?: string;
  language?: string;
  briefing_time?: string;
  debrief_time?: string;
  proactiveness_level?: ProactivenessLevel;
  enabled_skills?: Skill[];
  tone?: Tone;
  communication_style?: CommunicationStyle;
}

export interface CalendarEvent {
  id: string;
  title: string;
  location: string | null;
  start_time: string;
  end_time: string;
  attendees: string[];
  status: string;
  has_conflict: boolean;
}

export type EmailCategory = 'urgent' | 'needs_reply' | 'fyi' | 'spam';

export interface EmailItem {
  id: string;
  sender: string;
  subject: string;
  category: EmailCategory;
  summary: string;
  action_needed: boolean;
  replied: boolean;
  detected_type: string;
  draft_reply: string | null;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  source: string;
  priority: number;
  due_date: string | null;
  completed: boolean;
  recurring: string | null;
}

export type BillStatus = 'pending' | 'paid' | 'overdue';

export interface Bill {
  id: string;
  name: string;
  amount: number;
  currency: string;
  due_date: string;
  status: BillStatus;
  recurring: boolean;
}

export interface Delivery {
  id: string;
  item_name: string;
  merchant: string;
  carrier: string;
  tracking_number: string;
  status: string;
  estimated_delivery: string | null;
  delivered_at: string | null;
  return_window_ends: string | null;
}

export interface Trip {
  id: string;
  trip_name: string;
  type: string;
  provider: string;
  confirmation_code: string;
  origin: string;
  destination: string;
  depart_time: string;
  arrive_time: string;
  return_time: string | null;
  status: string;
  price: number;
  currency: string;
  hotel_name: string | null;
  hotel_checkin: string | null;
  hotel_checkout: string | null;
}

export interface Health {
  connected: boolean;
  sleep_hours: number;
  sleep_target: number;
  hrv: number;
  resting_hr: number;
  steps: number;
  steps_target: number;
  calories: number;
  readiness: number;
  recommendation: string;
  week_sleep: number[];
  week_steps: number[];
}

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  relationship: string | null;
  interaction_count: number;
  strength: string;
  last_contacted_at: string | null;
  notes: string | null;
}

export interface Followup {
  id: string;
  type: string;
  description: string;
  counterparty: string;
  due_date: string;
  status: string;
}

export interface Briefing {
  id: string;
  type: string;
  content: string;
  sent_at: string;
}

export interface DashboardSummary {
  user: { name: string; timezone: string };
  calendar: { count: number; next: { title: string; start_time: string } | null };
  email: { urgent: number; need_reply: number; total_unread: number };
  tasks: { due: number; done: number; total: number };
  bills: { next: Bill | null; count: number };
  deliveries: { count: number; next: Delivery | null };
  travel: { next: Trip | null };
  health: { sleep_hours: number | null; hrv: number | null; steps: number | null };
}
