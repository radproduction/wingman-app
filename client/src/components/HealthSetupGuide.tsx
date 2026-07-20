import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { CheckCircleIcon, HeartIcon } from './icons';

type Platform = 'iphone' | 'android';

const PLATFORM_COPY: Record<Platform, { badge: string; title: string; steps: string[]; note: string }> = {
  iphone: {
    badge: 'Best for iPhone',
    title: 'Apple Health on iPhone',
    steps: [
      'Open Shortcuts on your iPhone.',
      'Tap Automation, then create a new daily automation.',
      'Add your Health actions for Sleep, Steps, and Resting Heart Rate.',
      'Add Get Contents of URL at the end and paste your private Wingman link below.',
      'Save it once. After that, your phone can send fresh health updates automatically.',
    ],
    note: 'No separate app is needed on iPhone. Apple Health stays on the phone, so Shortcuts is the bridge.',
  },
  android: {
    badge: 'Best for Android',
    title: 'Google Health / Health Connect on Android',
    steps: [
      'Open Google Health on your phone and make sure your watch or fitness app is syncing there.',
      'Open Health Connect too. On Android 14 or newer it is in Settings. On older Android phones, install Health Connect from Google Play.',
      'Use your phone automation app to send Sleep, Steps, and Resting Heart Rate to the private Wingman link below.',
      'Once that is saved, Wingman can keep receiving daily health updates automatically.',
    ],
    note: 'If you use Pixel Watch or Fitbit-style tracking, Google Health usually receives the data first, then Wingman can pick it up through your private link.',
  },
};

export function HealthSetupGuide({
  collapsible = false,
  initialOpen = true,
}: {
  collapsible?: boolean;
  initialOpen?: boolean;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [open, setOpen] = useState(initialOpen);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState<Platform>('iphone');

  useEffect(() => {
    let alive = true;
    api.healthConnect()
      .then((r) => {
        if (!alive) return;
        setUrl(r.ingest_url);
        setConnected(r.connected);
      })
      .catch(() => { /* leave unset */ });
    return () => { alive = false; };
  }, []);

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* ignore */ }
  }

  async function resetLink() {
    setBusy(true);
    try {
      const r = await api.healthResetLink();
      setUrl(r.ingest_url);
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  const copyBlock = PLATFORM_COPY[platform];
  const showBody = !collapsible || open || connected;

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <HeartIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Health data</p>
          <p className="text-caption text-gray">iPhone: Apple Health. Android: Google Health / Health Connect.</p>
        </div>
        {connected ? (
          <span className="flex items-center gap-1 text-success text-caption font-medium shrink-0">
            <CheckCircleIcon className="w-4 h-4" /> Receiving
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
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-caption text-gray">
            Pick your phone below, copy your private link once, and let your phone send health updates to Wingman automatically.
          </p>

          <div className="rounded-2xl bg-white/5 p-1 flex gap-1">
            {(['iphone', 'android'] as Platform[]).map((key) => (
              <button
                key={key}
                onClick={() => setPlatform(key)}
                className={`flex-1 h-10 rounded-xl text-body font-semibold transition ${
                  platform === key ? 'bg-accent text-bg' : 'text-gray-light'
                }`}
              >
                {key === 'iphone' ? 'iPhone' : 'Android'}
              </button>
            ))}
          </div>

          <div className="rounded-2xl bg-white/5 border border-white/8 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-caption text-accent font-semibold">{copyBlock.badge}</p>
                <p className="text-body text-white mt-0.5">{copyBlock.title}</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {copyBlock.steps.map((step, idx) => (
                <p key={idx} className="text-caption text-gray-light">{idx + 1}. {step}</p>
              ))}
            </div>
            <p className="text-caption text-gray mt-3">{copyBlock.note}</p>
          </div>

          <div className="rounded-xl bg-white/5 px-3 py-2.5 break-all text-caption text-gray-light">
            {url ?? 'Loading...'}
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
              {busy ? '...' : 'Reset link'}
            </button>
          </div>

          <p className="text-caption text-gray">
            Keep this link private. If you ever share it by mistake, tap Reset link and the old one stops working.
          </p>
        </div>
      )}
    </div>
  );
}
