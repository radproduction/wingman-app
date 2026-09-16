---
description: Ship Wingman to the production droplet, with checks before and after
---

Deploy Wingman to the DigitalOcean droplet (`wingman-production`, 168.144.158.202).

Arguments: $ARGUMENTS
(may be empty, or `env-only`, or `rollback` — pass through to the script)

## Before deploying

Run these locally and **stop if any fails** — report what broke and wait:

1. `git -C . status -sb` — uncommitted changes? Ask before continuing.
2. `git -C . log --oneline origin/main..HEAD` — what is about to ship. Show it.
3. Build both frontends, since the droplet rebuild will fail on a broken build
   and that costs ~10 minutes there:
   - `cd app && npm run build`
   - `cd client && npm run build` (only if `client/` changed)
4. `node -e "require('./src/config.js')"` — config parses.

If anything fails, stop and report. Do not push a broken build to a 2GB droplet.

## Deploy

1. Push: `git push origin main`
2. Tell the user to run this in the droplet console
   (https://cloud.digitalocean.com/droplets/587229590/terminal/ui/?os_user=root):

   ```bash
   bash /root/wingman/scripts/deploy.sh
   ```

   For `env-only` or `rollback`, append `--env-only` / `--rollback`.

3. Ask them to paste the output back.

## After

Read the output and say plainly whether it shipped:

- `Deployed ✓` → confirm the live commit hash matches what was pushed.
- `whatsappReady:false` warning → flag it; WhatsApp needs re-pairing at
  `/admin/qr?key=$ADMIN_PASSWORD`.
- Rolled back → read the 40 log lines in the output, name the actual cause,
  and propose a fix. Do not suggest re-running the same deploy unchanged.

## Notes

- The droplet is **1 vCPU / 2GB**. Image builds are slow and can be OOM-killed.
- The script backs up the SQLite DB to `/root/wingman-backups/` before every run.
- `--env-only` skips the rebuild entirely — use it when only `.env` changed.
- Caddy terminates TLS on 80/443 and proxies to `127.0.0.1:3000`.
- Never commit `.env`, `.env.bak`, `.env.save`, `*.db`, `.wwebjs_auth/`,
  or `bot-worker/google-state.json`.
