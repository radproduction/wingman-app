#!/usr/bin/env bash
#
# Wingman — deploy to the DigitalOcean droplet (wingman-production).
#
# Run this ON THE DROPLET, from anywhere:
#     bash /root/wingman/scripts/deploy.sh
#
# Modes:
#     deploy.sh                 pull + rebuild image + restart container
#     deploy.sh --env-only      restart container only (use when only .env changed)
#     deploy.sh --no-pull       rebuild from the working tree, skip git pull
#     deploy.sh --rollback      restore the previous image and restart
#
# Every mode backs up the SQLite DB first, and a failed health check rolls
# back to the previous image automatically.

set -Eeuo pipefail

# ─── Settings ─────────────────────────────────────────────────────────
REPO=/root/wingman
DATA=/root/wingman-data
BACKUPS=/root/wingman-backups
CONTAINER=wingman
IMAGE=wingman:latest
PREV_IMAGE=wingman:previous
PORT_BIND=127.0.0.1:3000:3000
HEALTH_URL=http://127.0.0.1:3000/health
KEEP_BACKUPS=10
HEALTH_RETRIES=30      # 30 x 3s = 90s for Chromium + schedulers to come up

MODE=deploy
for arg in "$@"; do
  case "$arg" in
    --env-only) MODE=env-only ;;
    --no-pull)  MODE=no-pull ;;
    --rollback) MODE=rollback ;;
    -h|--help)  sed -n '2,20p' "$0"; exit 0 ;;
    *) echo "Unknown option: $arg" >&2; exit 2 ;;
  esac
done

log()  { printf '\n\033[1;36m==> %s\033[0m\n' "$*"; }
ok()   { printf '\033[1;32m    ✓ %s\033[0m\n' "$*"; }
warn() { printf '\033[1;33m    ! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31m✗ %s\033[0m\n' "$*" >&2; exit 1; }

trap 'die "Failed on line $LINENO. Nothing further was changed."' ERR

# ─── Pre-flight ───────────────────────────────────────────────────────
log "Pre-flight"
[ -d "$REPO/.git" ]   || die "$REPO is not a git repo."
[ -f "$REPO/.env" ]   || die "$REPO/.env is missing — the container needs it."
[ -d "$DATA" ]        || die "$DATA is missing — that's the live database volume."
command -v docker >/dev/null || die "docker not found."
cd "$REPO"

# Free disk. A full rebuild needs headroom for a second ~3GB image.
AVAIL_GB=$(df -BG --output=avail / | tail -1 | tr -dc '0-9')
if [ "$MODE" = deploy ] || [ "$MODE" = no-pull ]; then
  [ "$AVAIL_GB" -ge 8 ] || die "Only ${AVAIL_GB}GB free. A rebuild needs ~8GB. Run: docker image prune -f"
fi
ok "${AVAIL_GB}GB disk free"

# This droplet is 1 vCPU / 2GB. The image build installs Chromium and builds
# two Vite apps — without swap it gets OOM-killed partway through.
SWAP_MB=$(free -m | awk '/^Swap:/ {print $2}')
if [ "$MODE" = deploy ] || [ "$MODE" = no-pull ]; then
  if [ "${SWAP_MB:-0}" -lt 1024 ]; then
    warn "Only ${SWAP_MB}MB swap on a 2GB box — the build may be OOM-killed."
    warn "To add 2GB of swap once:"
    warn "  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile"
    warn "  echo '/swapfile none swap sw 0 0' >> /etc/fstab"
  else
    ok "${SWAP_MB}MB swap"
  fi
fi

# ─── Back up the database ─────────────────────────────────────────────
# This is the only copy of every user, conversation, meeting and memory.
log "Backing up the database"
mkdir -p "$BACKUPS"
STAMP=$(date -u +%Y%m%d-%H%M%S)
DB="$DATA/wingman.db"

if [ -f "$DB" ]; then
  DEST="$BACKUPS/wingman-$STAMP.db"
  if command -v sqlite3 >/dev/null; then
    # .backup is safe on a live DB; a plain cp can catch a half-written WAL.
    sqlite3 "$DB" ".backup '$DEST'"
  else
    warn "sqlite3 not installed — falling back to cp (install it: apt install -y sqlite3)"
    cp -a "$DB" "$DEST"
    [ -f "$DB-wal" ] && cp -a "$DB-wal" "$DEST-wal"
    [ -f "$DB-shm" ] && cp -a "$DB-shm" "$DEST-shm"
  fi
  gzip -f "$DEST"
  ok "$(du -h "$DEST.gz" | cut -f1) → $DEST.gz"

  # Keep the most recent N, drop the rest.
  ls -1t "$BACKUPS"/wingman-*.db.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs -r rm -f
else
  warn "No DB at $DB yet — skipping backup."
fi

# ─── Rollback mode exits here ─────────────────────────────────────────
if [ "$MODE" = rollback ]; then
  log "Rolling back to $PREV_IMAGE"
  docker image inspect "$PREV_IMAGE" >/dev/null 2>&1 \
    || die "No $PREV_IMAGE image exists — nothing to roll back to."
  docker tag "$PREV_IMAGE" "$IMAGE"
fi

# ─── Update the code ──────────────────────────────────────────────────
if [ "$MODE" = deploy ]; then
  log "Pulling latest code"
  BEFORE=$(git rev-parse --short HEAD)

  # Refuse to clobber uncommitted work on the droplet.
  if ! git diff --quiet || ! git diff --cached --quiet; then
    die "Uncommitted changes in $REPO. Commit or stash them, then re-run."
  fi

  git fetch --prune origin
  BRANCH=$(git rev-parse --abbrev-ref HEAD)
  git pull --ff-only origin "$BRANCH"

  AFTER=$(git rev-parse --short HEAD)
  if [ "$BEFORE" = "$AFTER" ]; then
    ok "Already up to date at $AFTER"
  else
    ok "$BEFORE → $AFTER"
    git --no-pager log --oneline "$BEFORE..$AFTER" | sed 's/^/      /'
  fi
fi

# ─── Build ────────────────────────────────────────────────────────────
if [ "$MODE" != env-only ] && [ "$MODE" != rollback ]; then
  log "Tagging current image as $PREV_IMAGE"
  if docker image inspect "$IMAGE" >/dev/null 2>&1; then
    docker tag "$IMAGE" "$PREV_IMAGE"
    ok "rollback point saved"
  else
    warn "No existing $IMAGE — first build, no rollback point."
  fi

  log "Building $IMAGE (several minutes on this droplet)"
  docker build -t "$IMAGE" "$REPO"
  ok "built"
fi

# ─── Swap the container ───────────────────────────────────────────────
log "Restarting the container"
OLD_ID=$(docker ps -aq -f name="^${CONTAINER}$" || true)
[ -n "$OLD_ID" ] && docker rm -f "$CONTAINER" >/dev/null && ok "old container removed"

docker run -d \
  --name "$CONTAINER" \
  --restart unless-stopped \
  -p "$PORT_BIND" \
  --env-file "$REPO/.env" \
  -v "$DATA:/app/data" \
  "$IMAGE" >/dev/null
ok "container started"

# ─── Health check ─────────────────────────────────────────────────────
log "Waiting for /health"
trap - ERR   # from here we handle failure ourselves, with a rollback

HEALTHY=0
for i in $(seq 1 $HEALTH_RETRIES); do
  if curl -fsS --max-time 4 "$HEALTH_URL" >/tmp/wingman-health.json 2>/dev/null; then
    HEALTHY=1
    break
  fi
  # If the container died outright, stop waiting.
  if [ -z "$(docker ps -q -f name="^${CONTAINER}$")" ]; then
    warn "Container exited during startup."
    break
  fi
  printf '    …%ds\n' $((i * 3))
  sleep 3
done

if [ "$HEALTHY" = 1 ]; then
  ok "healthy — $(cat /tmp/wingman-health.json)"
  if grep -q '"whatsappReady":false' /tmp/wingman-health.json; then
    warn "WhatsApp is not paired. If this is unexpected, check that"
    warn "WHATSAPP_SESSION_PATH points inside /app/data, then visit /admin/qr."
  fi
  docker image prune -f >/dev/null 2>&1 || true
  log "Deployed ✓   $(git -C "$REPO" rev-parse --short HEAD) is live"
  echo "    Logs:     docker logs -f $CONTAINER"
  echo "    Rollback: bash $REPO/scripts/deploy.sh --rollback"
  exit 0
fi

# ─── Failed → roll back ───────────────────────────────────────────────
printf '\n\033[1;31m✗ Health check failed. Last 40 log lines:\033[0m\n'
docker logs --tail 40 "$CONTAINER" 2>&1 | sed 's/^/    /' || true

if docker image inspect "$PREV_IMAGE" >/dev/null 2>&1 && [ "$MODE" != rollback ]; then
  log "Rolling back to the previous image"
  docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
  docker tag "$PREV_IMAGE" "$IMAGE"
  docker run -d \
    --name "$CONTAINER" \
    --restart unless-stopped \
    -p "$PORT_BIND" \
    --env-file "$REPO/.env" \
    -v "$DATA:/app/data" \
    "$IMAGE" >/dev/null

  sleep 10
  if curl -fsS --max-time 5 "$HEALTH_URL" >/dev/null 2>&1; then
    die "Deploy failed — rolled back to the previous image, which is healthy."
  fi
  die "Deploy failed AND the rollback is not healthy. Check: docker logs $CONTAINER"
fi

die "Deploy failed and there is no image to roll back to. Check: docker logs $CONTAINER"
