import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CheckCircleIcon, HeartIcon } from './icons';

/**
 * Two honest paths, not two equal ones.
 *
 * Google Health is a real one-click connection — Android, Pixel Watch, Fitbit,
 * Wear OS and anything else that syncs to Google. Apple keeps HealthKit on the
 * phone with no cloud API, so an iPhone with only Apple Health has to push its
 * own data to a private link. Presenting both as "pick your phone" would imply
 * a parity that doesn't exist, so the easy path leads and the manual one is
 * offered underneath for the case that genuinely needs it.
 */
export function HealthSetupGuide({
  collapsible = false,
  initialOpen = true,
}: {
  collapsible?: boolean;
  initialOpen?: boolean;
}) {
  const [open, setOpen] = useState(initialOpen);

  // Google Health (one-click)
  const [googleConnected, setGoogleConnected] = useState(false);
  const [connectUrl, setConnectUrl] = useState<string | null>(null);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  // Private link (Apple Health fallback)
  const [url, setUrl] = useState<string | null>(null);
  const [receiving, setReceiving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showApple, setShowApple] = useState(false);

  useEffect(() => {
    let alive = true;
    api.healthGoogle()
      .then((r) => {
        if (!alive) return;
        setGoogleConnected(r.connected);
        setConnectUrl(r.connect_url);
        setLastSynced(r.last_synced_at);
      })
      .catch(() => { /* leave unset */ });
    api.healthConnect()
      .then((r) => {
        if (!alive) return;
        setUrl(r.ingest_url);
        setReceiving(r.connected);
      })
      .catch(() => { /* leave unset */ });
    return () => { alive = false; };
  }, []);

  async function syncNow() {
    setSyncing(true); setSyncNote(null);
    try {
      const r = await api.healthGoogleSync();
      setSyncNote(r.saved
        ? `Pulled in ${r.saved} new reading${r.saved === 1 ? '' : 's'}.`
        : 'Up to date — nothing new since the last sync.');
      setLastSynced(new Date().toISOString());
    } catch (e) {
      setSyncNote(e instanceof Error ? e.message : 'Could not sync just now.');
    } finally { setSyncing(false); }
  }

  async function disconnectGoogle() {
    setBusy(true);
    try {
      await api.healthGoogleDisconnect();
      setGoogleConnected(false);
      setSyncNote(null);
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the URL is visible anyway */ }
  }

  async function resetLink() {
    setBusy(true);
    try {
      const r = await api.healthResetLink();
      setUrl(r.ingest_url);
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  const connected = googleConnected || receiving;
  const showBody = !collapsible || open || connected;

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <HeartIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Health data</p>
          <p className="text-caption text-gray">Sleep, heart rate and steps</p>
        </div>
        {connected ? (
          <span className="flex items-center gap-1 text-success text-caption font-medium shrink-0">
            <CheckCircleIcon className="w-4 h-4" /> Connected
          </span>
        ) : collapsible ? (
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 px-3.5 rounded-full bg-accent text-bg text-body font-semibold shrink-0"
          >
            {open ? 'Close' : 'Set up'}
          </button>
        ) : null}
      </div>

      {showBody && (
        <div className="mt-4 flex flex-col gap-4">
          {/* ── The easy path ── */}
          <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
            <p className="text-body text-white">Connect Google Health</p>
            <p className="text-caption text-gray mt-1">
              Android, Pixel Watch, Fitbit, Wear OS — and any app that syncs to Google.
              One tap, then it keeps itself up to date.
            </p>

            {googleConnected ? (
              <>
                <p className="flex items-center gap-1 text-success text-caption font-medium mt-3">
                  <CheckCircleIcon className="w-4 h-4" />
                  Connected{lastSynced ? ` · last synced ${new Date(lastSynced).toLocaleString()}` : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <button
                    onClick={syncNow}
                    disabled={syncing}
                    className="h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
                  >
                    {syncing ? 'Syncing…' : 'Sync now'}
                  </button>
                  <button
                    onClick={disconnectGoogle}
                    disabled={busy}
                    className="h-9 px-4 rounded-full bg-white/5 text-gray text-body font-semibold disabled:opacity-40"
                  >
                    Disconnect
                  </button>
                </div>
                {syncNote && <p className="text-caption text-gray mt-2">{syncNote}</p>}
              </>
            ) : (
              <a
                href={connectUrl ?? '#'}
                className={`inline-flex items-center justify-center h-10 px-5 mt-3 rounded-full bg-accent text-bg text-body font-semibold ${
                  connectUrl ? '' : 'pointer-events-none opacity-40'
                }`}
              >
                Connect Google Health
              </a>
            )}
          </div>

          {/* ── The honest fallback ── */}
          <div>
            <button
              onClick={() => setShowApple((s) => !s)}
              className="text-caption text-accent font-semibold"
            >
              {showApple ? '− ' : '+ '}Using an iPhone with Apple Health?
            </button>

            {showApple && (
              <div className="mt-3 flex flex-col gap-3">
                <p className="text-caption text-gray">
                  Apple keeps Health data on your phone — there is no Apple service a website
                  can read it from, so your phone has to send it. This link is where it sends it:
                </p>

                <div className="rounded-xl bg-white/5 px-3 py-2.5 break-all text-caption text-gray-light">
                  {url ?? 'Loading…'}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    disabled={!url}
                    className="h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
                  >
                    {copied ? 'Copied ✓' : 'Copy link'}
                  </button>
                  <button
                    onClick={resetLink}
                    disabled={busy}
                    className="h-9 px-4 rounded-full bg-white/5 text-gray text-body font-semibold disabled:opacity-40"
                  >
                    {busy ? '…' : 'Reset link'}
                  </button>
                </div>

                <div className="text-caption text-gray">
                  <p className="text-gray-light font-semibold mb-1">On iPhone, once (about 3 minutes):</p>
                  <p>1. Open <b>Shortcuts</b> → <b>Automation</b> → <b>New</b> → <b>Time of Day</b>, every morning</p>
                  <p>2. Add <b>“Find Health Samples”</b> — Sleep, Resting Heart Rate, Steps</p>
                  <p>3. Add <b>“Get Contents of URL”</b> → paste the link → Method <b>POST</b>, Body <b>JSON</b></p>
                  <p>4. Send fields named <code>metric</code> and <code>value</code></p>
                  <p className="mt-2">
                    If you wear a Fitbit or Pixel Watch, use <b>Connect Google Health</b> above instead — it needs none of this.
                  </p>
                </div>

                <p className="text-caption text-gray">
                  Keep this link private. If it ever leaks, tap Reset link and the old one stops working.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
