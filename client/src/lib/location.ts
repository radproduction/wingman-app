import { api } from './api';

/**
 * Capture the device's current location (browser geolocation) and send it to
 * the server, so Wingman can answer "route to X" from where the user actually
 * is. A web app / PWA can only read this while it's OPEN — there is no reliable
 * background tracking until a native app — so we refresh it on each app open and
 * treat it as the user's last known position.
 *
 * Silent by design: never blocks the UI, never throws. A denied permission just
 * means the "current location" origin stays whatever it last was.
 */
export function captureLocation(opts: { silent?: boolean } = {}): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          await api.saveLocation(pos.coords.latitude, pos.coords.longitude);
          resolve(true);
        } catch {
          resolve(false);
        }
      },
      () => resolve(false),           // denied or unavailable — stay silent
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
    // The `silent` flag is a hint for callers; the capture itself is always
    // non-blocking here.
    void opts;
  });
}
