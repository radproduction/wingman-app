# Wingman notetaker bot worker.
# Built on Playwright's image (Chromium + all browser system deps preinstalled),
# plus PulseAudio + ffmpeg for capturing the call audio and Xvfb for a display.
FROM mcr.microsoft.com/playwright:v1.47.0-jammy

RUN apt-get update && apt-get install -y --no-install-recommends \
      pulseaudio pulseaudio-utils ffmpeg xvfb \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev && npx playwright install chromium

COPY . .
RUN chmod +x start.sh && chown -R pwuser:pwuser /app

ENV DISPLAY=:99 \
    PULSE_MONITOR=vsink.monitor

# Run as the non-root user the base image ships, so per-user PulseAudio starts
# cleanly (running Pulse as root is unsupported).
USER pwuser

CMD ["./start.sh"]
