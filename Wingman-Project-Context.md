# Wingman — Project Context

> **Purpose:** This file gives Claude (and any new teammate) the full working context
> for the Wingman project — what it is, how it's built, how it deploys, what already
> exists, and the hard-won lessons that aren't obvious from the code. Add it to your
> Claude Desktop project so every chat starts with this context.
>
> **No secrets live here.** API keys, passwords and tokens live only in `.env` on the
> server — never in this file or the repo.

---

## 1. What Wingman is

Wingman is a **proactive AI personal assistant that lives on WhatsApp** (with a
companion web app / PWA). One Node process runs everything: the Express API, the
built web UI, the proactive schedulers, and the WhatsApp client.

- Built by the **RAD / wehearyou.studio** team.
- Live at **imyourwingman.ai** (marketing landing) and **app.imyourwingman.ai** (the app).
- It reads/sends email, manages calendar and tasks, tracks bills/deliveries/travel,
  gives morning briefings and end-of-day wraps, records & summarises meetings, and
  proactively messages the user when something needs attention.
- The user writes/reads **English and Roman Urdu** — transcription/STT deliberately
  keep Roman Urdu in Latin script. Don't "fix" that to Urdu script.

---

## 2. Tech stack

- **Node 20** (`engines: >=20 <23`), **CommonJS** (`require`, not `import`).
- **Express 5** — `src/server.js` is the entry point.
- **better-sqlite3** — synchronous SQLite. No ORM. **Never `await` a DB call** or wrap it in a promise.
- **@anthropic-ai/sdk** — main LLM (Claude).
- **whatsapp-web.js** (Puppeteer/Chromium) *or* **WhatsApp Business Cloud API** (see §6).
- **Gemini** — meeting transcription. **OpenAI** — voice STT/TTS fallback.
- **Vite + React + TypeScript** for the frontends.

---

## 3. Repo layout

```
src/
  server.js        entry point — routes, static serving, scheduler boot  (~43KB)
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
client/            LEGACY dashboard ← fallback only
landing/           marketing site (static, served by Caddy)
bot-worker/        separate container: meeting notetaker fallback (own Dockerfile)
scripts/           ad-hoc test scripts (test-*.js) — NOT a test suite
data/              SQLite DB lives here (gitignored)
docs/              setup notes (e.g. waitlist-sheet.md)
```

**Large files** (search within, don't read whole): `api/dashboard.js` (~52KB),
`engine/systemPrompt.js` (~44KB), `src/server.js` (~43KB), `whatsapp/client.js` (~28KB),
`db/schema.sql` (~23KB).

---

## 4. Core conventions

**The engine pattern.** Every LLM capability is a **pair** in `src/engine/`:
- `xxxTools.js` — the tool *schemas* handed to Claude.
- `xxxExecutor.js` — the functions that run when Claude calls them.

Pairs: gmail, calendar, drive, task, goal, health, maps, memory, news, shopify,
vault, voice, webmail, work, browser, agent, audit, automation.
**To add a capability: add both files and register them.** Don't put tool logic in
`services/` — that's for integrations the executors call.

**Config.** `src/config.js` is the **only** place env vars are read. Never
`process.env.X` elsewhere — add it to `config.js`. It's heavily commented (comments
explain *why* each default is what it is). Several sections expose an `enabled` getter
(`shopify.enabled`, `gemini.enabled`, `nowhrms.enabled`, `waitlist.sheetEnabled`, …) —
a feature with no credentials **degrades gracefully** rather than crashing. Preserve that.
`.env.example` is not always in sync with `config.js`; **`config.js` wins.** Add a var to both.

**DB.** Schema changes go in `src/db/schema.sql`; `npm run initdb` applies it. Access is synchronous.

**Which UI is served.** `config.js` picks at boot:
`uiDist = fs.existsSync(app/dist/index.html) ? app/dist : client/dist`. So **`app/`
wins if built.** If a UI change isn't showing, check which `dist` exists first.

---

## 5. Models

| Purpose | Env var | Default |
| --- | --- | --- |
| Main chat (WhatsApp) | `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| Deep reasoning (proactive brain, goal planning) | `ANTHROPIC_MODEL_DEEP` | `claude-opus-5` |
| Cheap/high-volume (email classify, behaviour learning) | `ANTHROPIC_MODEL_CHEAP` | `claude-haiku-4-5` |
| Meeting transcription | `GEMINI_MODEL` | pinned GA flash (see gotcha) |
| Voice STT/TTS fallback | `OPENAI_API_KEY` | Whisper / gpt-4o-mini-tts |

---

## 6. WhatsApp has two modes

1. **Cloud API** (Meta official) — used automatically when `WHATSAPP_TOKEN` and
   `WHATSAPP_PHONE_NUMBER_ID` are both set. No Chromium needed. Preferred in prod.
2. **whatsapp-web.js** — Puppeteer-driven. Needs Chromium + QR pairing at
   `/admin/qr?key=$ADMIN_PASSWORD`; stores session in `.wwebjs_auth/`.

`DISABLE_WHATSAPP=1` runs API + UI only (local UI work / screenshots).

**24-hour window (Cloud API):** outside WhatsApp's 24h customer-service window, only
approved **templates** can be sent. Template parameter counts differ per template
(`BRIEFING`=6, `WRAP`=7, `PROACTIVE`=1) — they must **never** fall back to one another.
No newlines inside a template variable. **Reality check:** even approved briefing
templates have not reliably delivered after 24h — **email is the proven-reliable
channel** for rich content; templates still need Meta category/opt-in debugging.

---

## 7. Deployment (production)

**Production = a DigitalOcean droplet running a Docker container.** There is **NO
docker-compose** (`docker compose` fails — never use it). `DEPLOYMENT.md` and
`railway.json` in the repo are **stale leftovers** — ignore them.

**Redeploy (code changed) — must rebuild + recreate the container:**
```bash
cd /root/wingman && git fetch origin && git reset --hard origin/main && \
docker build -t wingman . && docker rm -f wingman && \
docker run -d --name wingman --restart unless-stopped \
  -p 127.0.0.1:3000:3000 --env-file .env \
  -v /root/wingman-data:/app/data wingman
```
Then `docker logs -f --tail=30 wingman`. Build ~2–4 min (chromium + both Vite builds;
2GB swap exists for it). **`git fetch` FIRST is mandatory** — `git reset --hard
origin/main` only resets to the *last-fetched* origin/main, so without a fresh fetch it
silently rebuilds stale code (symptom: `HEAD is now at <old commit>`, build all-CACHED
in ~1.6s). Verify the printed `HEAD is now at <hash>` matches the latest pushed commit.

**Env-only change → no rebuild.** Just recreate/restart the container:
`docker restart wingman` (or re-run `docker run` with `--env-file .env`).

**`.env` gotcha:** Docker `--env-file` does **not** strip quotes. Write values
**without** quotes or every value gets literal `"` (breaks paths/tokens).

**Landing page** (`landing/`, static) is served by **Caddy** from
`/var/www/wingman-landing` (Caddy's user can't read `/root`). The Docker redeploy does
**not** update the landing. After a landing change:
```bash
cd /root/wingman && git fetch origin && git reset --hard origin/main && \
cp -r landing/* /var/www/wingman-landing/ && systemctl reload caddy
```

---

## 8. Infrastructure & domains

- **Droplet:** `ubuntu-s-1vcpu-2gb-blr1`, Ubuntu 24.04, region BLR1, IP **168.144.158.202**.
  Root access via DigitalOcean **Web Console** (no personal SSH key; a read-only GitHub
  deploy key clones the repo). Repo: `git@github.com:radproduction/wingman-app.git`, code at `/root/wingman`.
- **Caddy** (host systemd service, `/etc/caddy/Caddyfile`) with auto Let's Encrypt HTTPS:
  - `imyourwingman.ai` → landing (static), but proxies `/webhook* /auth/* /api/* /admin/*
    /health* /_diag/* /work/* /send /conversations /briefings/* /trigger/*` to `127.0.0.1:3000`
    (so the WhatsApp webhook + Google OAuth keep working on the root).
  - `app.imyourwingman.ai` → the app (`reverse_proxy 127.0.0.1:3000`).
  - `www` → redirect to root.
- **Firewall:** ufw (22/80/443 only); **fail2ban** active.
- Container binds to `127.0.0.1:3000` (localhost only) behind the proxy.

---

## 9. State that must survive a redeploy

| Data | Path in container | Host volume |
| --- | --- | --- |
| SQLite DB | `/app/data/wingman.db` (`DATABASE_PATH`) | `/root/wingman-data` |
| WhatsApp session | `/app/data/.wwebjs_auth` (`WHATSAPP_SESSION_PATH`) | same volume |

Keep the WhatsApp session on the **same mounted volume** as the DB, or every deploy
forces a fresh QR scan. Keep the **same `SECRET_KEY`** across environments or encrypted
webmail/work/vault secrets won't decrypt.

---

## 10. Never commit

`.env` · `*.db` · `.wwebjs_auth/` · `.wwebjs_cache/` ·
`bot-worker/google-state.json` (a signed-in Google session — a real secret) · `*.state.json`.
All are in `.gitignore`. Check before staging.

---

## 11. What's built so far (current state, as of Sep 2026)

- **Goals + Goals-Coach sub-agent**, **audit trail** (every action logged, user-reviewable),
  **approve-before-critical-actions** (show recipient/amount, wait for explicit yes),
  **credential vault** (AES-256-GCM; secrets never readable by the LLM), **browser
  automation** (Phase 1: read). (The "Muse-parity" push after Meta launched a rival.)
- **Meeting notetaker (Recall.ai):** Wingman joins Google Meet as a cloud bot, records
  **audio + video**, transcribes with Gemini, emails + WhatsApps the notes, and saves the
  meeting **video to Drive**. Made robust: self-healing Gemini model fallback, Files API +
  time-segmented transcription for large/long meetings (up to ~5h), no-truncation summary,
  timeout measured from call-END (not bot creation), waiting-room admit alert, net-blip
  tolerant. Needs `RECALL_API_KEY` + `RECALL_API_URL`. Self-host (`bot-worker/`) kept only as
  fragile fallback. **Recording key must be `audio_mixed_mp3` (the old `audio_mixed` is ignored).**
- **NOW HRMS integration** (the user's company HRMS, nowhrms.com): 2-way clock (inbound
  webhook + outbound), event alerts, read-snapshot Q&A + briefing line, team view (manager),
  one-tap "Connect NOW HRMS" (employee enters only company email). UI: `app/src/app/WorkClock.tsx`
  at route `settings/work`. Config block: `config.nowhrms`.
- **Waitlist → live Google Sheet:** landing signups mirror into a Google Sheet (email/IP/
  country) in real time via a Google Apps Script Web App that upserts by email. Env
  `WAITLIST_SHEET_WEBHOOK_URL`; backfill route `POST /api/admin/waitlist/sync-sheet?key=$ADMIN_PASSWORD`;
  setup in `docs/waitlist-sheet.md`.
- **Profile self-healing:** `/api/me` auto-corrects a wrong/null-email primary Google account
  and backfills email/photo. Google OAuth needs the `userinfo.profile` scope for avatars
  (existing users must reconnect Google once).
- **Demo-readiness audit:** killed all fake/mock data in prod paths, real sign-in (OTP +
  session tokens), closed `?userId=` read access and task/bill IDOR.
- **Agent intelligence:** chat-learned facts (`behaviorLearner` → `user_memory`) + observed-
  behaviour layer (`behaviorPatterns.js`).
- **Duplicate-notification fix:** root cause was duplicate account rows + weak send-dedup;
  fixed with a last-10 key + ~30-min window + per-tick briefing merge.
- **Security overview docs** produced (client version + internal version) — see §13.

---

## 12. Known gotchas & hard-won lessons

- **`GEMINI_MODEL` is pinned to a GA version on purpose — never a `*-latest` alias.** The
  alias silently moved to a "thinking" flash once and transcripts came back empty.
  Transcription also sets `thinkingBudget: 0`. (Pinning to a since-retired GA version also
  caused 404s → there is now a self-healing model-fallback list.)
- **`.env` `ANTHROPIC_MODEL` override:** an override in `.env` beats the config default —
  watch for a stale model pinned there.
- **Docker `--env-file` doesn't strip quotes** — values without quotes.
- **`git fetch` before `git reset --hard`** on deploy, or you rebuild stale code.
- **No docker-compose** — it fails; always the `docker build && docker run` sequence.
- **Code change ⇒ rebuild; env-only ⇒ restart.**
- **`app/` dist vs `client/` dist** — `app/` wins if built.
- **Google Apps Script deploys are versioned:** editing the script code does NOT update the
  live `/exec` URL — you must publish a **New version** (Deploy → Manage deployments → New
  version). "Who has access" must be **Anyone** (not "Anyone with Google account"). A script
  error page still returns HTTP 200, so a caller's "success" doesn't prove rows were written.
- **No test suite.** `scripts/test-*.js` are ad-hoc, run by hand. No `npm test`.

---

## 13. Security posture (current) + roadmap

**Encryption at rest** — AES-256-GCM (per-value IV + auth tag; key from `SECRET_KEY`, never
in code) via `src/utils/secrets.js`. Encrypts: vault credentials, wearable health tokens,
work/HRMS action secret, webmail passwords. **Vault secrets are never returned to the LLM**
(server-side decrypt only). **In transit:** HTTPS/TLS everywhere (Caddy + Let's Encrypt).
**Auth:** OTP login (6-digit, 5-min, 5-attempt, single-use) + 256-bit session tokens (header,
not cookie) + strict per-user isolation. **AI safety:** approve-before-critical-actions +
full audit trail.

**Hardening roadmap (internal):**
- **P0:** encrypt Google OAuth tokens at rest (currently plaintext — `users.gmail_token`,
  `calendar_token`, `google_accounts.token`); set a strong `ADMIN_PASSWORD` (currently weak)
  and rotate any secrets shared in chat; automated encrypted off-site DB backups.
- **P1:** API rate limiting + OTP throttling; security headers (helmet: HSTS/CSP/etc.);
  tighten CORS (currently open `cors()`); session/device management (revoke sessions).
- **P2:** full-disk/volume encryption; secrets manager + key rotation; dependency/image
  scanning in CI; DPA + data-request workflow; third-party pen-test → SOC 2 readiness.

Two shareable overviews exist as HTML (client-facing simple version + full internal version).

---

## 14. Working commands

```bash
npm start                      # node src/server.js
npm run initdb                 # apply src/db/schema.sql
npm run build:client           # build the LEGACY client/ UI
cd app && npm run build        # build the PRIMARY app/ UI

# local prod-ish preview, no WhatsApp:
NODE_ENV=production DISABLE_WHATSAPP=1 ADMIN_PASSWORD=demo npm start
```

After `cd app && npm run build`, `app/dist` churns — commit only source (Docker rebuilds
dist); restore with `git checkout -- app/dist && git clean -f app/dist/assets/` if needed.

---

## 15. How the user works

- Communicates in **English + Roman Urdu**; keep Roman Urdu in Latin script.
- Deploys via the **DigitalOcean web console** (copy-paste commands), not local SSH.
- Values honesty over optimism: if something can still break, say so plainly. Don't
  over-promise ("this will 100% work") — give real risk. The notetaker and 24h-window
  issues have caused real embarrassment in front of the boss/clients, so reliability of
  meeting notes and message delivery matters a lot.
- Prefers changes that are **dynamic/self-healing** over per-user manual DB fixes.
```
