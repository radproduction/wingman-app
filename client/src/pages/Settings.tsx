import { useState, useEffect } from 'react';
import { PageHeader, Loading } from '../components/ui';
import {
  MailIcon, HeartIcon, CheckCircleIcon,
  PlaneIcon, BillIcon, BoxIcon, PeopleIcon, BellIcon,
} from '../components/icons';
import { OptionCards, ToggleRow, Field } from '../components/authUi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type {
  Me, ProactivenessLevel, Skill, Tone, CommunicationStyle, SettingsPatch, GoogleAccount, NewsTopic, VoiceReplies, VoiceName,
} from '../types';

const NEWS_TOPICS: { value: NewsTopic; label: string }[] = [
  { value: 'world', label: 'World' },
  { value: 'nation', label: 'National' },
  { value: 'local', label: 'Local' },
  { value: 'business', label: 'Business' },
  { value: 'technology', label: 'Tech' },
  { value: 'entertainment', label: 'Entertainment' },
  { value: 'sports', label: 'Sports' },
  { value: 'science', label: 'Science' },
  { value: 'health', label: 'Health' },
];
const VOICE_CHOICES: { value: VoiceName; label: string }[] = [
  { value: 'onyx', label: 'Male — deep' },
  { value: 'echo', label: 'Male — clear' },
  { value: 'fable', label: 'Male — British' },
  { value: 'ballad', label: 'Male — British, calm' },
  { value: 'nova', label: 'Female — warm' },
  { value: 'shimmer', label: 'Female — soft' },
  { value: 'alloy', label: 'Neutral' },
];

const DEFAULT_NEWS: NewsTopic[] = ['world', 'nation', 'technology', 'local'];

const SKILL_META: { value: Skill; title: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'travel_assistant', title: 'Travel assistant', desc: 'Flight alerts & itineraries', icon: <PlaneIcon className="w-5 h-5" /> },
  { value: 'bill_tracker', title: 'Bill tracker', desc: 'Reminders before bills are due', icon: <BillIcon className="w-5 h-5" /> },
  { value: 'delivery_tracker', title: 'Delivery tracker', desc: 'Package status & returns', icon: <BoxIcon className="w-5 h-5" /> },
  { value: 'people_crm', title: 'People CRM', desc: 'Who you talk to & when', icon: <PeopleIcon className="w-5 h-5" /> },
  { value: 'followup_tracker', title: 'Follow-up tracker', desc: 'Promises you made', icon: <CheckCircleIcon className="w-5 h-5" /> },
];

export default function Settings() {
  const { user, loading, updateUser, signOut } = useAuth();

  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (loading || !user) return <Loading />;

  const skills = user.enabled_skills ?? [];

  async function save(patch: SettingsPatch, optimistic: Partial<Me>) {
    updateUser(optimistic);
    setSaving(true); setErr(null);
    try {
      const { user: updated } = await api.updateSettings(patch);
      updateUser(updated);
      setSavedAt(Date.now());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  const toggleSkill = (s: Skill) => {
    const next = skills.includes(s) ? skills.filter((x) => x !== s) : [...skills, s];
    save({ enabled_skills: next }, { enabled_skills: next });
  };

  return (
    <div className="pb-8">
      <PageHeader
        title="Settings"
        right={
          <span className="text-caption text-gray">
            {saving ? 'Saving…' : savedAt ? 'Saved ✓' : ''}
          </span>
        }
      />
      <div className="px-4">
        {/* Profile */}
        <div className="card flex items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center text-title font-bold">
            {user.name?.charAt(0) ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-cardtitle text-white">{user.name}</p>
            <p className="text-caption text-gray">{user.phone}</p>
            <p className="text-caption text-gray">{user.timezone} · {user.work_hours_start}–{user.work_hours_end}</p>
          </div>
        </div>

        {err && <p className="text-caption text-danger mt-3 px-1">{err}</p>}

        {/* Proactiveness */}
        <Section icon={<BellIcon className="w-4 h-4" />} title="Proactiveness" />
        <OptionCards<ProactivenessLevel>
          value={user.proactiveness_level ?? 'moderate'}
          onChange={(v) => save({ proactiveness_level: v }, { proactiveness_level: v })}
          options={[
            { value: 'low', title: 'Low', desc: 'Only respond when messaged' },
            { value: 'moderate', title: 'Moderate', desc: 'Daily briefing + urgent alerts' },
            { value: 'high', title: 'High', desc: 'The full proactive assistant' },
          ]}
        />

        {/* Schedule */}
        <Section title="Schedule" />
        <div className="flex gap-3">
          <Field label="Morning briefing" type="time" value={user.briefing_time ?? '07:00'}
            onChange={(v) => save({ briefing_time: v }, { briefing_time: v })} />
          <Field label="Evening wrap-up" type="time" value={user.debrief_time ?? '20:00'}
            onChange={(v) => save({ debrief_time: v }, { debrief_time: v })} />
        </div>
        <div className="flex gap-3 mt-3">
          <Field label="Work start" type="time" value={user.work_hours_start}
            onChange={(v) => save({ work_hours_start: v }, { work_hours_start: v })} />
          <Field label="Work end" type="time" value={user.work_hours_end}
            onChange={(v) => save({ work_hours_end: v }, { work_hours_end: v })} />
        </div>

        {/* Skills */}
        <Section title="Skills" />
        <div className="flex flex-col gap-2.5">
          {SKILL_META.map((s) => (
            <ToggleRow
              key={s.value}
              title={s.title}
              desc={s.desc}
              icon={s.icon}
              on={skills.includes(s.value)}
              onToggle={() => toggleSkill(s.value)}
            />
          ))}
        </div>

        {/* Personality */}
        <Section title="Personality — tone" />
        <OptionCards<Tone>
          value={user.tone ?? 'friendly'}
          onChange={(v) => save({ tone: v }, { tone: v })}
          options={[
            { value: 'professional', title: 'Professional', desc: 'Polished and precise' },
            { value: 'casual', title: 'Casual', desc: 'Relaxed and conversational' },
            { value: 'friendly', title: 'Friendly', desc: 'Warm, efficient, a little witty' },
          ]}
        />
        <Section title="Personality — detail" />
        <OptionCards<CommunicationStyle>
          value={user.communication_style ?? 'concise'}
          onChange={(v) => save({ communication_style: v }, { communication_style: v })}
          options={[
            { value: 'concise', title: 'Concise', desc: 'Lead with the answer' },
            { value: 'detailed', title: 'Detailed', desc: 'Full context & next steps' },
          ]}
        />

        {/* Voice */}
        <Section title="Voice replies" />
        <OptionCards<VoiceReplies>
          value={user.voice_replies ?? 'on_voice'}
          onChange={(v) => save({ voice_replies: v }, { voice_replies: v })}
          options={[
            { value: 'off', title: 'Off', desc: 'Text replies only' },
            { value: 'on_voice', title: 'When I send voice', desc: 'Voice note back if you spoke' },
            { value: 'always', title: 'Always', desc: 'Every reply as voice too' },
          ]}
        />
        <p className="text-caption text-gray mt-2 px-1">
          You can send Wingman a voice note any time — it understands English and Roman Urdu.
        </p>

        {(user.voice_replies ?? 'on_voice') !== 'off' && (
          <>
            <Section title="How Wingman sounds" />
            <div className="card">
              <div className="flex flex-wrap gap-2">
                {VOICE_CHOICES.map((v) => {
                  const on = (user.voice_name ?? 'nova') === v.value;
                  return (
                    <button
                      key={v.value}
                      onClick={() => save({ voice_name: v.value }, { voice_name: v.value })}
                      className={`px-3.5 py-2 rounded-full text-body font-medium border transition-colors ${
                        on ? 'bg-accent/15 border-accent text-accent' : 'bg-white/5 border-white/10 text-gray'
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-caption text-gray mt-3">
                Or just say it on WhatsApp — “use a male voice”, “British voice”.
              </p>
            </div>
          </>
        )}

        {/* Places */}
        <Section title="Your places" />
        <PlacesCard user={user} />

        {/* News */}
        <Section title="News in your briefing" />
        <div className="card">
          <p className="text-caption text-gray mb-3">
            Pick what you want headlines about — they arrive with your daily briefing.
          </p>
          <div className="flex flex-wrap gap-2">
            {NEWS_TOPICS.map((t) => {
              const on = (user.news_topics ?? DEFAULT_NEWS).includes(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => {
                    const cur = user.news_topics ?? DEFAULT_NEWS;
                    const next = on ? cur.filter((x) => x !== t.value) : [...cur, t.value];
                    save({ news_topics: next }, { news_topics: next });
                  }}
                  className={`px-3 py-1.5 rounded-full text-body font-medium border transition-colors ${
                    on ? 'bg-accent/15 border-accent text-accent' : 'bg-white/5 border-white/10 text-gray'
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="mt-4">
            <Field
              label="City for local news"
              value={user.news_city ?? ''}
              placeholder="e.g. Karachi"
              onChange={(v) => save({ news_city: v }, { news_city: v })}
            />
          </div>
        </div>

        {/* Connections */}
        <Section title="Connections" />
        <div className="flex flex-col gap-2.5">
          <GoogleAccountsRow user={user} />
          <WebmailRow user={user} />
          <ShopifyRow user={user} />
          <HealthRow />
        </div>

        <div className="mt-6">
          <button
            onClick={() => signOut()}
            className="w-full h-12 rounded-2xl bg-white/6 text-danger text-body font-semibold active:scale-[0.98] transition-transform"
          >
            Sign out
          </button>
        </div>

        <div className="mt-6 text-center">
          <p className="text-caption text-gray">Wingman · your AI chief of staff on WhatsApp</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon }: { title: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mt-6 mb-2.5 px-1">
      {icon && <span className="text-gray">{icon}</span>}
      <h3 className="text-caption uppercase tracking-wide text-gray font-semibold">{title}</h3>
    </div>
  );
}

/**
 * Home and office are geocoded server-side (not just stored as text), because
 * traffic and leave-by times need real coordinates.
 */
function PlacesCard({ user }: { user: Me }) {
  const { updateUser } = useAuth();
  const [home, setHome] = useState(user.home_address ?? '');
  const [office, setOffice] = useState(user.office_address ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedWhich, setSavedWhich] = useState<string | null>(null);

  async function save(which: 'home' | 'office', address: string) {
    if (!address.trim()) return;
    setBusy(which); setError(null); setSavedWhich(null);
    try {
      const r = await api.savePlace(which, address.trim());
      updateUser(which === 'home' ? { home_address: r.address } : { office_address: r.address });
      if (which === 'home') setHome(r.address); else setOffice(r.address);
      setSavedWhich(which);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save that address.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="card">
      <p className="text-caption text-gray mb-3">
        Used for traffic and “when should I leave?” — so Wingman can tell you when to set off.
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <Field label="Home address" value={home} onChange={setHome} placeholder="e.g. DHA Phase 6, Karachi" />
          <button
            onClick={() => save('home', home)}
            disabled={busy === 'home' || !home.trim() || home === user.home_address}
            className="mt-2 h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
          >
            {busy === 'home' ? 'Saving…' : savedWhich === 'home' ? 'Saved ✓' : 'Save home'}
          </button>
        </div>
        <div>
          <Field label="Office address" value={office} onChange={setOffice} placeholder="e.g. Shahrah-e-Faisal, Karachi" />
          <button
            onClick={() => save('office', office)}
            disabled={busy === 'office' || !office.trim() || office === user.office_address}
            className="mt-2 h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
          >
            {busy === 'office' ? 'Saving…' : savedWhich === 'office' ? 'Saved ✓' : 'Save office'}
          </button>
        </div>
      </div>
      {error && <p className="text-caption text-danger mt-3">{error}</p>}
    </div>
  );
}

/**
 * Google supports several linked accounts (personal + work). Each row can be
 * disconnected individually, and one account is marked primary — that's the one
 * used to send mail and create calendar events.
 */
function GoogleAccountsRow({ user }: { user: Me }) {
  const [accounts, setAccounts] = useState<GoogleAccount[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    api.googleAccounts()
      .then((r) => { if (alive) setAccounts(r.accounts); })
      .catch(() => { if (alive) setAccounts([]); });
    return () => { alive = false; };
  }, []);

  const connectHref = `/auth/google?phone=${encodeURIComponent(user.phone)}`;

  async function disconnect(id: string) {
    setBusyId(id); setError(null);
    try {
      const r = await api.googleDisconnect(id);
      setAccounts(r.accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect.');
    } finally { setBusyId(null); }
  }

  async function makePrimary(id: string) {
    setBusyId(id); setError(null);
    try {
      const r = await api.googleSetPrimary(id);
      setAccounts(r.accounts);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update.');
    } finally { setBusyId(null); }
  }

  const list = accounts ?? [];
  const hasAny = list.length > 0;

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <MailIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Google</p>
          <p className="text-caption text-gray">Calendar, Gmail &amp; Drive</p>
        </div>
        {hasAny && (
          <span className="flex items-center gap-1 text-success text-caption font-medium shrink-0">
            <CheckCircleIcon className="w-4 h-4" /> {list.length} linked
          </span>
        )}
      </div>

      {accounts === null ? (
        <p className="text-caption text-gray mt-3">Loading accounts…</p>
      ) : (
        <>
          {hasAny && (
            <div className="mt-3 flex flex-col gap-2">
              {list.map((a) => (
                <div key={a.id} className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-white truncate">{a.email || 'Google account'}</p>
                    {a.is_primary && (
                      <p className="text-caption text-accent">Primary · used to send &amp; create</p>
                    )}
                  </div>
                  {!a.is_primary && (
                    <button
                      onClick={() => makePrimary(a.id)}
                      disabled={busyId === a.id}
                      className="text-caption text-accent font-medium shrink-0 disabled:opacity-50"
                    >
                      Make primary
                    </button>
                  )}
                  <button
                    onClick={() => disconnect(a.id)}
                    disabled={busyId === a.id}
                    className="text-caption text-danger font-medium shrink-0 disabled:opacity-50"
                  >
                    {busyId === a.id ? '…' : 'Disconnect'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-caption text-danger mt-2">{error}</p>}

          <a
            href={connectHref}
            className={`mt-3 h-11 rounded-xl flex items-center justify-center text-body font-semibold ${
              hasAny ? 'bg-white/5 text-accent' : 'brand-gradient text-[#fff]'
            }`}
          >
            {hasAny ? '+ Add another account' : 'Connect Google'}
          </a>
        </>
      )}
    </div>
  );
}

/**
 * Apple Health and Google Health Connect are on-device APIs with no server to
 * call, so instead of an OAuth button each user gets a private URL that a phone
 * automation (iOS Shortcuts, or any wearable app) posts readings to.
 */
function HealthRow() {
  const [url, setUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    api.healthConnect()
      .then((r) => { if (alive) { setUrl(r.ingest_url); setConnected(r.connected); } })
      .catch(() => { /* leave unset */ });
    return () => { alive = false; };
  }, []);

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

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <HeartIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Health data</p>
          <p className="text-caption text-gray">Apple Health, wearables, sleep &amp; heart rate</p>
        </div>
        {connected ? (
          <span className="flex items-center gap-1 text-success text-caption font-medium shrink-0">
            <CheckCircleIcon className="w-4 h-4" /> Receiving
          </span>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 px-3.5 rounded-full bg-accent text-bg text-body font-semibold shrink-0"
          >
            {open ? 'Close' : 'Set up'}
          </button>
        )}
      </div>

      {(open || connected) && (
        <div className="mt-4 flex flex-col gap-3">
          <p className="text-caption text-gray">
            Apple Health keeps your data on your phone — no website can read it directly.
            So your phone sends it here instead, using this private link:
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
            <p className="text-gray-light font-semibold mb-1">On iPhone (5 minutes, no app needed):</p>
            <p>1. Open <b>Shortcuts</b> → <b>Automation</b> → <b>New</b> → <b>Time of Day</b> (e.g. every morning)</p>
            <p>2. Add action <b>“Find Health Samples”</b> — pick Sleep, Resting Heart Rate, Steps</p>
            <p>3. Add action <b>“Get Contents of URL”</b> → paste the link → Method <b>POST</b>, Request Body <b>JSON</b></p>
            <p>4. Send fields named <code>metric</code> and <code>value</code> — e.g. metric “sleep”, value from the health sample</p>
            <p className="mt-2">Any fitness app or automation that can POST JSON works too.</p>
          </div>

          <p className="text-caption text-gray">
            Keep this link private — anyone with it could add readings to your account. Reset it any time.
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Business email over IMAP/SMTP — the address customers actually write to.
 * Server settings are auto-detected from the address; the credentials are
 * verified against the real mail servers before anything is stored.
 */
function WebmailRow({ user }: { user: Me }) {
  const { updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [advanced, setAdvanced] = useState(false);
  const [imapHost, setImapHost] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill the server settings as soon as we have a full address.
  useEffect(() => {
    if (!address.includes('@') || !address.split('@')[1]) return;
    let alive = true;
    api.webmailDetect(address)
      .then((d) => {
        if (!alive) return;
        setImapHost(d.imapHost); setSmtpHost(d.smtpHost); setNote(d.note);
      })
      .catch(() => { /* user can fill it in manually */ });
    return () => { alive = false; };
  }, [address]);

  async function connect() {
    setBusy(true); setError(null);
    try {
      const r = await api.webmailConnect({
        address: address.trim(),
        password,
        imap_host: imapHost.trim() || undefined,
        smtp_host: smtpHost.trim() || undefined,
      });
      updateUser({ webmail_connected: true, webmail_address: r.address });
      setOpen(false); setAddress(''); setPassword('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect that mailbox.');
    } finally { setBusy(false); }
  }

  async function disconnect() {
    setBusy(true); setError(null);
    try {
      await api.webmailDisconnect();
      updateUser({ webmail_connected: false, webmail_address: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect.');
    } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <MailIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Business email</p>
          <p className="text-caption text-gray truncate">
            {user.webmail_connected && user.webmail_address ? user.webmail_address : 'Your company address (IMAP/SMTP)'}
          </p>
        </div>
        {user.webmail_connected ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-success text-caption font-medium">
              <CheckCircleIcon className="w-4 h-4" /> Connected
            </span>
            <button onClick={disconnect} disabled={busy} className="text-caption text-danger underline disabled:opacity-50">
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 px-3.5 rounded-full bg-accent text-bg text-body font-semibold shrink-0"
          >
            {open ? 'Cancel' : 'Connect'}
          </button>
        )}
      </div>

      {open && !user.webmail_connected && (
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Email address" value={address} onChange={setAddress} placeholder="info@yourcompany.com" />
          <Field label="Password" value={password} onChange={setPassword} type="password" placeholder="mailbox password" />

          {note && <p className="text-caption text-warning">{note}</p>}
          <p className="text-caption text-gray">
            If your provider uses 2-factor login, create an <b>app password</b> and use that instead of your main one.
            Your password is encrypted before it’s stored, and we check it works before saving.
          </p>

          <button onClick={() => setAdvanced((a) => !a)} className="text-caption text-gray underline self-start">
            {advanced ? 'Hide server settings' : `Server settings${imapHost ? ` (auto: ${imapHost})` : ''}`}
          </button>
          {advanced && (
            <div className="flex flex-col gap-3">
              <Field label="IMAP host" value={imapHost} onChange={setImapHost} placeholder="mail.yourcompany.com" />
              <Field label="SMTP host" value={smtpHost} onChange={setSmtpHost} placeholder="mail.yourcompany.com" />
            </div>
          )}

          {error && <p className="text-caption text-danger">{error}</p>}
          <button
            onClick={connect}
            disabled={busy || !address.trim() || !password}
            className="h-11 rounded-xl brand-gradient text-[#fff] text-body font-semibold disabled:opacity-40"
          >
            {busy ? 'Checking mailbox…' : 'Connect mailbox'}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Shopify connects with a store domain + Admin API token (Shopify "custom app"),
 * so unlike Google it needs an inline form rather than an OAuth redirect.
 */
function ShopifyRow({ user }: { user: Me }) {
  const { updateUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [manual, setManual] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setBusy(true); setError(null);
    try {
      const r = await api.shopifyConnect(domain, token);
      updateUser({ shopify_connected: true, shopify_domain: r.domain });
      setOpen(false); setDomain(''); setToken('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not connect.');
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true); setError(null);
    try {
      await api.shopifyDisconnect();
      updateUser({ shopify_connected: false, shopify_domain: null });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not disconnect.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <BoxIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Shopify</p>
          {user.shopify_connected && user.shopify_domain && (
            <p className="text-caption text-gray truncate">{user.shopify_domain}</p>
          )}
        </div>
        {user.shopify_connected ? (
          <div className="flex items-center gap-3 shrink-0">
            <span className="flex items-center gap-1 text-success text-caption font-medium">
              <CheckCircleIcon className="w-4 h-4" /> Connected
            </span>
            <button onClick={disconnect} disabled={busy} className="text-caption text-gray underline disabled:opacity-50">
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={() => setOpen((o) => !o)}
            className="h-9 px-3.5 rounded-full bg-accent text-bg text-body font-semibold shrink-0"
          >
            {open ? 'Cancel' : 'Connect'}
          </button>
        )}
      </div>

      {open && !user.shopify_connected && (
        <div className="mt-4 flex flex-col gap-3">
          <Field label="Store domain" value={domain} onChange={setDomain} placeholder="mystore.myshopify.com" />
          <p className="text-caption text-gray">
            You’ll be sent to Shopify to approve access — no tokens to copy.
          </p>
          {error && <p className="text-caption text-danger">{error}</p>}
          <a
            href={`/auth/shopify?shop=${encodeURIComponent(domain.trim())}&phone=${encodeURIComponent(user.phone)}`}
            onClick={(e) => { if (!domain.trim()) e.preventDefault(); }}
            className={`h-11 rounded-xl brand-gradient text-[#fff] text-body font-semibold flex items-center justify-center ${
              domain.trim() ? '' : 'opacity-40 pointer-events-none'
            }`}
          >
            Connect with Shopify
          </a>

          {/* Fallback for stores still on a legacy custom app, which do hand out a token. */}
          <button
            onClick={() => setManual((m) => !m)}
            className="text-caption text-gray underline self-start"
          >
            {manual ? 'Hide' : 'I have an Admin API token instead'}
          </button>
          {manual && (
            <>
              <Field label="Admin API access token" value={token} onChange={setToken} placeholder="shpat_..." />
              <button
                onClick={connect}
                disabled={busy || !domain.trim() || !token.trim()}
                className="h-11 rounded-xl bg-white/5 text-accent text-body font-semibold disabled:opacity-40"
              >
                {busy ? 'Connecting…' : 'Connect with token'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

