# Wingman Notetaker Bot Worker

A headless-browser bot that joins a Google Meet / Zoom call as **"Wingman
Notetaker"**, waits for the host to admit it, records the call audio, and hands
the recording back to the Wingman backend — which then transcribes it, writes the
summary + action items, emails the user, updates the app, and creates task
reminders.

This is **self-hosted** (no third-party meeting service). It runs as its own
container on a **dedicated host**, separate from the app backend.

```
 calendar meeting ──► backend queues a bot session ──► THIS WORKER polls & claims
        │                                                        │
        │                                              opens Chromium (Xvfb)
        │                                              joins call, host admits
        │                                              records audio (ffmpeg+Pulse)
        ▼                                                        │
 backend pipeline ◄── POST /api/bot/sessions/:id/audio ◄─────────┘
 (transcript → summary → Drive → email user → app update → tasks)
```

---

## What it needs (be realistic)

- A **Linux host with ~2 GB RAM + 2 vCPU free per concurrent meeting.** The app
  droplet is too small to also run this — use a bigger droplet or the MacBook.
- **Docker.** Everything (Chromium, Xvfb, PulseAudio, ffmpeg) is in the image.
- Meetings are processed **one at a time** per worker (single audio sink). Run
  more worker containers, or add per-session sinks, to do several at once
  (see *Scaling*).

---

## Setup

### 1. Backend side (one-time)
Add a shared secret to the **backend** `.env` and redeploy:

```
BOT_WORKER_TOKEN=<a long random string>
BOT_NAME=Wingman Notetaker      # optional, this is the default
```

Without `BOT_WORKER_TOKEN` the backend's `/api/bot/*` routes return 503 and
nothing dispatches — that's the safety switch.

### 2. Worker side
```bash
cd bot-worker
cp .env.example .env      # set BACKEND_URL + the SAME BOT_WORKER_TOKEN
docker build -t wingman-bot .
docker run -d --name wingman-bot --restart unless-stopped \
  --shm-size=1g \
  --env-file .env \
  wingman-bot
```

Watch it:
```bash
docker logs -f wingman-bot
```

### 3. Turn on auto-join for the user
Either flip the per-user preference via the app/API:
```
POST /api/meetings/auto-join   { "enabled": true }
```
…so every upcoming calendar meeting that has a video link gets the bot — or send
it to a single meeting on demand:
```
POST /api/meetings/join        { "gcalEventId": "..." }      # a calendar event
POST /api/meetings/join        { "meetingUrl": "https://meet.google.com/xxx-yyyy-zzz" }
```

---

## Consent & etiquette
The bot joins under an obvious name (**"Wingman Notetaker"**) so everyone can see
a notetaker is present — recording people without notice is illegal in many
places. Keep the name honest; don't disguise it.

---

## The one thing that needs tuning on the host
Meet/Zoom have no stable API; their **DOM/button labels change over time.** The
join selectors live in [`src/meet.js`](src/meet.js) and [`src/zoom.js`](src/zoom.js)
with several fallbacks and verbose logging. Do **one dry run against a real test
meeting on the host** and adjust any selector that logs "not found". Meet is the
more reliable target; Zoom's web client is experimental.

Test a single job without the loop:
```bash
docker run --rm --env-file .env -e RUN_ONCE=1 wingman-bot
```

## Meet that blocks anonymous guests ("Signed-in bot account")
Some corporate Meets don't allow guest join. For those, run the bot signed in:

1. On a desktop, once: `npx playwright open --save-storage=google-state.json https://accounts.google.com`
   and log into the bot's Google account.
2. Copy `google-state.json` into the worker (mount or COPY it), and set
   `STORAGE_STATE=/app/google-state.json` in `.env`.

Use a dedicated Google account for the bot, not a personal one.

## Scaling (concurrent meetings)
One container = one meeting at a time (single default Pulse sink). To run N at
once: run N worker containers (simplest), or extend `start.sh` to make a sink per
session and pass `PULSE_MONITOR` per job. RAM is the limit (~1 GB/meeting).

## Env reference
See [.env.example](.env.example). Key ones: `BACKEND_URL`, `BOT_WORKER_TOKEN`
(must match backend), `MAX_MEETING_MIN`, `ADMIT_TIMEOUT_MS`, `STORAGE_STATE`.
