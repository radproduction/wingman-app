# Wingman Landing Page — Deploy

The public marketing site for **imyourwingman.ai**. Pure static (the original PHP
was only `include` glue — flattened into a single `index.html`). The heavy design
videos were compressed (113 MB → 11 MB) so the whole site is ~27 MB and ships in
the repo. It deploys with a plain `git pull` on the droplet — no PHP, no build.

```
landing/
  index.html            ← the whole page (hero, workflow, showcase, chaos, notes, signup)
  assets/               ← css, js, fonts, icons, images, videos (compressed)
```

## Target setup

| URL | Serves |
| --- | --- |
| `imyourwingman.ai` (+ `www`) | this landing page (Caddy static) |
| `app.imyourwingman.ai` | the PWA app (existing Node container, port 3000) |

The "Get your Wingman" buttons already point to `https://app.imyourwingman.ai`.

---

## 1. DNS (at GoDaddy)
Add A records → the droplet IP `168.144.158.202`:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | 168.144.158.202 |
| A | `www` | 168.144.158.202 |
| A | `app` | 168.144.158.202 |

## 2. Caddy (on the droplet)
Point the root domain at the static folder and the app subdomain at the
container. Example `Caddyfile`:

```caddy
imyourwingman.ai, www.imyourwingman.ai {
    encode zstd gzip
    root * /root/wingman/landing
    file_server
}

app.imyourwingman.ai {
    reverse_proxy 127.0.0.1:3000
}
```

- Caddy auto-provisions HTTPS (Let's Encrypt) for all three once DNS resolves.
- **Read access:** Caddy must be able to read `/root/wingman/landing`. If Caddy
  runs as a non-root user (or in its own container), either serve from a public
  path instead (e.g. copy to `/var/www/wingman-landing` after each deploy) or
  give it access. Confirm how Caddy currently runs before finalising.

Reload Caddy after editing: `caddy reload --config /etc/caddy/Caddyfile` (host)
or `docker exec <caddy> caddy reload ...` (container).

## 3. App now lives on the subdomain — update its URLs
Because the app moved to `app.imyourwingman.ai`, update:

- **Google Cloud Console → OAuth client → Authorized redirect URIs:** add
  `https://app.imyourwingman.ai/auth/google/callback`
- **Backend `.env`:**
  `PUBLIC_BASE_URL=https://app.imyourwingman.ai`
  `GOOGLE_REDIRECT_URI=https://app.imyourwingman.ai/auth/google/callback`
- **Meta WhatsApp webhook** (when finalising the Meta cutover): callback URL on
  `app.imyourwingman.ai`.

## 4. Deploy
```bash
cd /root/wingman && git fetch origin && git reset --hard origin/main
# app (only needed if .env / app changed):
docker build -t wingman . && docker rm -f wingman && \
docker run -d --name wingman --restart unless-stopped \
  -p 127.0.0.1:3000:3000 --env-file .env -v /root/wingman-data:/app/data wingman
# landing needs no build — the git pull already updated /root/wingman/landing.
# reload Caddy so the new sites take effect (see §2).
```

## Notes
- To re-compress or update videos later, keep the ~10 MB budget — original
  113 MB is not web-shippable.
- The waitlist form (`Join the waitlist`) posts to `#` (inert, as designed). Wire
  it to a real endpoint when a waitlist backend exists.
