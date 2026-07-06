# Wingman Dashboard (Client)

A **mobile-first Progressive Web App** for Wingman, built with **React + TypeScript + Tailwind + Vite**. It is designed for a 375px phone viewport first and scales up to a desktop sidebar layout at 1024px+. It talks to the existing Wingman Express backend over a `/api` proxy and falls back to rich demo data so every screen looks fully populated (useful for screenshots/investor demos even before Google is connected).

## Run it

The dashboard needs the backend running for its API (the backend serves live data once Google is connected, and realistic mock data otherwise).

```bash
# 1) Start the backend (from the repo root)
npm start                     # serves the API on http://localhost:3000
# or, to skip WhatsApp while developing the UI:
DISABLE_WHATSAPP=1 npm start

# 2) Start the dashboard (from /client)
cd client
npm install
npm run dev                   # Vite dev server on http://localhost:5173
```

Vite proxies `/api/*` to `http://localhost:3000`, so the dashboard and backend run as one app in the browser.

Production build:

```bash
cd client
npm run build                 # outputs to client/dist
npm run preview               # preview the production build locally
```

## What's inside

### Design system
- Background `#020633`, cards `#0a1050`, accent lavender `#8b8fff`.
- Text white / gray `#8e9ab0` / light gray `#c8cee0`; success `#66ff88`, warning `#ffaa00`, danger `#ff6b6b`.
- Card radius 12–16px, touch targets ≥44px, page titles 24px, card titles 16px, body 14px, captions 12px.

### Mobile-first behavior
- **Bottom tab bar** (56px, fixed) is the primary navigation: Home, Calendar, Email, Tasks, More. Active tab is lavender.
- **"More"** opens a **bottom sheet** with Bills, Deliveries, Travel, Health, People, Settings.
- **Desktop sidebar** appears only at **1024px+**; the bottom bar is hidden there.
- **Bottom-sheet modals** on mobile (slide up), centered on desktop.
- **Swipe gestures**: swipe a task left to complete it; swipe a bill left to mark it paid.
- **Pull-to-refresh** on list pages (natural document scroll).
- **Tap ripple** on cards — no hover-dependent interactions.

### Pages
Home, Calendar (mobile **day view**, swipe between days), Email (full-width cards, tap to expand), Tasks (mobile **list grouped by status**, not a kanban), Bills, Deliveries (horizontal progress tracker sized for phone width), Travel, Health, People (CRM), Settings.

### PWA / Add to Home Screen
- `public/manifest.json` with standalone display, theme colors, and maskable 192/512 icons.
- Apple touch icon + `apple-mobile-web-app-*` meta tags.
- Viewport is locked (`maximum-scale=1, user-scalable=no, viewport-fit=cover`).
- A minimal service worker (`public/sw.js`) caches the app shell for installability and an offline shell; **API requests are never cached** so data stays live.

## API surface (served by the backend under `/api`)
`/api/me`, `/api/dashboard`, `/api/calendar`, `/api/emails`, `/api/tasks`, `/api/bills`, `/api/deliveries`, `/api/travel`, `/api/health`, `/api/contacts`, `/api/followups`, `/api/briefings`, plus mutations `POST /api/tasks/:id/complete` and `POST /api/bills/:id/pay`.

Each endpoint returns live DB data when available and falls back to demo data otherwise. Demo responses are tagged so the UI can show a subtle **"demo data"** badge.
