# Wingman

**A proactive AI personal assistant that lives on WhatsApp.**

Wingman connects to your email, calendar, health data, and other sources to proactively manage your day — morning briefings, urgent-email alerts, bill reminders, delivery updates, and travel planning. It messages you **first**; it doesn't wait to be asked.

This repository is a **feature-complete prototype**: a Node.js + Express backend, a SQLite database with the full schema, a Claude-powered conversation engine, Gmail + Google Calendar integration, proactive schedulers (briefings, bill/delivery/follow-up alerts, meeting prep), a Travel Assistant and People CRM, and a **mobile-first React PWA dashboard** in `/client`. WhatsApp is integrated via `whatsapp-web.js` (QR pairing). It is production-ready for Railway: one container serves the API, the built dashboard, and a browser-based `/admin/qr` pairing page.

---

## Tech Stack

| Layer         | Choice                                             |
| ------------- | -------------------------------------------------- |
| Backend       | Node.js + Express                                  |
| Database      | SQLite (`better-sqlite3`) at `./data/wingman.db`   |
| LLM           | Anthropic Claude (`claude-sonnet-4-6`)             |
| WhatsApp      | `whatsapp-web.js` (LocalAuth, QR pairing)          |
| Email / Cal   | `googleapis` (Gmail + Google Calendar, OAuth 2.0)  |
| Scheduler     | `node-cron`                                        |
| Dashboard     | React + TypeScript + Tailwind + Vite (PWA) in `/client` |

---

## Project Structure

```
wingman/
├── data/                     # SQLite DB lives here (gitignored)
│   └── .gitkeep
├── src/
│   ├── config.js             # env + config loader
│   ├── server.js             # Express app + bootstrap (entrypoint)
│   ├── db/
│   │   ├── index.js          # opens SQLite, applies schema, uuid()
│   │   ├── schema.sql        # ALL tables (users, conversations, tasks, ...)
│   │   └── conversations.js  # message logging repo (in + out)
│   ├── whatsapp/
│   │   └── client.js         # whatsapp-web.js client, QR, sendMessage, sendRaw
│   ├── engine/
│   │   ├── conversation.js   # Claude conversation engine + onboarding state machine
│   │   ├── systemPrompt.js   # Wingman system prompt (personalized per user)
│   │   └── taskExtractor.js  # detects reminders/to-dos and extracts task fields
│   ├── db/
│   │   ├── users.js          # users repo (lookup/create/update, onboarding state)
│   │   └── tasks.js          # tasks repo
│   └── llm/
│       └── claude.js         # Anthropic Claude wrapper (complete + chat)
│
│   ├── auth/
│   │   ├── googleAuth.js     # OAuth2 client, combined Calendar+Gmail scopes
│   │   └── routes.js         # /auth/google + /auth/google/callback
│   ├── services/
│   │   ├── calendar.js       # Google Calendar read/write + conflict checks
│   │   ├── gmail.js          # Gmail list/fetch/parse/send
│   │   ├── emailAnalyzer.js  # Claude email classifier (strict JSON)
│   │   ├── emailScanner.js   # node-cron scanner + fan-out + urgent alerts
│   │   └── emailDigest.js    # WhatsApp email digest formatter
│   └── db/
│       ├── emailItems.js, bills.js, deliveries.js, travel.js, calendarEvents.js
│
├── scripts/
│   ├── test-engine.js        # standalone engine test (no WhatsApp needed)
│   ├── test-calendar.js      # calendar tool-use test (mocked Google)
│   └── test-email.js         # email intelligence test (mocked Gmail)
├── .env                      # secrets (gitignored)
├── .env.example
├── .gitignore
└── package.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Install Chromium for Puppeteer (WhatsApp uses it under the hood)

```bash
npx puppeteer browsers install chrome
```

On a fresh Linux server you may also need the Chromium system libraries:

```bash
sudo apt-get install -y libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
  libgbm1 libasound2t64 libpango-1.0-0 libcairo2 libatspi2.0-0
```

### 3. Environment variables

Copy `.env.example` to `.env` and fill in values. `ANTHROPIC_API_KEY` is already set for this prototype. Google OAuth values can be added later.

---

## Run

```bash
npm start
```

On start you will see, in this order:

```
[db] Schema initialized at .../data/wingman.db
[server] Wingman HTTP API listening on port 3000
[whatsapp] Scan this QR code with your phone (WhatsApp > Linked Devices):
   <QR CODE RENDERED IN TERMINAL>
```

Once you scan it:

```
[whatsapp] Authenticated. Session saved locally.
Wingman is online!
```

The session is persisted in `./.wwebjs_auth` (LocalAuth), so **you only scan once** — subsequent restarts reconnect automatically.

---

## How the WhatsApp integration works

1. **`qr` event** → the QR code is rendered in the terminal with `qrcode-terminal`.
2. You scan it from **WhatsApp → Settings → Linked Devices → Link a Device** (just like WhatsApp Web).
3. **`ready` event** → logs `Wingman is online!`.
4. **`message` event** → every incoming message is handed to the Claude conversation engine (below), which stores the user message (`role = 'user'`), generates an intelligent reply, and stores it (`role = 'assistant'`).
5. **`sendMessage(phoneNumber, text)`** → utility to send a WhatsApp message to any number/contact; the outgoing message is also logged.

### Intelligent conversation engine

Incoming text messages are handled by `src/engine/conversation.js`:

1. **User lookup / creation** by phone number in the `users` table.
2. **Onboarding** for new users — a step machine (`ask_name → ask_timezone → ask_hours → complete`) stored in `users.preferences.onboarding`:
   - `Hey! I'm Wingman — your AI chief of staff. What should I call you?`
   - saves the name, asks timezone, asks work hours, then marks onboarding complete.
3. **Existing users** — loads the **last 20 messages** from `conversations` as context.
4. Calls **Claude (`claude-sonnet-4-6`)** with Wingman's system prompt + the message history.
5. **Task creation** — a lightweight Claude-based extractor detects reminders/to-dos (e.g. *"remind me to call Ali at 4pm"*) and inserts a row into `tasks` with a resolved due date.
6. Both the inbound user message and the assistant reply are stored in `conversations`.

You can exercise the whole engine without WhatsApp:

```bash
node scripts/test-engine.js
```

### Test it end-to-end

1. Run `npm start` and scan the QR with your phone.
2. Wait for `Wingman is online!`.
3. Ask a friend (or another number) to WhatsApp you.
4. Wingman auto-replies: `Wingman received: <their message>`.
5. Check the log: `curl http://localhost:3000/conversations`.

---

## HTTP API (utility endpoints)

| Method | Path              | Description                                        |
| ------ | ----------------- | -------------------------------------------------- |
| GET    | `/`               | Status: WhatsApp readiness + messages logged       |
| GET    | `/health`         | Simple health check                                |
| GET    | `/conversations`  | Recent conversation log (`?limit=50`)              |
| POST   | `/send`           | Send a WhatsApp message: `{ "to": "...", "text": "..." }` |

Example:

```bash
curl -X POST http://localhost:3000/send \
  -H 'Content-Type: application/json' \
  -d '{"to":"971501234567","text":"Hello from Wingman"}'
```

> Note: `/send` requires the WhatsApp client to be `ready` (scanned + connected).

---

## Database Schema

All tables live in `src/db/schema.sql` and are created idempotently on startup (`CREATE TABLE IF NOT EXISTS`). Per the SQLite constraints:

- **IDs** are `TEXT`, generated in code with `crypto.randomUUID()`.
- **JSONB** columns are stored as `TEXT` (JSON stringified/parsed in code).
- **Timestamps** use `TEXT DEFAULT (datetime('now'))`.

Tables: `users`, `conversations`, `tasks`, `email_items`, `bills`, `deliveries`, `calendar_events`, `travel`, `health_data`, `contacts`, `briefings`, `reminders`.

The `users`, `conversations`, `tasks`, `email_items`, `bills`, and `deliveries` tables match the exact definitions you provided; the remaining tables (`calendar_events`, `travel`, `health_data`, `contacts`, `briefings`, `reminders`) are spec-aligned additions supporting Wingman's eight intelligence modules.

---

## Email intelligence (Gmail)

Wingman connects Gmail via the **same Google OAuth consent** as Calendar (combined scopes: `gmail.readonly`, `gmail.send`, `gmail.modify` alongside the calendar scopes). Tokens are stored in `users.gmail_token`.

**Connect:** message Wingman `connect email` → tap the link → approve. You'll get `Email connected! ✓ I'll start scanning your inbox now.` and an initial scan runs immediately.

**Scanner** (`src/services/emailScanner.js`) runs on a **`node-cron` job every 15 minutes**. For each new message it:

1. Fetches subject/sender/body from the Gmail API (de-duped by `gmail_id`).
2. Sends it to **Claude** for strict-JSON classification: `category` (urgent/needs_reply/fyi/spam), `summary`, `action_needed`, `detected_type` (bill/order/flight/meeting_request/general), `extracted_data`, and a `draft_reply`.
3. Stores the result in `email_items`.
4. **Fans out** by type: `bill → bills`, `order → deliveries`, `flight → travel` (all de-duped and linked back via `source_email_id`).
5. If `category = urgent`, immediately sends a WhatsApp alert: `🚨 Urgent email from [sender]: [summary]`.

**Digest:** message `check my email` → Wingman replies with a WhatsApp-formatted digest grouped into **Urgent / Needs Reply / FYI** (`src/services/emailDigest.js`).

Exercise the whole pipeline without a real inbox (mocked Gmail, live Claude):

```bash
node scripts/test-email.js
```

---

## Proactive engine (briefings, alerts, follow-ups)

Wingman now reaches out **first**. A single **`node-cron` tick runs at the top of every hour** (`src/services/scheduler.js`) and each service decides which users' *local* time matches its target hour, so scheduling is correct across timezones.

| Local time | Job | What it sends |
| ---------- | --- | ------------- |
| **07:00** | Morning briefing (`morningBriefing.js`) | Weather, today's schedule, email counts, tasks due, upcoming bills, active deliveries, latest health. Stored in `briefings`. |
| **09:00** | Task reminder (`taskIntents.js`) | Nudge listing tasks due today. |
| **09:00** | Bill alerts (`billAlerts.js`) | Due-soon (≤ 3 days) and overdue reminders. |
| **09:00** | Delivery check (`deliveryAlerts.js`) | Return-window-closing alerts. |
| **09:00** | Follow-up tracker (`followupTracker.js`) | Overdue promises (made & received). |
| **20:00** | End-of-day wrap (`endOfDayWrap.js`) | Completed-vs-total tasks, emails handled, meetings, tomorrow preview. Stored in `briefings`. |

**Conversational commands** (handled deterministically in the engine before falling back to Claude):

- **Tasks:** “what are my tasks?”, “what's overdue?”, “done with <task>”, “move <task> to tomorrow”.
- **Bills:** “any bills due?”, “paid my amex” (marks a bill paid).
- **Deliveries:** “where's my order?”.

**Follow-up tracker** detects commitments in scanned mail (including recent **Sent** mail so it captures promises *you* made). It records `promise_made` / `promise_received` rows in the `followups` table with due dates, then nudges when they go overdue.

**Status-change delivery alerts:** when the scanner sees a delivery's status change, it sends `📦 Update: Your <item> — <status>. ETA: <date>`.

Manual triggers for testing (no waiting for the clock):

```bash
# POST /trigger/:job/:userId  where job = morning|wrap|bills|deliveries|followups|taskreminder
curl -X POST http://localhost:3000/trigger/morning/<userId>
curl http://localhost:3000/briefings/<userId>
```

Exercise the whole proactive layer offline (seeded data, mocked WhatsApp, live Claude for follow-ups):

```bash
node scripts/test-proactive.js
```

---

## Travel, People CRM & Meeting Prep

Wingman now compiles trips, remembers the people you deal with, and briefs you before meetings.

**Travel Assistant** (`src/services/travelAssistant.js`)
- When a flight email is detected, Wingman stores the trip and then tries to attach a matching hotel booking from your inbox into a single **itinerary**.
- Proactive flight alerts: **24h before** and **3h before** departure, plus an **arrival-day** briefing with hotel check-in, destination **weather**, and **packing** tips.
- Commands: `any upcoming trips?`, `show my <city> itinerary`, `what's the weather in <city>?`, `how much did my <city> trip cost?` (compiles flight + receipt charges).

**People CRM** (`src/services/peopleCRM.js` + `contacts` table)
- Every scanned email auto-populates a contact (sender parsed into name + email), incrementing `interaction_count` and last-contacted date.
- Relationship **strength** buckets: `occasional` (<5), `regular` (5+), `close` (15+).
- Contacts with **5+ interactions** are enriched by Claude with a short relationship summary stored in `notes`.
- Commands: `what do I know about <name>?`, `when did I last talk to <name>?`, `who have I emailed the most this month?`.

**Meeting Prep** (`src/services/meetingPrep.js`)
- A cron runs **every 30 minutes**; for events starting in the next ~30–45 min, Wingman sends a prep note summarizing each attendee — pulling their CRM relationship notes and the most recent email context.

**Scheduler additions** (`src/services/scheduler.js`)
- Travel alerts run on the hourly tick; meeting-prep runs on its own `*/30 * * * *` cron.

**Manual triggers for testing** (in addition to Session 5's):
```
POST /trigger/travel/:userId
POST /trigger/meetingprep/:userId
```

**Self-test:**
```bash
node scripts/test-session6.js
```

---

## Mobile-first dashboard (`/client`)

A **React + TypeScript + Tailwind + Vite PWA** lives in `client/`. It is mobile-first (designed at 375px, verified at 393px) and scales up to a desktop sidebar at 1024px+. It consumes JSON endpoints served by this backend under `/api`, and every endpoint falls back to rich, realistic **demo data** (keyed to Aamir / Asia/Dubai / PKR + AED) so the UI is fully populated for screenshots even before Google is connected.

**Highlights**

- **Bottom tab bar** (56px, fixed) as primary nav — Home, Calendar, Email, Tasks, More; "More" opens a **bottom sheet** (Bills, Deliveries, Travel, Health, People, Settings).
- **Bottom-sheet modals**, **swipe-to-complete** tasks, **swipe-to-pay** bills, **pull-to-refresh**, and **tap ripple** (no hover-only interactions).
- Calendar defaults to a **day view** on mobile; Tasks render as a **status-grouped list** (not a kanban); Deliveries use a horizontal progress tracker sized for phone width.
- **PWA**: `manifest.json`, maskable icons, Apple meta tags, viewport lock, and a service worker (`public/sw.js`) that caches the app shell but never the API.
- **Desktop** (≥1024px): left sidebar with all pages; bottom bar hidden.

**API endpoints** (in `src/api/dashboard.js`, mounted at `/api`): `me`, `dashboard`, `calendar`, `emails`, `tasks`, `bills`, `deliveries`, `travel`, `health`, `contacts`, `followups`, `briefings`, plus `POST /api/tasks/:id/complete` and `POST /api/bills/:id/pay`. Mock data lives in `src/api/mockData.js`.

**Run:**

```bash
npm start                 # backend + API on :3000 (DISABLE_WHATSAPP=1 to skip WhatsApp)
cd client && npm install && npm run dev   # dashboard on :5173 (proxies /api -> :3000)
```

See `client/README.md` for full details.

---

## Demo Flow

A ready-to-record walkthrough for the investor demo. Open the deployed app on your
phone (`https://wingman.wehearyou.studio`) alongside WhatsApp.

| # | Action | What to show |
| - | ------ | ------------ |
| a | Open `wingman.wehearyou.studio` on your phone | The **Home dashboard** loads — greeting for Aamir, the morning-briefing banner, and the stacked cards (Today, Email, Tasks, Bills, Deliveries, Travel, Health). |
| b | Scroll the cards, then tap into **Calendar → Email → Bills → Deliveries** via the bottom tab bar / More sheet | Day-view calendar, category-grouped email, PKR/AED bills with status, and the horizontal delivery tracker. |
| c | Switch to **WhatsApp** | The proactive **morning briefing** message Wingman sent first (weather, schedule, emails, tasks, bills). |
| d | Type **“what’s my schedule tomorrow?”** | Wingman replies with the 📅 formatted day schedule pulled from Google Calendar. |
| e | Type **“any urgent emails?”** | The 📧 email digest grouped into Urgent / Needs Reply / FYI. |
| f | Type **“remind me to call Ali at 4pm”** | Wingman confirms and creates a task (resolved to 4pm Asia/Dubai). |
| g | Back to the **dashboard → Tasks** | The new “Call Ali” task appears in the list. |
| h | Show a **bill alert** | The proactive 💰 due-soon/overdue WhatsApp alert (e.g. Emergent Cloud, PKR 250K). |
| i | Show a **delivery update** | The 📦 status-change alert and the Deliveries page tracker (e.g. Nike Air Max — arriving). |

> Tip: to demo the proactive messages on cue without waiting for the clock, use the
> manual triggers: `POST /trigger/morning/:userId`, `/trigger/bills/:userId`,
> `/trigger/deliveries/:userId` (see below).

---

## Deployment

One container serves the API, the built dashboard, the schedulers, and WhatsApp.
In production the Express server serves `client/dist` (static + SPA fallback) so a
single Railway service hosts everything, plus a password-protected **`/admin/qr`**
page to pair WhatsApp from your phone browser (no terminal needed).

See **[`DEPLOYMENT.md`](./DEPLOYMENT.md)** for the full Railway guide (Dockerfile,
environment variables, persistent volume at `/app/data`, custom domain, and the
Google OAuth redirect update).

Local production preview:

```bash
cd client && npm install && npm run build
cd .. && npm install
NODE_ENV=production ADMIN_PASSWORD=demo123 DISABLE_WHATSAPP=1 npm start
# http://localhost:3000  (dashboard) · /api/* (data) · /admin/qr?key=demo123
```

---

## Roadmap (next sprints)

Per the product spec's 50-day plan, the immediate next steps on top of this foundation are:

- **Sprint 1** — Google Calendar read+write, natural-language scheduling, morning briefing engine.
- **Sprint 2** — Gmail OAuth, inbox triage (Urgent/Reply/FYI/Spam) via Claude, bill & order detection.
- **Sprint 3** — Health ingestion, health-aware scheduling, billing calendar, delivery tracking alerts.
- **Sprint 4** — Travel itineraries, People CRM, meeting prep notes. ✅ *(implemented)*
- **Sprint 5** — Multi-language (EN/UR/AR), onboarding, launch.
