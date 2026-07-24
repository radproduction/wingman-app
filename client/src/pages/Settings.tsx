import { useState, useEffect } from 'react';
import { PageHeader, Loading } from '../components/ui';
import {
  MailIcon, CheckCircleIcon, ClockIcon,
  PlaneIcon, BillIcon, BoxIcon, PeopleIcon, BellIcon,
} from '../components/icons';
import { OptionCards, ToggleRow, Field } from '../components/authUi';
import { HealthSetupGuide } from '../components/HealthSetupGuide';
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
            <CityTags
              cities={user.news_city ?? []}
              onChange={(list) => save({ news_city: list }, { news_city: list })}
            />
          </div>
        </div>

        {/* Connections */}
        <Section title="Connections" />
        <div className="flex flex-col gap-2.5">
          <GoogleAccountsRow user={user} />
          <WebmailRow user={user} />
          <ShopifyRow user={user} />
          <HealthSetupGuide collapsible initialOpen={false} />
          <WorkRow />
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
  const [locating, setLocating] = useState<string | null>(null);

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

  // Fill the field from where the user is right now — one tap instead of typing.
  function useCurrent(which: 'home' | 'office') {
    setError(null); setLocating(which);
    if (!navigator.geolocation) {
      setError('Your browser can’t share location.'); setLocating(null); return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { address } = await api.reverseGeocode(pos.coords.latitude, pos.coords.longitude);
          if (which === 'home') setHome(address); else setOffice(address);
          // Save straight away so it's not lost if they navigate off.
          await save(which, address);
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not read your location.');
        } finally { setLocating(null); }
      },
      () => { setError('Location permission was blocked — type the address instead.'); setLocating(null); },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="card">
      <p className="text-caption text-gray mb-3">
        Used for traffic and “when should I leave?” — so Wingman can tell you when to set off.
      </p>
      <div className="flex flex-col gap-3">
        <div>
          <Field label="Home address" value={home} onChange={setHome} placeholder="e.g. DHA Phase 6, Karachi" />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => save('home', home)}
              disabled={busy === 'home' || !home.trim() || home === user.home_address}
              className="h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
            >
              {busy === 'home' ? 'Saving…' : savedWhich === 'home' ? 'Saved ✓' : 'Save home'}
            </button>
            <button
              onClick={() => useCurrent('home')}
              disabled={locating === 'home' || busy === 'home'}
              className="h-9 px-4 rounded-full bg-white/5 text-gray text-body font-semibold disabled:opacity-40"
            >
              {locating === 'home' ? 'Locating…' : '📍 Use current location'}
            </button>
          </div>
        </div>
        <div>
          <Field label="Office address" value={office} onChange={setOffice} placeholder="e.g. Shahrah-e-Faisal, Karachi" />
          <div className="flex gap-2 mt-2">
            <button
              onClick={() => save('office', office)}
              disabled={busy === 'office' || !office.trim() || office === user.office_address}
              className="h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
            >
              {busy === 'office' ? 'Saving…' : savedWhich === 'office' ? 'Saved ✓' : 'Save office'}
            </button>
            <button
              onClick={() => useCurrent('office')}
              disabled={locating === 'office' || busy === 'office'}
              className="h-9 px-4 rounded-full bg-white/5 text-gray text-body font-semibold disabled:opacity-40"
            >
              {locating === 'office' ? 'Locating…' : '📍 Use current location'}
            </button>
          </div>
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
          <p className="text-caption text-gray">Calendar, Gmail, Drive &amp; Tasks</p>
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
 * Cities for local news, as removable tags.
 *
 * People follow more than one place — where they live, where family is, where
 * they're travelling next — so this is a list rather than a single field.
 */
const MAX_CITIES = 5;

function CityTags({ cities, onChange }: { cities: string[]; onChange: (list: string[]) => void }) {
  const [draft, setDraft] = useState('');

  function add() {
    const name = draft.trim();
    if (!name) return;
    // Case-insensitive: "karachi" and "Karachi" are the same place.
    if (cities.some((c) => c.toLowerCase() === name.toLowerCase())) { setDraft(''); return; }
    if (cities.length >= MAX_CITIES) return;
    onChange([...cities, name]);
    setDraft('');
  }

  return (
    <div>
      <span className="block text-caption text-gray mb-2 px-1">Cities for local news</span>

      {cities.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {cities.map((city) => (
            <span
              key={city}
              className="inline-flex items-center gap-1.5 h-9 pl-3.5 pr-2 rounded-full border border-accent bg-accent/15 text-accent text-body"
            >
              {city}
              <button
                onClick={() => onChange(cities.filter((c) => c !== city))}
                aria-label={`Remove ${city}`}
                className="w-5 h-5 rounded-full hover:bg-accent/20 leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {cities.length < MAX_CITIES ? (
        <div className="flex gap-2">
          <input
            className="flex-1 h-13 min-h-[52px] rounded-2xl bg-white/6 border border-white/10 px-4 text-cardtitle text-white placeholder:text-gray/60 outline-none focus:border-accent focus:bg-white/8 transition-colors"
            value={draft}
            placeholder={cities.length ? 'Add another city' : 'e.g. Karachi'}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          />
          <button
            onClick={add}
            disabled={!draft.trim()}
            className="h-13 min-h-[52px] px-5 rounded-2xl bg-accent text-bg text-body font-semibold disabled:opacity-40"
          >
            Add
          </button>
        </div>
      ) : (
        <p className="text-caption text-gray px-1">
          That's {MAX_CITIES} cities — remove one to add another.
        </p>
      )}

      <p className="text-caption text-gray mt-2 px-1">
        You'll get headlines for each city in your briefing. Keep “Local” selected above.
      </p>
    </div>
  );
}

/**
 * Attendance / HRMS clock. The system posts clock-in and clock-out to a private
 * URL, which is all Wingman needs to notice a forgotten clock-out.
 */
function WorkRow() {
  const [url, setUrl] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'url' | 'code' | 'secret' | null>(null);
  const [busy, setBusy] = useState(false);

  // Outbound side: letting Wingman actually clock them in/out.
  const [actionOpen, setActionOpen] = useState(false);
  const [actionConfigured, setActionConfigured] = useState(false);
  const [actionUrl, setActionUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [employeeRef, setEmployeeRef] = useState('');
  const [note, setNote] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    let alive = true;
    api.workConnect()
      .then((r) => {
        if (!alive) return;
        setUrl(r.webhook_url);
        setConnected(r.connected);
        setActionConfigured(r.action_configured);
        setActionUrl(r.action_url ?? '');
        setEmployeeRef(r.employee_ref ?? '');
      })
      .catch(() => { /* leave unset */ });
    return () => { alive = false; };
  }, []);

  function generateSecret() {
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    setSecret(btoa(String.fromCharCode(...bytes)).replace(/[+/=]/g, '').slice(0, 28));
  }

  async function saveAction() {
    setSaving(true); setNote(null);
    try {
      await api.workSetAction({ url: actionUrl.trim(), secret, employee_ref: employeeRef.trim() || null });
      setActionConfigured(true);
      setSecret('');
      setNote({ kind: 'ok', text: 'Saved. Try the test below to be sure it works.' });
    } catch (e) {
      setNote({ kind: 'err', text: e instanceof Error ? e.message : 'Could not save that.' });
    } finally { setSaving(false); }
  }

  async function testAction(event: 'clock_in' | 'clock_out') {
    setTesting(true); setNote(null);
    try {
      await api.workTestAction(event);
      setNote({ kind: 'ok', text: `Worked — a real ${event === 'clock_in' ? 'clock-in' : 'clock-out'} was sent. Check your attendance system, and undo it there if you weren't meant to be clocked.` });
    } catch (e) {
      setNote({ kind: 'err', text: e instanceof Error ? e.message : 'That did not go through.' });
    } finally { setTesting(false); }
  }

  async function disconnectAction() {
    setSaving(true); setNote(null);
    try {
      await api.workClearAction();
      setActionConfigured(false);
      setActionUrl(''); setSecret(''); setEmployeeRef('');
      setNote({ kind: 'ok', text: 'Disconnected. Wingman can no longer clock you in or out.' });
    } catch { /* ignore */ } finally { setSaving(false); }
  }

  const snippet = `await fetch("${url ?? '<your link>'}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ event: "clock_in" })   // or "clock_out"
});`;

  async function copyText(text: string, which: 'url' | 'code' | 'secret') {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch { /* clipboard blocked — the text is visible anyway */ }
  }

  async function resetLink() {
    setBusy(true);
    try {
      const r = await api.workResetLink();
      setUrl(r.webhook_url);
    } catch { /* ignore */ } finally { setBusy(false); }
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 min-h-[60px]">
        <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">
          <ClockIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-body text-white">Work clock</p>
          <p className="text-caption text-gray">Attendance system — catch a forgotten clock-out</p>
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
            Have your attendance system POST to this private link when you clock in and out:
          </p>
          <div className="rounded-xl bg-white/5 px-3 py-2.5 break-all text-caption text-gray-light">
            {url ?? 'Loading…'}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => url && copyText(url, 'url')}
              disabled={!url}
              className="h-9 px-4 rounded-full bg-accent/15 text-accent text-body font-semibold disabled:opacity-40"
            >
              {copied === 'url' ? 'Copied ✓' : 'Copy link'}
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
            <p className="text-gray-light font-semibold mb-1">If you can edit the attendance app:</p>
            <pre className="rounded-xl bg-white/5 px-3 py-2.5 overflow-x-auto text-caption text-gray-light">
              <code>{snippet}</code>
            </pre>
            <button
              onClick={() => copyText(snippet, 'code')}
              disabled={!url}
              className="mt-2 h-8 px-3 rounded-full bg-white/5 text-gray text-caption font-semibold disabled:opacity-40"
            >
              {copied === 'code' ? 'Copied ✓' : 'Copy code'}
            </button>
            <p className="mt-3">
              Can&apos;t edit it? Zapier or Make can bridge most HR systems to a webhook — or just
              tell Wingman &ldquo;clocked in&rdquo; and it will keep track.
            </p>
          </div>

          <p className="text-caption text-gray">
            Wingman only reminds you once per shift, and never if you say you&apos;re staying late.
            Keep this link private — reset it any time.
          </p>

          {/* ── The other direction: Wingman clocks you in/out on request ── */}
          <div className="mt-2 pt-4 border-t border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-body text-white">Let Wingman clock you in &amp; out</p>
                <p className="text-caption text-gray">So &ldquo;clock out kar do&rdquo; actually does it</p>
              </div>
              {actionConfigured && !actionOpen ? (
                <span className="flex items-center gap-1 text-success text-caption font-medium shrink-0">
                  <CheckCircleIcon className="w-4 h-4" /> On
                </span>
              ) : null}
              <button
                onClick={() => setActionOpen((o) => !o)}
                className="h-9 px-3.5 rounded-full bg-white/5 text-gray text-body font-semibold shrink-0"
              >
                {actionOpen ? 'Close' : actionConfigured ? 'Edit' : 'Set up'}
              </button>
            </div>

            {actionOpen && (
              <div className="mt-4 flex flex-col gap-3">
                <p className="text-caption text-gray">
                  Add an endpoint to your attendance app that clocks you in or out, then put its
                  address here. Wingman sends the secret in an <code>X-Wingman-Secret</code> header —
                  your endpoint should reject anything without it, otherwise anyone who finds the URL
                  could change your hours.
                </p>

                <Field
                  label="Endpoint URL (https)"
                  value={actionUrl}
                  onChange={setActionUrl}
                  placeholder="https://now-hrms.vercel.app/api/wingman/clock"
                />
                <div>
                  <Field
                    label={actionConfigured ? 'Secret (leave blank to keep the current one)' : 'Shared secret'}
                    value={secret}
                    onChange={setSecret}
                    type="password"
                    placeholder="a long random string"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={generateSecret}
                      className="h-8 px-3 rounded-full bg-white/5 text-gray text-caption font-semibold"
                    >
                      Generate one
                    </button>
                    {secret && (
                      <button
                        onClick={() => copyText(secret, 'secret')}
                        className="h-8 px-3 rounded-full bg-accent/15 text-accent text-caption font-semibold"
                      >
                        {copied === 'secret' ? 'Copied ✓' : 'Copy secret'}
                      </button>
                    )}
                  </div>
                  {secret && (
                    <p className="text-caption text-gray mt-2">
                      Copy this into your app as well — it is hidden once saved.
                    </p>
                  )}
                </div>
                <Field
                  label="Employee ID (optional — only if your endpoint needs it)"
                  value={employeeRef}
                  onChange={setEmployeeRef}
                  placeholder="e.g. talha@company.com"
                />

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={saveAction}
                    disabled={saving || !actionUrl.trim() || (!actionConfigured && secret.length < 8)}
                    className="h-9 px-4 rounded-full bg-accent text-bg text-body font-semibold disabled:opacity-40"
                  >
                    {saving ? '…' : 'Save'}
                  </button>
                  {actionConfigured && (
                    <>
                      <button
                        onClick={() => testAction('clock_out')}
                        disabled={testing}
                        className="h-9 px-4 rounded-full bg-white/5 text-gray text-body font-semibold disabled:opacity-40"
                      >
                        {testing ? '…' : 'Send a test clock-out'}
                      </button>
                      <button
                        onClick={disconnectAction}
                        disabled={saving}
                        className="h-9 px-4 rounded-full bg-white/5 text-gray text-body font-semibold disabled:opacity-40"
                      >
                        Disconnect
                      </button>
                    </>
                  )}
                </div>

                {note && (
                  <p className={`text-caption ${note.kind === 'ok' ? 'text-success' : 'text-danger'}`}>
                    {note.text}
                  </p>
                )}
                <p className="text-caption text-gray">
                  The test sends a <b>real</b> clock-out, not a pretend one — there is no safe way to
                  check this without actually calling your system.
                </p>
              </div>
            )}
          </div>
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
