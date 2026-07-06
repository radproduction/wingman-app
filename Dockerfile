# Wingman — proactive AI assistant on WhatsApp
# Single container: Express API + built dashboard + whatsapp-web.js (Puppeteer/Chromium)

FROM node:20-slim

# ── System deps for Chromium (whatsapp-web.js uses Puppeteer) ──────────
# We install the distro Chromium and point Puppeteer at it, so we do NOT
# download a second copy at npm install time.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates fonts-liberation fonts-noto-color-emoji \
      libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
      libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 \
      libgbm1 libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 \
      libatspi2.0-0 libgtk-3-0 wget dumb-init \
      python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# ── Install backend deps first (better layer caching) ─────────────────
COPY package*.json ./
RUN npm install --omit=dev

# ── Build the dashboard (client) ──────────────────────────────────────
COPY client/package*.json ./client/
RUN cd client && npm install
COPY client ./client
RUN cd client && npm run build

# ── App source ────────────────────────────────────────────────────────
COPY . .

# Persistent data (SQLite DB) + WhatsApp session live under /app/data and
# /app/.wwebjs_auth — mount a Railway volume at /app/data to persist the DB.
RUN mkdir -p /app/data /app/.wwebjs_auth

EXPOSE 3000

# dumb-init reaps zombie Chromium processes cleanly
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
