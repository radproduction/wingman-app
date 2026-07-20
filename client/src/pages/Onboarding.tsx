import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AuthShell, BigButton, Field, OptionCards, ToggleRow, StepProgress } from '../components/authUi';
import {
  PlaneIcon, BillIcon, BoxIcon, PeopleIcon, CheckCircleIcon, BellIcon,
} from '../components/icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import type { ProactivenessLevel, Skill, Tone, CommunicationStyle, NewsTopic } from '../types';

const TZ_OPTIONS = [
  'Asia/Dubai', 'Asia/Karachi', 'Asia/Riyadh', 'Asia/Kolkata',
  'Europe/London', 'America/New_York', 'America/Los_Angeles', 'Asia/Singapore',
];

const SKILL_META: { value: Skill; title: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'travel_assistant', title: 'Travel assistant', desc: 'Flight alerts, itineraries, arrival briefings', icon: <PlaneIcon className="w-5 h-5" /> },
  { value: 'bill_tracker', title: 'Bill tracker', desc: 'Reminders before bills are due', icon: <BillIcon className="w-5 h-5" /> },
  { value: 'delivery_tracker', title: 'Delivery tracker', desc: 'Package status & return windows', icon: <BoxIcon className="w-5 h-5" /> },
  { value: 'people_crm', title: 'People CRM', desc: 'Remember who you talk to & when', icon: <PeopleIcon className="w-5 h-5" /> },
  { value: 'followup_tracker', title: 'Follow-up tracker', desc: 'Never drop a promise you made', icon: <CheckCircleIcon className="w-5 h-5" /> },
];

const ALL_SKILLS: Skill[] = SKILL_META.map((s) => s.value);

interface Draft {
  name: string;
  timezone: string;
  work_hours_start: string;
  work_hours_end: string;
  briefing_time: string;
  debrief_time: string;
  proactiveness_level: ProactivenessLevel;
  enabled_skills: Skill[];
  tone: Tone;
  communication_style: CommunicationStyle;
  news_topics: NewsTopic[];
  news_city: string;
}

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

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, signOut, updateUser } = useAuth();

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [d, setD] = useState<Draft>({
    name: user?.name ?? '',
    timezone: user?.timezone ?? 'Asia/Dubai',
    work_hours_start: user?.work_hours_start ?? '09:00',
    work_hours_end: user?.work_hours_end ?? '18:00',
    briefing_time: user?.briefing_time ?? '07:00',
    debrief_time: user?.debrief_time ?? '20:00',
    proactiveness_level: user?.proactiveness_level ?? 'moderate',
    enabled_skills: user?.enabled_skills ?? ALL_SKILLS,
    tone: user?.tone ?? 'friendly',
    communication_style: user?.communication_style ?? 'concise',
    news_topics: user?.news_topics ?? ['world', 'nation', 'technology', 'local'],
    // Onboarding asks for one city to keep signup short; more can be added in
    // Settings, which is why this is stored as a list.
    news_city: user?.news_city?.[0] ?? '',
  });
  const set = (patch: Partial<Draft>) => setD((prev) => ({ ...prev, ...patch }));
  const toggleSkill = (s: Skill) =>
    set({ enabled_skills: d.enabled_skills.includes(s) ? d.enabled_skills.filter((x) => x !== s) : [...d.enabled_skills, s] });

  const TOTAL = 11;

  const canNext = useMemo(() => {
    switch (step) {
      case 3: return d.name.trim().length > 0;       // name
      case 4: return !!d.timezone;                    // timezone
      default: return true;
    }
  }, [step, d]);

  function next() {
    if (step < TOTAL - 1) { setDir(1); setStep((s) => s + 1); }
  }
  function back() {
    if (step > 0) { setDir(-1); setStep((s) => s - 1); }
  }

  async function finish() {
    setBusy(true); setErr(null);
    try {
      const { user: updated } = await api.completeOnboarding({
        name: d.name.trim(),
        timezone: d.timezone,
        work_hours_start: d.work_hours_start,
        work_hours_end: d.work_hours_end,
        briefing_time: d.briefing_time,
        debrief_time: d.debrief_time,
        proactiveness_level: d.proactiveness_level,
        enabled_skills: d.enabled_skills,
        tone: d.tone,
        communication_style: d.communication_style,
        news_topics: d.news_topics,
        news_city: d.news_city.trim() ? [d.news_city.trim()] : undefined,
      });
      updateUser(updated);
      navigate('/', { replace: true });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not finish setup');
      setBusy(false);
    }
  }

  const variants = {
    enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -40 : 40 }),
  };

  return (
    <AuthShell>
      {/* Top bar: progress + back */}
      <div className="pt-5 pb-3">
        <div className="flex items-center gap-3 mb-3 min-h-[24px]">
          {step > 0 && step < TOTAL - 1 && (
            <button onClick={back} className="text-caption text-gray">← Back</button>
          )}
          <span className="ml-auto text-caption text-gray">{step + 1} / {TOTAL}</span>
        </div>
        <StepProgress step={step} total={TOTAL} />
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-0 flex flex-col pt-4"
          >
            {/* ── Step 0: Welcome ── */}
            {step === 0 && (
              <StepBody
                emoji="🪽"
                title="Meet Wingman"
                subtitle="Your proactive AI chief of staff. I live on WhatsApp and reach out first — morning briefings, urgent email alerts, bills, deliveries, and travel. Let’s set you up in a minute."
              />
            )}

            {/* ── Step 1: What I do ── */}
            {step === 1 && (
              <StepBody
                emoji="⚡"
                title="I work in the background"
                subtitle="I watch your calendar, inbox, bills and trips, then message you when something actually needs you. No noise — just the things that matter."
              />
            )}

            {/* ── Step 2: Notifications context ── */}
            {step === 2 && (
              <StepBody
                emoji="💬"
                title="I message you on WhatsApp"
                subtitle="Wingman runs on its own number. Once you finish setup, I’ll start reaching out based on the preferences you choose next."
              />
            )}

            {/* ── Step 3: Name ── */}
            {step === 3 && (
              <StepForm title="What should I call you?" subtitle="I’ll use your first name in every message.">
                <Field value={d.name} onChange={(v) => set({ name: v })} placeholder="e.g. Aamir" autoFocus />
              </StepForm>
            )}

            {/* ── Step 4: Timezone ── */}
            {step === 4 && (
              <StepForm title="What’s your timezone?" subtitle="So briefings and reminders land at the right local time.">
                <OptionCards
                  value={d.timezone}
                  onChange={(v) => set({ timezone: v })}
                  options={TZ_OPTIONS.map((tz) => ({ value: tz, title: tz.replace('_', ' ') }))}
                />
              </StepForm>
            )}

            {/* ── Step 5: Work hours ── */}
            {step === 5 && (
              <StepForm title="When’s your workday?" subtitle="I’ll avoid bugging you outside these hours where I can.">
                <div className="flex gap-3">
                  <Field label="Start" value={d.work_hours_start} onChange={(v) => set({ work_hours_start: v })} type="time" />
                  <Field label="End" value={d.work_hours_end} onChange={(v) => set({ work_hours_end: v })} type="time" />
                </div>
                <div className="mt-4 flex gap-3">
                  <Field label="Morning briefing" value={d.briefing_time} onChange={(v) => set({ briefing_time: v })} type="time" />
                  <Field label="Evening wrap-up" value={d.debrief_time} onChange={(v) => set({ debrief_time: v })} type="time" />
                </div>
              </StepForm>
            )}

            {/* ── Step 6: Proactiveness ── */}
            {step === 6 && (
              <StepForm title="How proactive should I be?" subtitle="You can change this anytime in Settings." icon={<BellIcon className="w-6 h-6" />}>
                <OptionCards<ProactivenessLevel>
                  value={d.proactiveness_level}
                  onChange={(v) => set({ proactiveness_level: v })}
                  options={[
                    { value: 'low', title: 'Low', desc: 'Only respond when you message me' },
                    { value: 'moderate', title: 'Moderate', desc: 'Daily briefing + urgent alerts' },
                    { value: 'high', title: 'High', desc: 'Everything — the full assistant' },
                  ]}
                />
              </StepForm>
            )}

            {/* ── Step 7: Skills ── */}
            {step === 7 && (
              <StepForm title="Pick your skills" subtitle="Turn on what’s useful. Toggle any of these later.">
                <div className="flex flex-col gap-2.5">
                  {SKILL_META.map((s) => (
                    <ToggleRow
                      key={s.value}
                      title={s.title}
                      desc={s.desc}
                      icon={s.icon}
                      on={d.enabled_skills.includes(s.value)}
                      onToggle={() => toggleSkill(s.value)}
                    />
                  ))}
                </div>
              </StepForm>
            )}

            {/* ── Step 8: Personality ── */}
            {step === 8 && (
              <StepForm title="How should I sound?" subtitle="Pick a tone and how much detail you like.">
                <p className="text-caption text-gray mb-2 px-1">Tone</p>
                <OptionCards<Tone>
                  value={d.tone}
                  onChange={(v) => set({ tone: v })}
                  options={[
                    { value: 'professional', title: 'Professional', desc: 'Polished and precise' },
                    { value: 'casual', title: 'Casual', desc: 'Relaxed and conversational' },
                    { value: 'friendly', title: 'Friendly', desc: 'Warm, efficient, a little witty' },
                  ]}
                />
                <p className="text-caption text-gray mt-5 mb-2 px-1">Detail</p>
                <OptionCards<CommunicationStyle>
                  value={d.communication_style}
                  onChange={(v) => set({ communication_style: v })}
                  options={[
                    { value: 'concise', title: 'Concise', desc: 'Lead with the answer' },
                    { value: 'detailed', title: 'Detailed', desc: 'Full context & next steps' },
                  ]}
                />
              </StepForm>
            )}

            {/* ── Step 9: Done ── */}
            {step === 9 && (
              <StepForm title="What news do you want?" subtitle="Headlines land with your daily briefing. Pick as many as you like.">
                <div className="flex flex-wrap gap-2">
                  {NEWS_TOPICS.map((t) => {
                    const on = d.news_topics.includes(t.value);
                    return (
                      <button
                        key={t.value}
                        onClick={() =>
                          set({
                            news_topics: on
                              ? d.news_topics.filter((x) => x !== t.value)
                              : [...d.news_topics, t.value],
                          })
                        }
                        className={`px-3.5 py-2 rounded-full text-body font-medium border transition-colors ${
                          on ? 'bg-accent/15 border-accent text-accent' : 'bg-white/5 border-white/10 text-gray'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-5">
                  <Field
                    label="Your city (for local news & nearby alerts)"
                    value={d.news_city}
                    placeholder="e.g. Karachi"
                    onChange={(v) => set({ news_city: v })}
                  />
                </div>
              </StepForm>
            )}
            {step === 10 && (
              <StepBody
                emoji="✅"
                title={`You’re all set${d.name ? `, ${d.name.split(/\s+/)[0]}` : ''}!`}
                subtitle="I’ll start keeping an eye on your day. Connect Google Calendar & Gmail in Settings to unlock the full picture."
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="pb-6 pt-3">
        {err && <p className="text-caption text-danger mb-3 px-1">{err}</p>}
        {step < TOTAL - 1 ? (
          <BigButton onClick={next} disabled={!canNext}>
            {step === 0 ? 'Get started' : 'Continue'}
          </BigButton>
        ) : (
          <BigButton onClick={finish} disabled={busy}>
            {busy ? 'Finishing…' : 'Enter Wingman'}
          </BigButton>
        )}
        {step === 0 && (
          <button onClick={() => { signOut(); navigate('/login', { replace: true }); }} className="w-full text-caption text-gray mt-4">
            Sign out
          </button>
        )}
      </div>
    </AuthShell>
  );
}

function StepBody({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="flex-1 flex flex-col justify-center">
      <div className="text-[64px] leading-none mb-6">{emoji}</div>
      <h1 className="text-title text-white mb-3">{title}</h1>
      <p className="text-body text-gray-light leading-relaxed">{subtitle}</p>
    </div>
  );
}

function StepForm({ title, subtitle, icon, children }: { title: string; subtitle?: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
      {icon && <div className="text-accent mb-3">{icon}</div>}
      <h1 className="text-title text-white mb-1">{title}</h1>
      {subtitle && <p className="text-body text-gray mb-6">{subtitle}</p>}
      <div className="flex-1">{children}</div>
    </div>
  );
}
