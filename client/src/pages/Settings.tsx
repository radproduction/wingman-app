import { useState } from 'react';
import { PageHeader, Loading } from '../components/ui';
import {
  CalendarIcon, MailIcon, HeartIcon, CheckCircleIcon,
  PlaneIcon, BillIcon, BoxIcon, PeopleIcon, BellIcon,
} from '../components/icons';
import { OptionCards, ToggleRow, Field } from '../components/authUi';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type {
  Me, ProactivenessLevel, Skill, Tone, CommunicationStyle, SettingsPatch,
} from '../types';

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

        {/* Connections */}
        <Section title="Connections" />
        <div className="flex flex-col gap-2.5">
          <ConnRow icon={<CalendarIcon className="w-5 h-5" />} label="Google Calendar" connected={user.calendar_connected} href="/auth/google" />
          <ConnRow icon={<MailIcon className="w-5 h-5" />} label="Gmail" connected={user.gmail_connected} href="/auth/google" />
          <ConnRow icon={<HeartIcon className="w-5 h-5" />} label="Health data" connected={user.health_connected} />
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

function ConnRow({ icon, label, connected, href }: { icon: React.ReactNode; label: string; connected: boolean; href?: string }) {
  return (
    <div className="card flex items-center gap-3 min-h-[60px]">
      <div className="w-10 h-10 rounded-xl bg-accent/15 text-accent flex items-center justify-center shrink-0">{icon}</div>
      <span className="text-body text-white flex-1">{label}</span>
      {connected ? (
        <span className="flex items-center gap-1 text-success text-caption font-medium">
          <CheckCircleIcon className="w-4 h-4" /> Connected
        </span>
      ) : href ? (
        <a href={href} className="h-9 px-3.5 rounded-full bg-accent text-bg text-body font-semibold flex items-center">Connect</a>
      ) : (
        <button className="h-9 px-3.5 rounded-full bg-white/10 text-gray text-body font-semibold" disabled>Soon</button>
      )}
    </div>
  );
}
