# Wingman

A proactive AI personal assistant that lives on WhatsApp. One Node process runs
everything: the Express API, the built web UI, the proactive schedulers, and the
WhatsApp client.

---

## Stack

- **Node 20** (`engines: >=20 <23`), CommonJS (`require`, not `import`)
- **Express 5** — `src/server.js` is the entry point
- **better-sqlite3** — synchronous SQLite. No ORM, no async/await on DB calls.
- **@anthropic-ai/sdk** — main LLM
- **whatsapp-web.js** (Puppeteer/Chromium) *or* WhatsApp Business Cloud API —
  see "WhatsApp has two modes" below
- **Vite + React + TypeScript** for the frontends

---

## Repo layout

```
src/
  server.js        entry point — routes, static serving, scheduler boot  (LARGE, ~43KB)
  config.js        SINGLE SOURCE OF TRUTH for all env vars — read this first
  api/             HTTP route handlers        (dashboard.js is ~52KB)
  auth/            Google OAuth, Shopify OAuth, session routes
  db/              one file per table + schema.sql. All sync (better-sqlite3).
  engine/          LLM tool definitions + executors  (systemPrompt.js is ~44KB)
  services/        integrations & business logic (gmail, calendar, recall, work…)
  whatsapp/        client.js (whatsapp-web.js) + cloudApi.js (Meta Cloud API)
  utils/           time, secrets, outbound URL helpers
  admin/qr.js      browser-based WhatsApp pairing page

app/               PRIMARY web UI (Vite PWA)  ← served at / when built
client/            LEGACY dashboard (Vite + Tailwind) ← fallback only
landing/           marketing site
mobile/            mobile shell
bot-worker/        separate container: meeting notetaker bot (own Dockerfile)
scripts/           ad-hoc test scripts (test-*.js) — NOT a test suite
data/              SQLite DB lives here (gitignored)
```

### Which UI gets served

`config.js` picks the UI at boot:

```js
uiDist = fs.existsSync(app/dist/index.html) ? app/dist : client/dist
```

So **`app/` wins if it has been built.** If a UI change isn't showing up, check
which `dist` actually exists before debugging anything else.

---

## The engine pattern (important convention)

Every LLM capability is a **pair** of files in `src/engine/`:

- `xxxTools.js` — the tool *schemas* handed to Claude
- `xxxExecutor.js` — the functions that actually run when Claude calls them

Existing pairs: `gmail`, `calendar`, `drive`, `task`, `goal`, `health`, `maps`,
`memory`, `news`, `shopify`, `vault`, `voice`, `webmail`, `work`, `browser`,
`agent`, `audit`, `automation`.

**To add a capability, add both files and register them** — don't put tool logic
in `services/`. `services/` is for integrations the executors call.

---

## Config & environment

**`src/config.js` is the only place env vars are read.** Never call
`process.env.X` elsewhere — add it to `config.js` instead. It is heavily
commented; those comments explain *why* each default is what it is. Read them
before changing a default.

Several config sections expose an `enabled` getter (`shopify.enabled`,
`gemini.enabled`, `nowhrms.enabled`, …). A feature with no credentials degrades
gracefully rather than crashing — preserve that behaviour.

### Models

| Purpose | Env var | Default |
| --- | --- | --- |
| Main chat (WhatsApp) | `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| Deep reasoning (proactive brain, goal planning) | `ANTHROPIC_MODEL_DEEP` | `claude-opus-5` |
| Cheap/high-volume (email classify, behaviour learning) | `ANTHROPIC_MODEL_CHEAP` | `claude-haiku-4-5` |
| Meeting transcription | `GEMINI_MODEL` | `gemini-2.5-flash` |
| Voice STT/TTS fallback | `OPENAI_API_KEY` | Whisper / gpt-4o-mini-tts |

**`GEMINI_MODEL` is pinned to a GA version on purpose — never set it to a
`*-latest` alias.** The alias silently moved to a "thinking" flash once and
transcripts came back empty. Transcription also sets `thinkingBudget: 0`.

> `.env.example` is not always in sync with `config.js`. When they disagree,
> `config.js` is right. If you add a var, update both.

---

## WhatsApp has two modes

1. **Cloud API** (Meta official) — used automatically when `WHATSAPP_TOKEN` and
   `WHATSAPP_PHONE_NUMBER_ID` are both set. No Chromium needed. Preferred in prod.
2. **whatsapp-web.js** — Puppeteer-driven. Needs Chromium, needs QR pairing at
   `/admin/qr?key=$ADMIN_PASSWORD`, and stores its session in `.wwebjs_auth/`.

`DISABLE_WHATSAPP=1` runs API + UI only — useful for local UI work and screenshots.

### Message templates (Cloud API)

Outside WhatsApp's 24h customer-service window, only approved templates can be
sent. Template parameter counts differ per template (`BRIEFING`=6, `WRAP`=7,
`PROACTIVE`=1), so **they must never fall back to one another.** WhatsApp also
forbids newlines inside a template variable — that is why `BRIEFING_READY_TEMPLATE`
uses a quick-reply button to reopen the window before sending rich content.

---

## Deployment

**Production runs on a DigitalOcean droplet as a Docker container.**

> `DEPLOYMENT.md` in this repo documents the OLD Railway setup and is stale.
> Do not follow it. `railway.json` is likewise a leftover.

The container binds to `127.0.0.1:3000` behind a reverse proxy, takes its env
from `--env-file .env` on the droplet, and mounts a host volume for persistent
data.

### State that must survive a redeploy

| Data | Path in container |
| --- | --- |
| SQLite DB | `/app/data/wingman.db` (`DATABASE_PATH`) |
| WhatsApp session | `/app/data/.wwebjs_auth` (`WHATSAPP_SESSION_PATH`) |

Keep the WhatsApp session on the **same mounted volume** as the DB, otherwise
every deploy forces a fresh QR scan.

### Env changes don't need a rebuild

If only `.env` changed, recreate the container — a full image rebuild is wasted
time. Code changes need a rebuild.

---

## Never commit

`.env` · `*.db` · `.wwebjs_auth/` · `.wwebjs_cache/` ·
`bot-worker/google-state.json` (a signed-in Google session — a real secret) ·
`*.state.json`

All are in `.gitignore`. Check before staging; some of these files exist on disk
right now.

---

## Working in this repo

- **Large files** — `api/dashboard.js` (~52KB), `engine/systemPrompt.js` (~44KB),
  `src/server.js` (~43KB), `whatsapp/client.js` (~28KB), `db/schema.sql` (~23KB).
  Search within them; don't read them whole without reason.
- **No test suite.** `scripts/test-*.js` are ad-hoc scripts run by hand, not CI.
  Don't assume `npm test` exists.
- **DB access is synchronous.** Don't `await` better-sqlite3 calls or wrap them
  in promises.
- **Schema changes** go in `src/db/schema.sql`; `npm run initdb` applies it.
- The user writes and reads **English and Roman Urdu** — transcription and STT
  settings deliberately keep Roman Urdu in Latin script. Don't "fix" that to Urdu
  script.

## Commands

```bash
npm start                      # node src/server.js
npm run initdb                 # apply src/db/schema.sql
npm run build:client           # build the LEGACY client/ UI
cd app && npm run build        # build the PRIMARY app/ UI

# local prod-ish preview, no WhatsApp:
NODE_ENV=production DISABLE_WHATSAPP=1 ADMIN_PASSWORD=demo npm start
```
