# Wingman — Deployment Guide (Railway)

This guide takes the feature-complete prototype from `localhost` to a public URL
that works on any device. One container runs **everything**: the Express API, the
built React dashboard, the proactive schedulers, and the WhatsApp client.

---

## 1. What ships in the container

The included [`Dockerfile`](./Dockerfile) does all of the following:

1. Installs backend Node dependencies (`npm install --omit=dev`).
2. Installs client dependencies and builds the React app (`client/dist`).
3. Installs the system **Chromium** + libraries that `whatsapp-web.js` (Puppeteer)
   needs, and points Puppeteer at it via `PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium`.
4. Starts the server with `dumb-init` (so orphaned Chromium processes are reaped).

In production (`NODE_ENV=production`) the Express server serves `client/dist` as
static files and falls back to `index.html` for client-side routes — so a single
Railway service hosts the API **and** the dashboard **and** `/admin/qr`.

---

## 2. Persistent storage (important)

The SQLite DB and the WhatsApp session must survive redeploys, so mount a
**Railway volume** and keep both under it:

| Data | Path | How |
| --- | --- | --- |
| SQLite database | `/app/data/wingman.db` | Volume mounted at `/app/data` (set `DATABASE_PATH=/app/data/wingman.db`) |
| WhatsApp session | `/app/.wwebjs_auth` | Set `WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth` to keep it on the same volume |

> Set `WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth` so you only scan the QR once —
> the LocalAuth session then persists across deploys on the volume.

---

## 3. Environment variables (set on Railway)

```
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://YOUR-RAILWAY-URL           # or https://wingman.wehearyou.studio

ANTHROPIC_API_KEY=sk-ant-xxx
ANTHROPIC_MODEL=claude-sonnet-4-5

GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GOOGLE_REDIRECT_URI=https://YOUR-RAILWAY-URL/auth/google/callback

DATABASE_PATH=/app/data/wingman.db
WHATSAPP_SESSION_PATH=/app/data/.wwebjs_auth

ADMIN_PASSWORD=choose-a-strong-secret              # protects /admin/qr

WEATHER_API_KEY=xxx                                # optional (OpenWeatherMap); omit to use the built-in fallback
WEATHER_DEFAULT_CITY=Dubai
```

---

## 4. Deploy

**Option A — Railway CLI**
```bash
npm i -g @railway/cli
railway login
railway init            # create/link a project
railway up              # builds the Dockerfile and deploys
```
Then in the Railway dashboard: add the **Variables** above, add a **Volume** mounted
at `/app/data`, and (optionally) a custom domain.

**Option B — GitHub**
Push this repo to GitHub, create a Railway project **from the repo**. Railway detects
the `Dockerfile` (declared in [`railway.json`](./railway.json)) and builds it. Add the
variables and volume as above.

---

## 5. Connect WhatsApp on the deployed server (no terminal needed)

Because Railway has no interactive terminal, pair WhatsApp from your **phone browser**:

1. Open `https://YOUR-RAILWAY-URL/admin/qr?key=YOUR_ADMIN_PASSWORD`.
2. The page shows the live WhatsApp QR (auto-refreshes) and the connection status.
3. On your phone: **WhatsApp → Linked Devices → Link a Device → scan**.
4. When paired, the page shows **“Wingman is online!”**. The session is saved to the
   volume, so you won’t need to re-scan on future deploys.

---

## 6. Domain + OAuth

1. In Railway, add the custom domain `wingman.wehearyou.studio` and create the
   `CNAME` it gives you at your DNS provider.
2. In **Google Cloud Console → Credentials → OAuth client**, add the production
   redirect URI: `https://wingman.wehearyou.studio/auth/google/callback`
   (keep the localhost one for local dev).
3. Set `PUBLIC_BASE_URL` and `GOOGLE_REDIRECT_URI` to the production domain and redeploy.

---

## 7. Production smoke test

- Open the URL on your phone → the **Home dashboard** loads (mock data by default).
- Browser menu → **Add to Home Screen** → installs as a PWA icon.
- `/admin/qr?key=…` → scan → **Wingman is online!**
- WhatsApp a message → intelligent reply.
- In the app, message **“connect email”** / **“connect calendar”** → approve Google →
  real data replaces mock on the dashboard.

---

## 8. Local production preview (what was verified in the sandbox)

```bash
cd client && npm install && npm run build      # produces client/dist
cd .. && npm install
NODE_ENV=production ADMIN_PASSWORD=demo123 DISABLE_WHATSAPP=1 npm start
# → http://localhost:3000  (dashboard)   /api/*  (data)   /admin/qr?key=demo123
```
`DISABLE_WHATSAPP=1` runs API + dashboard only (handy for screenshots). Omit it to
enable WhatsApp pairing.
