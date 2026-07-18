-- ══════════════════════════════════════════════════════════════════
--  WINGMAN — SQLite Schema
--  Notes:
--   * IDs are TEXT (UUIDs generated in app code via crypto.randomUUID())
--   * JSONB replaced with TEXT (JSON.parse/stringify in code)
--   * TIMESTAMP DEFAULT NOW() replaced with TEXT DEFAULT (datetime('now'))
--   * Tables marked "user-specified" match Aamir's exact definitions.
-- ══════════════════════════════════════════════════════════════════

PRAGMA foreign_keys = ON;

-- ─── Users (user-specified) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT,
  timezone TEXT DEFAULT 'Asia/Karachi',
  work_hours_start TEXT DEFAULT '09:00',
  work_hours_end TEXT DEFAULT '18:00',
  language TEXT DEFAULT 'en',
  gmail_token TEXT,
  calendar_token TEXT,
  shopify_domain TEXT,                           -- e.g. mystore.myshopify.com
  shopify_token TEXT,                            -- Admin API access token
  health_connected INTEGER DEFAULT 0,
  preferences TEXT DEFAULT '{}',
  onboarding_complete INTEGER DEFAULT 0,
  briefing_time TEXT DEFAULT '07:00',
  debrief_time TEXT DEFAULT '20:00',
  proactiveness_level TEXT DEFAULT 'moderate',   -- 'low' | 'moderate' | 'high'
  enabled_skills TEXT DEFAULT '["travel_assistant","bill_tracker","delivery_tracker","people_crm","followup_tracker"]',
  tone TEXT DEFAULT 'friendly',                  -- 'professional' | 'casual' | 'friendly'
  communication_style TEXT DEFAULT 'concise',    -- 'concise' | 'detailed'
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Auth: OTP codes (phone verification / login) ───────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id TEXT PRIMARY KEY,
  phone TEXT NOT NULL,
  code TEXT NOT NULL,
  purpose TEXT DEFAULT 'login',    -- 'login' | 'signup'
  expires_at TEXT NOT NULL,
  consumed INTEGER DEFAULT 0,
  attempts INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Auth: sessions (bearer tokens for the web app) ─────────────────
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  last_seen_at TEXT DEFAULT (datetime('now'))
);

-- ─── Conversations (user-specified) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  role TEXT,
  content TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Tasks (user-specified) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  title TEXT,
  source TEXT,
  priority INTEGER DEFAULT 3,
  due_date TEXT,
  completed INTEGER DEFAULT 0,
  recurring TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Email items (user-specified) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS email_items (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  gmail_id TEXT,
  subject TEXT,
  sender TEXT,
  category TEXT,
  summary TEXT,
  action_needed INTEGER DEFAULT 0,
  replied INTEGER DEFAULT 0,
  draft_reply TEXT,
  detected_type TEXT,
  extracted_data TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Bills (user-specified) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  amount REAL,
  currency TEXT DEFAULT 'PKR',
  due_date TEXT,
  status TEXT DEFAULT 'pending',
  recurring INTEGER DEFAULT 0,
  source_email_id TEXT REFERENCES email_items(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Deliveries (user-specified; completed to match spec) ───────────
CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  item_name TEXT,
  merchant TEXT,
  carrier TEXT,
  tracking_number TEXT,
  status TEXT DEFAULT 'in_transit',
  estimated_delivery TEXT,
  delivered_at TEXT,
  return_window_ends TEXT,
  source_email_id TEXT REFERENCES email_items(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Calendar events (spec-aligned) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  gcal_event_id TEXT,
  title TEXT,
  description TEXT,
  location TEXT,
  start_time TEXT,
  end_time TEXT,
  all_day INTEGER DEFAULT 0,
  attendees TEXT DEFAULT '[]',
  status TEXT,
  has_conflict INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Travel (spec-aligned) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS travel (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  trip_name TEXT,
  type TEXT,
  provider TEXT,
  confirmation_code TEXT,
  origin TEXT,
  destination TEXT,
  depart_time TEXT,
  arrive_time TEXT,
  status TEXT,
  price REAL,
  currency TEXT DEFAULT 'PKR',
  source_email_id TEXT REFERENCES email_items(id),
  return_time TEXT,
  hotel_name TEXT,
  hotel_checkin TEXT,
  hotel_checkout TEXT,
  metadata TEXT DEFAULT '{}',
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Health data (spec-aligned) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS health_data (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  source TEXT,
  metric_type TEXT,
  value REAL,
  unit TEXT,
  recorded_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Contacts / People CRM (spec-aligned) ───────────────────────────
CREATE TABLE IF NOT EXISTS contacts (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  name TEXT,
  phone TEXT,
  email TEXT,
  relationship TEXT,
  company TEXT,
  birthday TEXT,
  last_contacted_at TEXT,
  last_summary TEXT,
  notes TEXT,
  interaction_count INTEGER DEFAULT 0,
  strength TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Briefings (spec-aligned) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS briefings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT,
  content TEXT,
  payload TEXT DEFAULT '{}',
  sent_at TEXT,
  engagement TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Reminders / proactive jobs (spec-aligned) ──────────────────────
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  kind TEXT,
  ref_id TEXT,
  message TEXT,
  trigger_at TEXT,
  status TEXT DEFAULT 'scheduled',
  sent_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Follow-ups (promises made / received) ──────────────────────────
CREATE TABLE IF NOT EXISTS followups (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  type TEXT,                       -- 'promise_made' | 'promise_received'
  description TEXT,
  counterparty TEXT,               -- who it's to/from
  due_date TEXT,
  status TEXT DEFAULT 'open',      -- 'open' | 'done' | 'overdue_alerted'
  source_email_id TEXT REFERENCES email_items(id),
  created_at TEXT DEFAULT (datetime('now'))
);

-- ─── Indexes ────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_conversations_user     ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user             ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_completed        ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_email_items_user       ON email_items(user_id);
CREATE INDEX IF NOT EXISTS idx_email_items_category   ON email_items(category);
CREATE INDEX IF NOT EXISTS idx_bills_user             ON bills(user_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_user        ON deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_user          ON calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_user            ON travel(user_id);
CREATE INDEX IF NOT EXISTS idx_health_user            ON health_data(user_id);
CREATE INDEX IF NOT EXISTS idx_contacts_user          ON contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_briefings_user         ON briefings(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_trigger      ON reminders(trigger_at, status);
CREATE INDEX IF NOT EXISTS idx_followups_user         ON followups(user_id, status);
CREATE INDEX IF NOT EXISTS idx_otp_phone               ON otp_codes(phone, consumed);
CREATE INDEX IF NOT EXISTS idx_sessions_user           ON sessions(user_id);
